import { Storage, FoundRouteData } from '../interfaces';
import type { NextHandleFunction } from 'connect';

interface RouteMap {
  [key: string]: { [key: string]: FoundRouteData };
}

interface StaticStorageOptions {
  caseSensitive: boolean;
}

const DEFAULT_OPTIONS: StaticStorageOptions = { caseSensitive: false };

export default class StaticStorage implements Storage {
  routes: RouteMap;
  options: StaticStorageOptions;
  constructor(options: StaticStorageOptions = DEFAULT_OPTIONS) {
    this.routes = {};
    this.options = options;
  }

  add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
    path = modifyPath(path, this.options);
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    this.routes[path][method] = { target: handlers };
  }

  find(method: string, path: string): FoundRouteData | false {
    path = this.options.caseSensitive ? path : path.toLowerCase();

    const pathRoutes = this.routes[path];
    return (pathRoutes && pathRoutes[method]) || false;
  }
}

function modifyPath(path: string, options: StaticStorageOptions): string {
  return options.caseSensitive ? path : path.toLowerCase();
}
