import type { NextHandleFunction, HandleFunction } from 'connect';
import type { RequestHandler, RequestParamHandler } from 'express';

export interface Storage {
  find(method: string, path: string): FoundRouteData | false;
  add(method: string, path: string | RegExp, handlers: Array<HandleFunction>): void;
}

export interface ParamStorage extends Storage {
  param(name: string, callback: RequestParamHandler): void;
}

export interface FoundRouteData {
  target: Array<HandleFunction>;
  params?: { [param: string]: string };
}

export interface RouterOptions {
  allowDuplicateParams: boolean;
  allowDuplicatePaths: boolean;
  allowRegex: false | 'safe' | 'all';
  caseSensitive: boolean;
  strict: boolean;
}

export type PathParams = string | RegExp | Array<string | RegExp>;

export interface Route {
  acl: (...handlers: Array<RequestHandler>) => Route;
  bind: (...handlers: Array<RequestHandler>) => Route;
  checkout: (...handlers: Array<RequestHandler>) => Route;
  connect: (...handlers: Array<RequestHandler>) => Route;
  copy: (...handlers: Array<RequestHandler>) => Route;
  delete: (...handlers: Array<RequestHandler>) => Route;
  get: (...handlers: Array<RequestHandler>) => Route;
  head: (...handlers: Array<RequestHandler>) => Route;
  link: (...handlers: Array<RequestHandler>) => Route;
  lock: (...handlers: Array<RequestHandler>) => Route;
  merge: (...handlers: Array<RequestHandler>) => Route;
  mkactivity: (...handlers: Array<RequestHandler>) => Route;
  mkcalendar: (...handlers: Array<RequestHandler>) => Route;
  mkcol: (...handlers: Array<RequestHandler>) => Route;
  move: (...handlers: Array<RequestHandler>) => Route;
  'm-search': (...handlers: Array<RequestHandler>) => Route;
  notify: (...handlers: Array<RequestHandler>) => Route;
  options: (...handlers: Array<RequestHandler>) => Route;
  patch: (...handlers: Array<RequestHandler>) => Route;
  post: (...handlers: Array<RequestHandler>) => Route;
  propfind: (...handlers: Array<RequestHandler>) => Route;
  proppatch: (...handlers: Array<RequestHandler>) => Route;
  purge: (...handlers: Array<RequestHandler>) => Route;
  put: (...handlers: Array<RequestHandler>) => Route;
  rebind: (...handlers: Array<RequestHandler>) => Route;
  report: (...handlers: Array<RequestHandler>) => Route;
  search: (...handlers: Array<RequestHandler>) => Route;
  subscribe: (...handlers: Array<RequestHandler>) => Route;
  trace: (...handlers: Array<RequestHandler>) => Route;
  unlink: (...handlers: Array<RequestHandler>) => Route;
  unlock: (...handlers: Array<RequestHandler>) => Route;
  unsubscribe: (...handlers: Array<RequestHandler>) => Route;
}

export interface RouteMethods {
  acl: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  bind: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  checkout: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  connect: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  copy: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  delete: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  get: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  head: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  link: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  lock: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  merge: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  mkactivity: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  mkcalendar: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  mkcol: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  move: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  'm-search': (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  notify: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  options: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  patch: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  post: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  propfind: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  proppatch: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  purge: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  put: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  rebind: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  report: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  search: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  subscribe: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  trace: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  unlink: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  unlock: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  unsubscribe: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
}

export interface Router extends NextHandleFunction, RouteMethods {
  use: (
    handlerOrPathStart: string | Array<string> | RequestHandler,
    ...handlers: Array<RequestHandler>
  ) => Router;
  param: (name: string, callback: RequestParamHandler) => Router;
  route: (path: PathParams) => Route;
}
