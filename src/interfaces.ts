import type { NextHandleFunction } from 'connect';
import type { RequestHandler, RequestParamHandler } from 'express';

export interface Storage {
  find(method: string, path: string): FoundRouteData | false;
  add(method: string, path: string | RegExp, handlers: Array<NextHandleFunction>): void;
}

export interface ParamStorage extends Storage {
  param(name: string, callback: NextHandleFunction): void;
}

export interface FoundRouteData {
  target: Array<NextHandleFunction>;
  params?: { [param: string]: string };
}

export interface RouterOptions {
  allowDuplicateParams: boolean;
  allowDuplicatePaths: boolean;
  allowRegex: false | 'safe' | 'all';
  caseSensitive: boolean;
  strict: boolean;
}

type PathParams = string | RegExp | Array<string | RegExp>;

export interface Router extends NextHandleFunction {
  /**
   * Special-cased "all" method, applying the given route `path`,
   * middleware, and callback to _every_ HTTP method.
   */
  /*
    all: IRouterMatcher<this, 'all'>;
    */

  get: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  post: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  put: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  delete: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  patch: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  options: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;
  head: (path: PathParams, ...handlers: Array<RequestHandler>) => Router;

  /*
    checkout: IRouterMatcher<this>;
    connect: IRouterMatcher<this>;
    copy: IRouterMatcher<this>;
    lock: IRouterMatcher<this>;
    merge: IRouterMatcher<this>;
    mkactivity: IRouterMatcher<this>;
    mkcol: IRouterMatcher<this>;
    move: IRouterMatcher<this>;
    "m-search": IRouterMatcher<this>;
    notify: IRouterMatcher<this>;
    propfind: IRouterMatcher<this>;
    proppatch: IRouterMatcher<this>;
    purge: IRouterMatcher<this>;
    report: IRouterMatcher<this>;
    search: IRouterMatcher<this>;
    subscribe: IRouterMatcher<this>;
    trace: IRouterMatcher<this>;
    unlock: IRouterMatcher<this>;
    unsubscribe: IRouterMatcher<this>;
    */

  use: (handlerOrPathStart: string | RequestHandler, ...handlers: Array<RequestHandler>) => Router;
  param: (name: string, callback: RequestParamHandler) => Router;
  // route: (path: PathParams)
}
