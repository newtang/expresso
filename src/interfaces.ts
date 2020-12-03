import type { NextHandleFunction } from 'connect';
import type { IRouterMatcher } from 'express';

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


// export interface Methods {
// 	/**
//      * Special-cased "all" method, applying the given route `path`,
//      * middleware, and callback to _every_ HTTP method.
//      */
//     all: IRouterMatcher<this, 'all'>;
//     get: IRouterMatcher<this, 'get'>;
//     post: IRouterMatcher<this, 'post'>;
//     put: IRouterMatcher<this, 'put'>;
//     delete: IRouterMatcher<this, 'delete'>;
//     patch: IRouterMatcher<this, 'patch'>;
//     options: IRouterMatcher<this, 'options'>;
//     head: IRouterMatcher<this, 'head'>;

//     checkout: IRouterMatcher<this>;
//     connect: IRouterMatcher<this>;
//     copy: IRouterMatcher<this>;
//     lock: IRouterMatcher<this>;
//     merge: IRouterMatcher<this>;
//     mkactivity: IRouterMatcher<this>;
//     mkcol: IRouterMatcher<this>;
//     move: IRouterMatcher<this>;
//     "m-search": IRouterMatcher<this>;
//     notify: IRouterMatcher<this>;
//     propfind: IRouterMatcher<this>;
//     proppatch: IRouterMatcher<this>;
//     purge: IRouterMatcher<this>;
//     report: IRouterMatcher<this>;
//     search: IRouterMatcher<this>;
//     subscribe: IRouterMatcher<this>;
//     trace: IRouterMatcher<this>;
//     unlock: IRouterMatcher<this>;
//     unsubscribe: IRouterMatcher<this>;
// }