import { FoundRouteData, ParamStorage } from '../interfaces';
import type { Request, Response, NextFunction, RequestParamHandler } from 'express';
import type { HandleFunction, NextHandleFunction } from 'connect';
import { lowercaseStaticParts } from '../utils/stringUtils';
import { buildOptionsHandler } from './utils';

const validParamChars = /[^A-Za-z0-9_]+/;
const validParamName = /^[A-Za-z0-9_]+$/;

export interface ReturnValue<T> {
  target: T;
  params: { [param: string]: string };
}

interface ParamStorageOptions {
  allowDuplicateParams: boolean;
  allowDuplicatePaths: boolean;
  caseSensitive: boolean;
}

const DEFAULT_OPTIONS: ParamStorageOptions = {
  allowDuplicateParams: false,
  allowDuplicatePaths: false,
  caseSensitive: false,
};

type ParamHash = { [param: string]: RequestParamHandler };

function buildParamOptionsHandler(methods: Array<string>): Array<HandleFunction> {
  return [buildOptionsHandler(methods)];
}

/**
 * This functions as a Radix Tree of nodes. If a node has
 * payload set, it is the end of a full, legitimate path
 *
 * Except for edges in the root node, edges do not begin with '/'
 **/

export default class ParamRadixTreeStorage implements ParamStorage {
  readonly root: Node<Array<HandleFunction>>;
  readonly options: ParamStorageOptions;
  readonly paramHash: ParamHash;
  constructor(options: ParamStorageOptions) {
    this.root = new Node<Array<HandleFunction>>();
    this.options = options;
    this.paramHash = {};
  }

  add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
    path = modifyPath(path, this.options);
    this.root.insert(method, path, handlers, this.options);
  }

  find(method: string, path: string): FoundRouteData | false {
    const result = this.root.search(method, path, this.options.caseSensitive, buildParamOptionsHandler);
    if (result) {
      const paramHandlers = getParamHandlers(result.params, this.paramHash);
      if (paramHandlers && paramHandlers.length) {
        result.target = [...paramHandlers, ...result.target];
      }
      return result;
    }
    return false;
  }

  param(originalName: string, callback: RequestParamHandler): void {
    if (!originalName || typeof originalName !== 'string') {
      throw new Error(`Expected name to be a string`);
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error(`Expected callback to be a function`);
    }

    const name = originalName.charAt(0) === ':' ? originalName.slice(1) : originalName;

    if (!validParamName.test(name)) {
      throw new Error(`Invalid parameter name: ${originalName}`);
    }

    if (this.paramHash[name]) {
      throw new Error(`Parameter ${name} already has a callback`);
    }
    this.paramHash[name] = callback;
  }
}

function bindRight(handler: RequestParamHandler, paramValue: string, paramName: string): NextHandleFunction {
  return function (req: Request, res: Response, next: NextFunction): void {
    handler(req, res, next, paramValue, paramName);
  } as NextHandleFunction;
}

function getParamHandlers(
  foundParams: { [param: string]: string },
  paramHash: ParamHash
): Array<NextHandleFunction> {
  const handlers: Array<NextHandleFunction> = [];
  for (const paramName in foundParams) {
    if (paramHash[paramName]) {
      handlers.push(bindRight(paramHash[paramName], foundParams[paramName], paramName));
    }
  }
  return handlers;
}

function modifyPath(path: string, options: ParamStorageOptions): string {
  return options.caseSensitive ? path : lowercaseStaticParts(path);
}

interface Fallback<T> {
  path: string;
  pathToCompare: string;
  currentNode: Node<T>;
  paramValues: Array<string>;
  terminiValues?: Array<string>;
}

export class Node<T> {
  readonly edges: Map<string, Node<T>>;
  methodToPayload?: { [method: string]: { payload: T; paramNames: Array<string> } };

  // for param nodes that are terminated by a character that isn't '/' or ''.
  readonly nonStandardTermini: Set<string>;

  // for param nodes that are terminated by either '/' or ''.
  hasStandardTerminus: boolean;
  constructor() {
    this.edges = new Map();
    this.nonStandardTermini = new Set();
    this.hasStandardTerminus = false;
  }

