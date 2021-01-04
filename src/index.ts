import { NextHandleFunction, HandleFunction, ErrorHandleFunction } from 'connect';
import type { Request, Response, NextFunction, RequestParamHandler } from 'express';
import { Storage, RouterOptions, Router, RouteMethods, PathParams } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';
import { defaultOptions, validatePath, validateOptions } from './utils/validators';

type UseHandler = {
  pathStart: string;
  handlers: Array<HandleFunction>;
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
  const routerObj = buildRouterMethods(handler, routeStorage, useHandlers, options);
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
  path: PathParams
):
  | { [key: string]: (path: string, ...handlers: Array<HandleFunction | Array<HandleFunction>>) => void }
  | { path: string } {
  const routerObjBindClone = { path: path && path.toString() };
  for (const method in routerObj) {
    routerObjBindClone[method] = function (
      ...handlers: Array<HandleFunction>
    ): { [key: string]: (path: PathParams, ...handlers: Array<HandleFunction>) => void } | { path: string } {
      routerObj[method](path, ...handlers);
      return routerObjBindClone;
    };
  }
  return routerObjBindClone;
}

function buildUse(
  useHandlers: Array<UseHandler>,
  handlerOrPathStart: string | Array<string> | HandleFunction | Array<HandleFunction | Array<HandleFunction>>,
  ...handlers: Array<HandleFunction>
): Router {
  let pathStarts = ['/'];

  if (typeof handlerOrPathStart === 'function') {
    handlers.unshift(handlerOrPathStart);
  } else {
    if (Array.isArray(handlerOrPathStart)) {
      handlerOrPathStart = handlerOrPathStart.flat(2) as Array<HandleFunction> | Array<string>;

      if (!handlerOrPathStart.length) {
        throw new Error(`Invalid path: ${handlerOrPathStart}`);
      }

      if (typeof handlerOrPathStart[0] === 'string') {
        pathStarts = handlerOrPathStart as Array<string>;
      } else if (typeof handlerOrPathStart[0] === 'function') {
        handlers.unshift(...(handlerOrPathStart as Array<HandleFunction>));
      }
    } else {
      pathStarts = [handlerOrPathStart];
    }
  }

  if (!pathStarts || !pathStarts.length) {
    throw new Error(`Invalid path: ${pathStarts}`);
  }

  validateUseHandlers(handlers);

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

function validateUseHandlers(handlers: Array<HandleFunction>): void {
  if (!handlers || !handlers.length) {
    throw new Error('Handler must be a function');
  }

  for (const handler of handlers) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
  }
}

function handleRequest(
  routeStorage: Storage,
  useHandlers: Array<UseHandler>,
  options: RouterOptions,
  req: Request,
  res: Response,
  callback: NextFunction
): void {
  const verb = req.method;
  const path = req.path || req.url;
  const payload = routeStorage.find(verb, path);
  const done = restore(req, callback, 'baseUrl', 'next', 'params', 'originalUrl');

  if (payload && payload.target) {
    req.params = payload.params || {};
    executeHandlers(req, res, done, payload.target);
  } else {
    const useHandlerFunctions = getRelevantUseHandlers(path, useHandlers, options.caseSensitive);
    executeHandlers(req, res, done, useHandlerFunctions);
  }
}

