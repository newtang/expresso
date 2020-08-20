import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';
import { Storage, RouterOptions } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';
import pathToRegexp = require('path-to-regexp');

type UseHandler = {
  pathStart: string;
  regexp: RegExp;
  handlers: Array<NextHandleFunction>;
};

type Router = {
  use: (handlerOrPathStart: string | NextHandleFunction, ...handlers: Array<NextHandleFunction>) => Router;
};

interface RouterUserOptions {
  allowDuplicateParams?: boolean;
  allowDuplicatePaths?: boolean;
  strict?: boolean;
  caseSensitive?: boolean;
}

const defaultOptions: RouterOptions = {
  allowDuplicateParams: false,
  allowDuplicatePaths: false,
  strict: false,
  caseSensitive: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRouter(userOptions?: RouterUserOptions): any {
  const options = Object.assign({}, defaultOptions, userOptions);
  const routeStorage = new CompositeStorage(options);

  const handler = handleRequest.bind(null, routeStorage, options);
  const useHandlers: Array<UseHandler> = [];
  const use = buildUse.bind(handler, useHandlers);
  const routerObj = buildRouterMethods(routeStorage, useHandlers);

  return Object.assign(handler, { use }, routerObj);
}

export = buildRouter;

function buildUse(
  useHandlers: Array<UseHandler>,
  handlerOrPathStart: string | NextHandleFunction,
  ...handlers: Array<NextHandleFunction>
): Router {
  let pathStart = '/';
  if (typeof handlerOrPathStart === 'string') {
    pathStart = handlerOrPathStart;
  } else {
    handlers.unshift(handlerOrPathStart);
  }

  useHandlers.push({
    pathStart,
    handlers,
    regexp: pathToRegexp(pathStart, [], { strict: false, end: false }),
  });

  return this;
}

function handleRequest(
  routeStorage: Storage,
  options: RouterOptions,
  req: Request,
  res: Response,
  done: NextFunction
): void {
  const verb = req.method;
  const payload = routeStorage.find(verb, req.path);
  if (payload && payload.target) {
    req.params = payload.params || {};
    executeHandlers(req, res, done, payload.target);
  } else {
    return done();
  }
}

function executeHandlers(
  req: Request,
  res: Response,
  done: NextFunction,
  handlerStack: Array<NextHandleFunction>
): void {
  let index = 0;
  next();
  function next(err?: Error): void {
    if (err) {
      return done(err);
    }
    const nextHandler = handlerStack[index++];
    if (nextHandler) {
      try {
        nextHandler(req, res, next);
      } catch (handlerException) {
        return done(handlerException);
      }
    } else {
      done();
    }
  }
}

function buildRouterMethods(
  routeStorage: Storage,
  useHandlers: Array<UseHandler>
): { [key: string]: (path: string, ...handlers: Array<NextHandleFunction>) => void } {
  const routerObj: { [key: string]: (path: string, ...handlers: Array<NextHandleFunction>) => void } = {};
  for (const capsMethod of METHODS) {
    const method = capsMethod.toLowerCase();
    /**
     * The value of the method property on req always seems to be capitalized.
     * Using the capitalized method (as opposed to lowercasing it on every request)
     * is actually a relatively significant optimization
     **/
    routerObj[method] = addRoute.bind(null, capsMethod, routeStorage, useHandlers);
  }
  return routerObj;
}

function addRoute(
  method: string,
  routeStorage: Storage,
  useHandlers: Array<UseHandler>,
  path: string,
  ...handlers: Array<NextHandleFunction>
): void {
  routeStorage.add(method, path, [...getRelevantUseHandlers(path, useHandlers), ...handlers]);
}

function getRelevantUseHandlers(path: string, useHandlers: Array<UseHandler>): Array<NextHandleFunction> {
  const arr: Array<NextHandleFunction> = [];
  for (const useHandler of useHandlers) {
    if (useHandler.regexp.test(path)) {
      arr.push(...useHandler.handlers);
    }
  }
  return arr;
}
