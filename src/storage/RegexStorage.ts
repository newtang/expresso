import { Storage, FoundRouteData } from '../interfaces';
import type { HandleFunction } from 'connect';
import { buildOptionsHandler } from './utils';

interface RegexStorageOptions {
  allowDuplicatePaths: boolean;
}

export default class RegexStorage implements Storage {
  readonly regexMap: Map<RegExp, { [method: string]: FoundRouteData }>;
  readonly regexStringToRegex: { [regexString: string]: RegExp };
  readonly options: RegexStorageOptions;
  constructor(options: RegexStorageOptions) {
    this.regexMap = new Map();
    this.regexStringToRegex = {};
    this.options = options;
  }

  add(method: string, pathRegex: RegExp, handlers: Array<HandleFunction>): void {
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
    for (const [regex, methodToHandlers] of this.regexMap) {
      const result =
        methodToHandlers[method] ||
        methodToHandlers[method === 'HEAD' ? 'GET' : ''] ||
        methodToHandlers['ALL'];
      if (result && regex.test(path)) {
        return result;
      }
    }
    if (method === 'OPTIONS') {
      return optionsFind(this, path);
    }
    return false;
  }
}

function optionsFind(storage: RegexStorage, path: string): FoundRouteData | false {
  for (const [regex, methodToHandlers] of storage.regexMap) {
    if (regex.test(path)) {
      const handlers = [buildOptionsHandler(Object.keys(methodToHandlers))];
      storage.add('OPTIONS', regex, handlers);
      return { target: handlers };
    }
  }
  return false;
}