  search(
    method: string,
    searchPath: string,
    caseSensitive = false,
    buildOptionsResponseHandler: null | ((methods: Array<string>) => T) = null
  ): ReturnValue<T> | false {
    const fallbackStack: Array<Fallback<T>> = [
      {
        pathToCompare: caseSensitive ? searchPath : searchPath.toLowerCase(),
        path: searchPath,
        currentNode: this,
        paramValues: [],
      },
    ];

    /**
	     * If a character in a param value can also be a character in a path, ie the dash in
	     * /:from-:to we need a way to retrace our steps if there is also a standard /:param

	     * This basically functions as breadth-first search if necessary.
		 **/

    do {
      let { pathToCompare, path, currentNode, paramValues, terminiValues } = fallbackStack.pop() as Fallback<
        T
      >;

      walk: while (pathToCompare) {
        for (const [key, node] of currentNode.edges) {
          if (key !== ':' && pathToCompare.startsWith(key)) {
            currentNode = node;
            pathToCompare = pathToCompare.slice(key.length);

            path = path.slice(key.length);
            continue walk;
          }
        }
        const paramNode = currentNode.edges.get(':');
        if (paramNode) {
          const prevNode = currentNode;
          currentNode = paramNode;

          let sliceIndex;
          let nonStandardTerminusFound = false;

          /**
						The first time we visit each node, terminiValues is undefined, so we fetch
						them from currentNode.nonStandardTermini if available

						If it's the second time we're visiting a node (via fallback functionality), then 
						terminiValues would be an array.
					*/

          if (!Array.isArray(terminiValues)) {
            // we haven't been on this node before
            terminiValues = currentNode.nonStandardTermini.size
              ? Array.from(currentNode.nonStandardTermini.values())
              : undefined;
          }

          if (terminiValues && terminiValues.length) {
            while (terminiValues.length) {
              const terminus = terminiValues.pop() as string;
              sliceIndex = path.indexOf(terminus, 1);
              if (sliceIndex !== -1) {
                nonStandardTerminusFound = true;
                break;
              }
            }

            if (terminiValues.length || currentNode.hasStandardTerminus) {
              fallbackStack.push({
                path,
                pathToCompare,
                currentNode: prevNode,
                paramValues: paramValues.concat(),
                terminiValues: terminiValues as string[],
              });
            }
          }

          if (!nonStandardTerminusFound) {
            //prevents matching with a starting slash
            sliceIndex = path.indexOf('/', 1);
          }

          terminiValues = undefined;

          const [paramValue, newPath] = splitAtIndex(path, sliceIndex as number);
          const [, newPathToCompare] = splitAtIndex(pathToCompare, sliceIndex as number);

          pathToCompare = newPathToCompare;
          path = newPath;

          paramValues.push(paramValue);
        } else {
          break walk;
        }
      }
      if (!pathToCompare) {
        const endValue = endOfPath<T>(method, currentNode, paramValues, buildOptionsResponseHandler);
        if (endValue) {
          return endValue;
        }
      }
    } while (fallbackStack.length);

    return false;
  }
  insert(
    method: string,
    path: string,
    payload: T,
    options: ParamStorageOptions = DEFAULT_OPTIONS,
    paramNames: Array<string> = [],
    originalPath?: string
  ): void {
    originalPath = originalPath || path;

    if (!path) {
      if (!this.methodToPayload) {
        this.methodToPayload = {};
      }

      if (this.methodToPayload[method]) {
        if (options.allowDuplicatePaths) {
          if (Array.isArray(payload)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((this.methodToPayload[method].payload as any) as Array<unknown>).push(...payload);
          } else {
            /**
             * Node<T> probably shouldn't be so generic so we don't get into weird states like this.
             **/

            throw new Error(`Unable to combine duplicates. ${originalPath}`);
          }
        } else {
          throw new Error(
            `Duplicate path prohibited with allowDuplicatePaths=false. ${method}: ${originalPath}`
          );
        }
      } else {
        this.methodToPayload[method] = {
          payload,
          paramNames,
        };
      }
      return;
    }

    const paramIndex = path.indexOf(':');
    let [prefix, suffix] = splitAtIndex(path, paramIndex);
    let terminus;

    if (paramIndex === 0) {
      prefix = ':';
      // The name of route parameters must be made up of “word characters” ([A-Za-z0-9_]).
      const paramEnd = path.slice(1).search(validParamChars) + 1;
      const paramEndIndex = paramEnd === 0 ? path.length : paramEnd;

      const paramName = path.slice(1, paramEndIndex);
      terminus = path.charAt(paramEndIndex);

      if (!paramName) {
        throw new Error(`Invalid param name found at ...${path} in ${originalPath}`);
      }

      if (!options.allowDuplicateParams && paramNames.includes(paramName)) {
        throw new Error(
          `In path ${originalPath}, duplicate param name discovered: ${paramName}. Consider renaming or enabling 'allowDuplicateParams'.`
        );
      }

      paramNames.push(paramName);
      suffix = path.slice(paramEndIndex);
    }

    //if edges
    //	find match
    //     if no match, create one up to param
    //     if match, exactly, use it
    //	   if match partially, create a new edge with longest common prefix

    if (this.edges.size) {
      if (this.edges.has(prefix)) {
        const existingNode = this.edges.get(prefix) as Node<T>;
        existingNode.insert(method, suffix, payload, options, paramNames, originalPath);
        addTerminus<T>(terminus, existingNode);
      } else {
        const [commonPrefix, similarEdge] = longestCommonPrefix(prefix, Array.from(this.edges.keys()));

        if (commonPrefix) {
          if (this.edges.has(commonPrefix)) {
            const existingNode = this.edges.get(commonPrefix) as Node<T>;
            existingNode.insert(
              method,
              path.slice(commonPrefix.length),
              payload,
              options,
              paramNames,
              originalPath
            );

            addTerminus<T>(terminus, existingNode);
          } else {
            //remove edge this node to old node
            const oldNode: Node<T> = this.edges.get(similarEdge) as Node<T>;
            this.edges.delete(similarEdge);

            //create new node. Point common prefix to it.
            //set up old node

            const newNode = new Node<T>();
            addTerminus<T>(terminus, newNode);
            this.edges.set(commonPrefix, newNode);
            newNode.edges.set(similarEdge.slice(commonPrefix.length), oldNode);

            //continue inserting the original node
            newNode.insert(
              method,
              path.slice(commonPrefix.length),
              payload,
              options,
              paramNames,
              originalPath
            );
          }
        } else {
          newChild<T>(this, method, prefix, suffix, payload, options, paramNames, originalPath, terminus);
        }
      }
    } else {
      //if no edges, create one up to param
      newChild<T>(this, method, prefix, suffix, payload, options, paramNames, originalPath, terminus);
    }
    /*
			/v1/api/users/:userId
			/v1/api/users/:userId/settings
			/v1/api/users/admin/
			/v1/:param
			/v1/api/users/:mystery/delete
		
		*/
  }
}