function restore(target, callback, ...props): () => void {
  const saved = {};
  for (const prop of props) {
    saved[prop] = target[prop];
  }

  return function (...args): void {
    for (const prop in saved) {
      target[prop] = saved[prop];
    }
    callback(...args);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleNextError(handle: HandleFunction, error: any, req: Request, res: Response, next): void {
  if (handle.length !== 4) {
    // not a standard error handler
    return next(error);
  }

  try {
    (handle as ErrorHandleFunction)(error, req, res, next);
  } catch (err) {
    next(err);
  }
}

function handleNextRequest(
  handle: HandleFunction,
  req: Request,
  res: Response,
  next: (err?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
): void {
  if (handle.length > 3) {
    // not a standard request handler
    return next();
  }

  try {
    (handle as NextHandleFunction)(req, res, next);
  } catch (err) {
    next(err);
  }
}

function executeHandlers(
  req: Request,
  res: Response,
  done: NextFunction,
  handlerStack: Array<HandleFunction>
): void {
  let index = 0;
  next();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function next(err?: any): void {
    /**
     * This should exit the current route handler, then go to the next valid route handler
     * However, since we sort of merge all the route handlers, this doesn't work as it should
     * Requires some reworking to enable this functionality.
     * Issue #15
     *
     **/

    if (err === 'route') {
      return done();
    }

    // exit router
    if (err === 'router') {
      return done();
    }

    const nextHandler = handlerStack[index++];
    if (nextHandler) {
      if (err) {
        return handleNextError(nextHandler, err, req, res, next);
      } else {
        return handleNextRequest(nextHandler, req, res, next);
      }
    } else {
      return done(err);
    }
  }
}

function buildRouterMethods(
  context: unknown,
  routeStorage: CompositeStorage,
  useHandlers: Array<UseHandler>,
  options: RouterOptions
): RouteMethods {
  const routerObj = {};
  for (const capsMethod of METHODS) {
    const method = capsMethod.toLowerCase();
    /**
     * The value of the method property on req always seems to be capitalized.
     * Using the capitalized method (as opposed to lowercasing it on every request)
     * is actually a relatively significant optimization
     **/
    routerObj[method] = addRoute.bind(context as Router, capsMethod, routeStorage, useHandlers, options);
  }
  return routerObj as RouteMethods;
}

//router.get(...), router.post(...)
function addRoute(
  method: string,
  routeStorage: CompositeStorage,
  useHandlers: Array<UseHandler>,
  options: RouterOptions,
  path: PathParams,
  ...handlers: Array<HandleFunction | Array<HandleFunction>>
): Router {
  const paths = Array.isArray(path) ? path : [path];

  if (!paths || !paths.length) {
    throw new Error(`Invalid path: ${path}`);
  }

  const allhandlers = handlers.flat(2);

  for (const p of paths) {
    routeStorage.add(method, p, [
      ...getRelevantUseHandlers(p, useHandlers, options.caseSensitive),
      ...allhandlers,
    ]);
  }

  return this as Router;
}

function getRelevantUseHandlersForRegex(
  path: RegExp,
  useHandlers: Array<UseHandler>,
  caseSensitive: boolean
): Array<HandleFunction> {
  const arr: Array<HandleFunction> = [];
  for (const useHandler of useHandlers) {
    arr.push(
      trimPathPrefix.bind(null, useHandler.pathStart) as HandleFunction,
      (((req: Request, res: Response, done: HandleFunction) => {
        if (validStartsWith(req.originalUrl, useHandler.pathStart, caseSensitive)) {
          executeHandlers(req, res, done as NextFunction, useHandler.handlers);
        } else {
          (done as NextFunction)();
        }
      }) as unknown) as HandleFunction,
      resetPathPrefix.bind(null, useHandler.pathStart) as HandleFunction
    );
  }

  return arr;
}

function validStartsWith(path: string, pathStart: string, caseSensitive: boolean): boolean {
  if (!caseSensitive) {
    path = path.toLowerCase();
    pathStart = pathStart.toLowerCase();
  }

  return path === pathStart || (path.startsWith(pathStart) && path.startsWith(`${pathStart}/`));
}

function getRelevantUseHandlers(
  path: string | RegExp,
  useHandlers: Array<UseHandler>,
  caseSensitive: boolean
): Array<HandleFunction> {
  if (path instanceof RegExp) {
    return getRelevantUseHandlersForRegex(path, useHandlers, caseSensitive);
  }

  const arr: Array<HandleFunction> = [];
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

    if (validStartsWith(path, useHandler.pathStart, caseSensitive)) {
      arr.push(
        trimPathPrefix.bind(null, useHandler.pathStart) as HandleFunction,
        ...useHandler.handlers,
        resetPathPrefix.bind(null, useHandler.pathStart) as HandleFunction
      );
    }
  }

  return arr;
}

function resetPathPrefix(prefix: string, req: Request, res: Response, next: NextFunction): void {
  if (req.url === '/') {
    req.url = prefix;
    req.baseUrl = req.baseUrl.slice(0, req.baseUrl.length - prefix.length);
  } else {
    req.url = `${prefix}${req.url}`;
    req.baseUrl = req.baseUrl.slice(0, req.baseUrl.length - prefix.length);
  }

  //to restore to a non-strict route if necessary
  if (`${req.url}/` === req.originalUrl) {
    req.url = `${req.url}/`;
  }

  next();
}

function trimPathPrefix(prefix: string, req: Request, res: Response, next: NextFunction): void {
  req.originalUrl = req.originalUrl || req.url;
  req.url = req.url.slice(prefix.length) || '/';
  req.baseUrl = `${req.baseUrl || ''}${prefix}`;
  next();
}
