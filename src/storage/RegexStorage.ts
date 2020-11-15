import { Storage, FoundRouteData } from '../interfaces';
import type { NextHandleFunction } from 'connect';
import { buildOptionsHandler } from './utils';

interface RouteMap {
  [key: string]: { [key: string]: FoundRouteData };
}

interface StaticStorageOptions {
  allowDuplicatePaths: boolean;
  caseSensitive: boolean;
}

const DEFAULT_OPTIONS: StaticStorageOptions = { allowDuplicatePaths: false, caseSensitive: false };

export default class RegexStorage implements Storage {
  readonly regexMap: Map<RegExp, {[method:string]: Array<NextHandleFunction>}>;
  readonly regexStringToRegex: {[regexString:string]: RegExp};
  readonly options: StaticStorageOptions;
  constructor(options: StaticStorageOptions = DEFAULT_OPTIONS) {
    this.regexMap = new Map();
    this.options = options;
  }

  add(method: string, pathRegex: RegExp, handlers: Array<NextHandleFunction>): void {
    const regexString = pathRegex.toString();
    if(!regexStringToRegex[regexString]){
      regexStringToRegex[regexString] = pathRegex;
    }
    
    pathRegex = regexStringToRegex[regexString];

    if(!regexMap.has(pathRegex)){
      regexMap.set(pathRegex, {});
    }

    const methodToHandlers = regexMap.get(pathRegex);
    if(methodToHandlers[method]){
      if(this.options.allowDuplicatePaths){
        methodToHandlers[method].push(...handlers);
      }
      else{
        throw new Error(`Duplicate path prohibited with allowDuplicatePaths=false. ${method}: ${regexString}`);
      }
    }
    else{
      methodToHandlers[method] = handlers;
    }
    
  }

  find(method: string, path: string): FoundRouteData | false {
    
  }
}