function newChild<T>(
  parentNode: Node<T>,
  method: string,
  prefix: string,
  suffix: string,
  payload: T,
  options: ParamStorageOptions,
  paramNames: Array<string>,
  originalPath: string,
  terminus?: string
): void {
  const newNode = new Node<T>();
  newNode.insert(method, suffix, payload, options, paramNames, originalPath);
  addTerminus<T>(terminus, newNode);
  parentNode.edges.set(prefix, newNode);
}

function addTerminus<T>(terminus: string | undefined, node: Node<T>): void {
  if (typeof terminus === 'string') {
    if (terminus !== '/' && terminus !== '') {
      node.nonStandardTermini.add(terminus);
    } else {
      node.hasStandardTerminus = true;
    }
  }
}

function longestCommonPrefix(str: string, arr: Array<string>): [string, string] {
  let longestPrefix = '';
  let longestChoice = '';
  for (const word of arr) {
    let i = 0;
    while (i < word.length && i < str.length && str.charAt(i) === word.charAt(i)) {
      ++i;
    }
    if (i > longestPrefix.length) {
      longestPrefix = word.slice(0, i);
      longestChoice = word;
    }
  }

  return [longestPrefix, longestChoice];
}

function endOfPath<T>(
  method: string,
  node: Node<T>,
  paramValues: Array<string>,
  optionsBuilder: null | ((methods: Array<string>) => T)
): ReturnValue<T> | false {
  if (node.methodToPayload) {
    const end =
      node.methodToPayload[method] ||
      node.methodToPayload[method === 'HEAD' ? 'GET' : ''] ||
      node.methodToPayload['ALL'];
    if (end) {
      return {
        target: end.payload,
        params: buildObject(end.paramNames as Array<string>, paramValues),
      };
    } else if (method === 'OPTIONS' && optionsBuilder) {
      const payload = optionsBuilder(Object.keys(node.methodToPayload));
      node.methodToPayload['OPTIONS'] = { payload, paramNames: [] };
      return {
        target: payload,
        params: {},
      };
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function buildObject(keys: Array<string>, values: Array<string>): { [key: string]: string } {
  const obj: { [key: string]: string } = {};
  for (let i = 0; i < keys.length; ++i) {
    obj[keys[i]] = decodeValue(values[i]);
  }
  return obj;
}

function decodeValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

function splitAtIndex(str: string, index: number): [string, string] {
  if (index === -1) {
    return [str, ''];
  }
  return [str.substring(0, index), str.substring(index)];
}
