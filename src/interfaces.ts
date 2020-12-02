import type { NextHandleFunction } from 'connect';

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
