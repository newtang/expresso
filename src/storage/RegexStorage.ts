import { Storage, FoundRouteData } from '../interfaces';
import type { NextHandleFunction } from 'connect';
import { buildOptionsHandler } from './utils';

interface RegexStorageOptions {
  allowDuplicatePaths: boolean;
}

const DEFAULT_OPTIONS: RegexStorageOptions = { allowDuplicatePaths: false };

export default class RegexStorage implements Storage {
  readonly regexMap: Map<RegExp, { [method: string]: FoundRouteData }>;
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

    const methodToHandlers = this.regexMap.get(pathRegex) as Record<string, FoundRouteData>;
    if (methodToHandlers[method]) {
      if (this.options.allowDuplicatePaths) {
        methodToHandlers[method].target.push(...handlers);
      } else {
        throw new Error(
          `Duplicate path prohibited with allowDuplicatePaths=false. ${method}: ${regexString}`
        );
      }
    } else {
      methodToHandlers[method] = { target: handlers };
    }
  }

  find(method: string, path: string): FoundRouteData | false {
    if (method === 'OPTIONS') {
      return optionsFind(this, path);
    }
    for (const [regex, methodToHandlers] of this.regexMap) {
      const result = methodToHandlers[method] || methodToHandlers[method === 'HEAD' ? 'GET' : ''];
      if (result && regex.test(path)) {
        return result;
      }
    }
    return false;
  }
}

function optionsFind(storage: RegexStorage, path: string): FoundRouteData | false {
  for (const [regex, methodToHandlers] of storage.regexMap) {
    if (regex.test(path)) {
      if (methodToHandlers['OPTIONS']) {
        return methodToHandlers['OPTIONS'];
      } else {
        const handlers = [buildOptionsHandler(Object.keys(methodToHandlers))];
        storage.add('OPTIONS', regex, handlers);
        return { target: handlers };
      }
    }
  }
  return false;
}
