import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction, RequestParamHandler } from 'express';
import { Storage, RouterOptions, Router, RouteMethods, PathParams } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';
import { defaultOptions, validatePath, validateOptions } from './utils/validators';

type UseHandler = {
  pathStart: string;
  handlers: Array<NextHandleFunction>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRouter(userOptions?: Partial<RouterOptions>): Router {
  const options = Object.assign({}, defaultOptions, userOptions);
  validateOptions(options);
  const routeStorage = new CompositeStorage(options);

  const useHandlers: Array<UseHandler> = [];
  const handler = handleRequest.bind(null, routeStorage, useHandlers, options);

  const param: (name: string, callback: RequestParamHandler) => Router = buildParam.bind(
    handler,
    routeStorage
  );
  const use = buildUse.bind(handler, useHandlers);
  const routerObj = buildRouterMethods(handler, routeStorage, useHandlers);
  const route = routeFxn.bind(null, routerObj);

  return (Object.assign(handler, { use, param, route }, routerObj) as unknown) as Router;
}

function buildParam(routeStorage: CompositeStorage, name: string, callback: RequestParamHandler): Router {
  routeStorage.param(name, callback);
  return this;
}

export = buildRouter;

function routeFxn(
  routerObj,
  path: string | RegExp | Array<string | RegExp>
): { [key: string]: (path: string, ...handlers: Array<NextHandleFunction>) => void } {
  const routerObjBindClone = {};
  for (const method in routerObj) {
    routerObjBindClone[method] = function (
      ...handlers: Array<NextHandleFunction>
    ): { [key: string]: (path: string | RegExp, ...handlers: Array<NextHandleFunction>) => void } {
      routerObj[method](path, ...handlers);
      return routerObjBindClone;
    };
  }
  return routerObjBindClone;
}

function buildUse(
  useHandlers: Array<UseHandler>,
  handlerOrPathStart: string | Array<string> | NextHandleFunction,
  ...handlers: Array<NextHandleFunction>
): Router {
  let pathStarts = ['/'];

  if (typeof handlerOrPathStart === 'function') {
    handlers.unshift(handlerOrPathStart);
  } else {
    if (Array.isArray(handlerOrPathStart)) {
      pathStarts = handlerOrPathStart;
    } else {
      pathStarts = [handlerOrPathStart];
    }
  }

  if (!pathStarts || !pathStarts.length) {
    throw new Error(`Invalid path: ${pathStarts}`);
  }

  for (let pathStart of pathStarts) {
    //we don't support regex in use quite yet.
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((pathStart as any) instanceof RegExp) {
      throw new Error(`router.use does not support regular expressions yet: ${pathStart}`);
    }
    validatePath(pathStart, { allowColon: false, allowRegex: false });

    if (pathStart.charAt(pathStart.length - 1) === '/') {
      pathStart = pathStart.slice(0, pathStart.length - 1);
    }

    useHandlers.push({
      pathStart,
      handlers,
    });
  }

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
  context: unknown,
  routeStorage: CompositeStorage,
  useHandlers: Array<UseHandler>
): RouteMethods {
  const routerObj = {};
  for (const capsMethod of METHODS) {
    const method = capsMethod.toLowerCase();
    /**
     * The value of the method property on req always seems to be capitalized.
     * Using the capitalized method (as opposed to lowercasing it on every request)
     * is actually a relatively significant optimization
     **/
    routerObj[method] = addRoute.bind(context as Router, capsMethod, routeStorage, useHandlers);
  }
  return routerObj as RouteMethods;
}

//router.get(...), router.post(...)
function addRoute(
  method: string,
  routeStorage: CompositeStorage,
  useHandlers: Array<UseHandler>,
  path: PathParams,
  ...handlers: Array<NextHandleFunction>
): Router {
  const paths = Array.isArray(path) ? path : [path];

  if (!paths || !paths.length) {
    throw new Error(`Invalid path: ${path}`);
  }

  for (const p of paths) {
    routeStorage.add(method, p, [...getRelevantUseHandlers(p, useHandlers, true), ...handlers]);
  }

  return this as Router;
}

function getRelevantUseHandlersForRegex(
  path: RegExp,
  useHandlers: Array<UseHandler>,
  reset: boolean
): Array<NextHandleFunction> {
  const arr: Array<NextHandleFunction> = [];
  for (const useHandler of useHandlers) {
    arr.push(
      trimPathPrefix.bind(null, useHandler.pathStart) as NextHandleFunction,
      (((req: Request, res: Response, done: NextHandleFunction) => {
        if (validStartsWith(req.originalUrl, useHandler.pathStart)) {
          executeHandlers(req, res, done as NextFunction, useHandler.handlers);
        } else {
          (done as NextFunction)();
        }
      }) as unknown) as NextHandleFunction
    );
  }

  //reset properties before verb handlers.
  if (arr.length && reset) {
    arr.push(resetPathPrefix as NextHandleFunction);
  }

  return arr;
}

function validStartsWith(path: string, pathStart: string): boolean {
  return path === pathStart || (path.startsWith(pathStart) && path.startsWith(`${pathStart}/`));
}

function getRelevantUseHandlers(
  path: string | RegExp,
  useHandlers: Array<UseHandler>,
  reset: boolean
): Array<NextHandleFunction> {
  if (path instanceof RegExp) {
    return getRelevantUseHandlersForRegex(path, useHandlers, reset);
  }

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

    if (validStartsWith(path, useHandler.pathStart)) {
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
