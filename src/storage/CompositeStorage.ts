import type { NextHandleFunction } from 'connect';
import { FoundRouteData, Storage, ParamStorage, RouterOptions } from '../interfaces';
import StaticStorage from './StaticStorage';
import ParamRadixTreeStorage from './ParamRadixTreeStorage';
import RegexStorage from './RegexStorage';
import { validatePath } from '../utils/stringUtils';

export default class CompositeStorage implements ParamStorage {
  readonly staticStorage: Storage;
  readonly paramStorage: ParamRadixTreeStorage;
  readonly regexStorage: RegexStorage;
  readonly options: RouterOptions;
  readonly useHandlers: Array<{ pathStart: string; handlers: Array<NextHandleFunction> }>;

  constructor(options: RouterOptions) {
    this.options = options;
    this.staticStorage = new StaticStorage(this.options);
    this.paramStorage = new ParamRadixTreeStorage(this.options);
    this.regexStorage = new RegexStorage(this.options);
    this.useHandlers = [];
  }

  add(method: string, path: string | RegExp, handlers: Array<NextHandleFunction>): void {
    validatePath(path, { allowColon: true });
    validateHandlers(path, handlers);

    const storage =
      path instanceof RegExp
        ? this.regexStorage
        : path.indexOf(':') === -1
        ? this.staticStorage
        : this.paramStorage;

    const validPaths = getValidPaths(path, this.options);

    for (const p of validPaths) {
      storage.add(method, p, handlers);
    }
  }

  find(method: string, path: string): FoundRouteData | false {
    return (
      this.staticStorage.find(method, path) ||
      this.paramStorage.find(method, path) ||
      this.regexStorage.find(method, path)
    );
  }

  param(name: string, callback: NextHandleFunction): void {
    return this.paramStorage.param(name, callback);
  }
}

function validateHandlers(path: string | RegExp, handlers: Array<NextHandleFunction>): void {
  for (const handler of handlers) {
    if (typeof handler !== 'function') {
      throw new Error(`Non function handler found for path: ${path}`);
    }
  }
}

function getValidPaths(userPath: string | RegExp, options: RouterOptions): Array<string | RegExp> {
  if (userPath instanceof RegExp) {
    return [userPath];
  }

  const validPaths = options.strict ? [userPath] : getNonStrictPaths(userPath);

  return validPaths;
}

function getNonStrictPaths(path: string): Array<string> {
  if (path === '/') {
    return [path];
  }

  const endsWithSlashPath = path.endsWith('/') ? path : `${path}/`;

  const noEndingSlashPath = !path.endsWith('/') ? path : path.slice(0, path.length - 1);

  return [endsWithSlashPath, noEndingSlashPath];
}
