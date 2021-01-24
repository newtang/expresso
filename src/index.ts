import type { HandleFunction } from 'connect';
import type { Request, Response, NextFunction, RequestParamHandler } from 'express';
import type { Storage, RouterOptions, Router, RouteMethods, PathParams } from './interfaces';
import { METHODS } from 'http';
import CompositeStorage from './storage/CompositeStorage';
import { defaultOptions, validateOptions } from './utils/validators';
import { buildUse, UseLib } from './lib/use';
import executeHandlers from './utils/executeHandlers';

function buildRouter(userOptions?: Partial<RouterOptions>): Router {
  const options = getValidOptions(userOptions);
  const routeStorage = new CompositeStorage(options);

  const useObj = buildUse(options);
  const handler = handleRequest.bind(null, routeStorage, useObj);
  const use = useObj.use.bind(handler);
  const param = buildParam.bind(handler, routeStorage);

  const routerMethods = buildRouterMethods(handler, routeStorage, useObj);
  const route = routeFxn.bind(null, routerMethods);

  return (Object.assign(handler, { use, param, route }, routerMethods) as unknown) as Router;
}

export = buildRouter;

function getValidOptions(userOptions?: Partial<RouterOptions>): RouterOptions {
  const options = Object.assign({}, defaultOptions, userOptions);
  validateOptions(options);
  return options;
}

function buildParam(routeStorage: CompositeStorage, name: string, callback: RequestParamHandler): Router {
  routeStorage.param(name, callback);
  return this;
}

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

function handleRequest(
  routeStorage: Storage,
  useObj: UseLib,
  req: Request,
  res: Response,
  callback: NextFunction
): void {
  const verb = req.method;
  const path = req.path || req.url;
  const payload = routeStorage.find(verb, path);
  const done = restore(req, callback);

  if (payload && payload.target) {
    req.params = payload.params || {};
    executeHandlers(req, res, done, payload.target);
  } else {
    const useHandlerFunctions = useObj.getRelevantUseHandlers(path);
    executeHandlers(req, res, done, useHandlerFunctions);
  }
}

/**
 * I used to have a nice array of properties I would pass in and loop through, 
 * but it was noticiably faster to just set a few variables.
 **/
function restore(target, callback): () => void {
  const oldBaseUrl = target.baseUrl;
  const oldNext = target.next;
  const oldParams = target.params;
  const oldOriginalUrl = target.originalUrl;

  return function (...args): void {
    target.baseUrl = oldBaseUrl;
    target.next = oldNext;
    target.params = oldParams;
    target.originalUrl = oldOriginalUrl;
    callback(...args);
  };
}

function buildRouterMethods(context: unknown, routeStorage: CompositeStorage, useObj: UseLib): RouteMethods {
  const routerObj = {};
  for (const capsMethod of ['ALL', ...METHODS]) {
    const method = capsMethod.toLowerCase();
    /**
     * The value of the method property on req always seems to be capitalized.
     * Using the capitalized method (as opposed to lowercasing it on every request)
     * is actually a relatively significant optimization
     **/
    routerObj[method] = addRoute.bind(context as Router, capsMethod, routeStorage, useObj);
  }
  return routerObj as RouteMethods;
}

//router.get(...), router.post(...)
function addRoute(
  method: string,
  routeStorage: CompositeStorage,
  useObj: UseLib,
  path: PathParams,
  ...handlers: Array<HandleFunction | Array<HandleFunction>>
): Router {
  const paths = Array.isArray(path) ? path : [path];

  if (!paths || !paths.length) {
    throw new Error(`Invalid path: ${path}`);
  }

  const allhandlers = handlers.flat(2);

  for (const p of paths) {
    routeStorage.add(method, p, [...useObj.getRelevantUseHandlers(p), ...allhandlers]);
  }

  return this as Router;
}
