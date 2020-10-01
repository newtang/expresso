import type { NextHandleFunction } from 'connect';

export interface Storage {
  add(method: string, path: string, handlers: Array<NextHandleFunction>): void;
  find(method: string, path: string): FoundRouteData | 405 | false;
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
  strict: boolean;
  caseSensitive: boolean;
}
