import { Storage, FoundRouteData } from '../interfaces';
import type { HandleFunction } from 'connect';
import { buildOptionsHandler } from './utils';

interface RouteMap {
  [key: string]: { [key: string]: FoundRouteData };
}

interface StaticStorageOptions {
  allowDuplicatePaths: boolean;
  caseSensitive: boolean;
}

const DEFAULT_OPTIONS: StaticStorageOptions = { allowDuplicatePaths: false, caseSensitive: false };

export default class StaticStorage implements Storage {
  readonly routes: RouteMap;
  readonly options: StaticStorageOptions;
  constructor(options: StaticStorageOptions = DEFAULT_OPTIONS) {
    this.routes = {};
    this.options = options;
  }

  add(method: string, path: string, handlers: Array<HandleFunction>): void {
    path = modifyPath(path, this.options);
    if (!this.routes[path]) {
      this.routes[path] = {};
    }

    if (this.routes[path][method]) {
      if (this.options.allowDuplicatePaths) {
        this.routes[path][method].target.push(...handlers);
      } else {
        throw new Error(`Duplicate path prohibited with allowDuplicatePaths=false. ${method}: ${path}`);
      }
    } else {
      this.routes[path][method] = { target: handlers };
    }
  }

  find(method: string, path: string): FoundRouteData | false {
    path = this.options.caseSensitive ? path : path.toLowerCase();

    const pathRoutes = this.routes[path];
    const result =
      (pathRoutes &&
        (pathRoutes[method] || pathRoutes[method === 'HEAD' ? 'GET' : ''] || pathRoutes['ALL'])) ||
      false;
    if (result) {
      return result;
    } else {
      if (method === 'OPTIONS' && pathRoutes) {
        const handlers = [buildOptionsHandler(Object.keys(pathRoutes))];
        this.add('OPTIONS', path, handlers);
        return { target: handlers };
      }

      return false;
    }
  }
}

function modifyPath(path: string, options: StaticStorageOptions): string {
  return options.caseSensitive ? path : path.toLowerCase();
}
