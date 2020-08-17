import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';
import { Storage, RouterOptions } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';

type UseHandler = {
  pathStart: string;
  handlers: Array<NextHandleFunction>;
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

  const useHandlers: Array<UseHandler> = [];
  const use = buildUse.bind(null, useHandlers);
  const routerObj = buildRouterMethods(routeStorage, useHandlers);

  return Object.assign(handleRequest.bind(null, routeStorage, options), { use }, routerObj);
}

export = buildRouter;

function buildUse(
  useHandlers: Array<UseHandler>,
  handler: NextHandleFunction,
  ...handlers: Array<NextHandleFunction>
): void;
function buildUse(
  useHandlers: Array<UseHandler>,
  handler: string | NextHandleFunction,
  ...handlers: Array<NextHandleFunction>
): void {
  let pathStart = '/';
  if (typeof handler === 'string') {
    pathStart = handler;
  } else {
    handlers.unshift(handler);
  }

  useHandlers.push({ pathStart, handlers });
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
  const arr = [];
  for (const useHandler of useHandlers) {
    if (path.startsWith(useHandler.pathStart)) {
      arr.push(...useHandler.handlers);
    }
  }
  return arr;
}
