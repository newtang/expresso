import type { NextHandleFunction } from 'connect';

export interface Storage {
  add(method: string, path: string, handlers: Array<NextHandleFunction>): void;
  find(method: string, path: string): FoundRouteData | false;
}

export interface FoundRouteData {
  target: Array<NextHandleFunction>;
  params?: { [param: string]: string };
}

export interface RouterOptions {
  allowDuplicateParams: boolean;
  strict: boolean;
  caseSensitive: boolean;
}
