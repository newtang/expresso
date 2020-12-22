import type { NextHandleFunction, HandleFunction, ErrorHandleFunction } from 'connect';
import type { RequestHandler, RequestParamHandler, IRouterMatcher, IRouterHandler } from 'express';

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
  acl: IRouterHandler<Route>;
  bind: IRouterHandler<Route>;
  checkout: IRouterHandler<Route>;
  connect: IRouterHandler<Route>;
  copy: IRouterHandler<Route>;
  delete: IRouterHandler<Route>;
  get: IRouterHandler<Route>;
  head: IRouterHandler<Route>;
  link: IRouterHandler<Route>;
  lock: IRouterHandler<Route>;
  merge: IRouterHandler<Route>;
  mkactivity: IRouterHandler<Route>;
  mkcalendar: IRouterHandler<Route>;
  mkcol: IRouterHandler<Route>;
  move: IRouterHandler<Route>;
  'm-search': IRouterHandler<Route>;
  notify: IRouterHandler<Route>;
  options: IRouterHandler<Route>;
  patch: IRouterHandler<Route>;
  post: IRouterHandler<Route>;
  propfind: IRouterHandler<Route>;
  proppatch: IRouterHandler<Route>;
  purge: IRouterHandler<Route>;
  put: IRouterHandler<Route>;
  rebind: IRouterHandler<Route>;
  report: IRouterHandler<Route>;
  search: IRouterHandler<Route>;
  subscribe: IRouterHandler<Route>;
  trace: IRouterHandler<Route>;
  unlink: IRouterHandler<Route>;
  unlock: IRouterHandler<Route>;
  unsubscribe: IRouterHandler<Route>;
}

export interface RouteMethods {
  acl: IRouterMatcher<Router>;
  bind: IRouterMatcher<Router>;
  checkout: IRouterMatcher<Router>;
  connect: IRouterMatcher<Router>;
  copy: IRouterMatcher<Router>;
  delete: IRouterMatcher<Router>;
  get: IRouterMatcher<Router>;
  head: IRouterMatcher<Router>;
  link: IRouterMatcher<Router>;
  lock: IRouterMatcher<Router>;
  merge: IRouterMatcher<Router>;
  mkactivity: IRouterMatcher<Router>;
  mkcalendar: IRouterMatcher<Router>;
  mkcol: IRouterMatcher<Router>;
  move: IRouterMatcher<Router>;
  'm-search': IRouterMatcher<Router>;
  notify: IRouterMatcher<Router>;
  options: IRouterMatcher<Router>;
  patch: IRouterMatcher<Router>;
  post: IRouterMatcher<Router>;
  propfind: IRouterMatcher<Router>;
  proppatch: IRouterMatcher<Router>;
  purge: IRouterMatcher<Router>;
  put: IRouterMatcher<Router>;
  rebind: IRouterMatcher<Router>;
  report: IRouterMatcher<Router>;
  search: IRouterMatcher<Router>;
  subscribe: IRouterMatcher<Router>;
  trace: IRouterMatcher<Router>;
  unlink: IRouterMatcher<Router>;
  unlock: IRouterMatcher<Router>;
  unsubscribe: IRouterMatcher<Router>;
}

export interface Router extends NextHandleFunction, RouteMethods {
  use: (
    handlerOrPathStart: string | Array<string> | RequestHandler,
    ...handlers: Array<RequestHandler>
  ) => Router;
  param: (name: string, callback: RequestParamHandler) => Router;
  route: (path: PathParams) => Route;
}
