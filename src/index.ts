import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';
import { Storage, RouterOptions } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';
import { validatePath } from './utils/stringUtils';

type UseHandler = {
  pathStart: string;
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

  const useHandlers: Array<UseHandler> = [];
  const handler = handleRequest.bind(null, routeStorage, useHandlers, options);

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

  if (typeof handlerOrPathStart === 'function') {
    handlers.unshift(handlerOrPathStart);
  } else {
    pathStart = handlerOrPathStart;
  }

  validatePath(pathStart, { allowColon: false });

  if (pathStart.charAt(pathStart.length - 1) === '/') {
    pathStart = pathStart.slice(0, pathStart.length - 1);
  }

  useHandlers.push({
    pathStart,
    handlers,
  });

  return this;
}

function handleRequest(
  routeStorage: Storage,
  useHandlers: Array<UseHandler>,
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
    const useHandlerFunctions = getRelevantUseHandlers(req.path, useHandlers, false);
    executeHandlers(req, res, done, useHandlerFunctions);
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
  routeStorage.add(method, path, [...getRelevantUseHandlers(path, useHandlers, true), ...handlers]);
}

function getRelevantUseHandlers(
  path: string,
  useHandlers: Array<UseHandler>,
  reset: boolean
): Array<NextHandleFunction> {
  const arr: Array<NextHandleFunction> = [];
  for (const useHandler of useHandlers) {
    /*
      use(/v1/api)
         - must start with this
         - cannot start with /v1/apiabc

         - remove ending slash from pathStart
           - path must start with pathStart and with pathStart with an ending slash
             /v1/api/ * works
             /v1/api/abc
             OR
           - path must equal pathStart.
             /v1/api

    */

    if (
      path === useHandler.pathStart ||
      (path.startsWith(useHandler.pathStart) && path.startsWith(`${useHandler.pathStart}/`))
    ) {
      arr.push(
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        (trimPathPrefix.bind(null, useHandler.pathStart) as any) as NextHandleFunction,
        ...useHandler.handlers
      );
    }
  }

  //reset properties before verb handlers.
  if (arr.length && reset) {
    arr.push(resetPathPrefix as NextHandleFunction);
  }

  return arr;
}

function resetPathPrefix(req: Request, res: Response, next: NextFunction): void {
  req.url = req.originalUrl;
  req.baseUrl = '';
  next();
}

function trimPathPrefix(prefix: string, req: Request, res: Response, next: NextFunction): void {
  req.url = req.url.slice(prefix.length) || '/';
  req.baseUrl = `${req.baseUrl}${prefix}`;
  next();
}
