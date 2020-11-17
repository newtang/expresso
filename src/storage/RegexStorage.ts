import { Storage, FoundRouteData } from '../interfaces';
import type { NextHandleFunction } from 'connect';
import { buildOptionsHandler } from './utils';

interface RouteMap {
  [key: string]: { [key: string]: FoundRouteData };
}

interface RegexStorageOptions {
  allowDuplicatePaths: boolean;
}

const DEFAULT_OPTIONS: RegexStorageOptions = { allowDuplicatePaths: false };

export default class RegexStorage implements Storage {
  readonly regexMap: Map<RegExp, { [method: string]: Array<NextHandleFunction> }>;
  readonly regexStringToRegex: { [regexString: string]: RegExp };
  readonly options: RegexStorageOptions;
  constructor(options: RegexStorageOptions = DEFAULT_OPTIONS) {
    this.regexMap = new Map();
    this.regexStringToRegex = {};
    this.options = options;
  }

  add(method: string, pathRegex: RegExp, handlers: Array<NextHandleFunction>): void {
    const regexString = pathRegex.toString();
    if (!this.regexStringToRegex[regexString]) {
      this.regexStringToRegex[regexString] = pathRegex;
    }

    pathRegex = this.regexStringToRegex[regexString];

    if (!this.regexMap.has(pathRegex)) {
      this.regexMap.set(pathRegex, {});
    }

    const methodToHandlers = this.regexMap.get(pathRegex) as Record<string, Array<NextHandleFunction>>;
    if (methodToHandlers[method]) {
      if (this.options.allowDuplicatePaths) {
        methodToHandlers[method].push(...handlers);
      } else {
        //needs tests
        throw new Error(
          `Duplicate path prohibited with allowDuplicatePaths=false. ${method}: ${regexString}`
        );
      }
    } else {
      methodToHandlers[method] = handlers;
    }
  }

  find(method: string, path: string): FoundRouteData | false {
    return false;
  }
}
