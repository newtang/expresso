import { FoundRouteData, Storage } from '../interfaces';
import type { NextHandleFunction } from 'connect';
import { lowercaseStaticParts } from '../utils/stringUtils';

const validParamChars = /[^A-Za-z0-9_]+/;

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

/**
 * This functions as a Radix Tree of nodes. If a node has
 * payload set, it is the end of a full, legitimate path
 *
 * Except for edges in the root node, edges do not begin with '/'
 **/

export default class ParamRadixTreeStorage implements Storage {
  readonly root: Node<Array<NextHandleFunction>>;
  readonly options: ParamStorageOptions;
  constructor(options: ParamStorageOptions = DEFAULT_OPTIONS) {
    this.root = new Node<Array<NextHandleFunction>>();
    this.options = options;
  }

  add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
    path = modifyPath(path, this.options);
    this.root.insert(method, path, handlers, this.options);
  }

  find(method: string, path: string): FoundRouteData | false {
    const result = this.root.search(method, path, this.options.caseSensitive);
    if (result) {
      return result;
    }
    return false;
  }
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

  search(method: string, searchPath: string, caseSensitive = false): ReturnValue<T> | false {
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
      // console.log("popping the stack. Termini values", terminiValues);

      walk: while (pathToCompare) {
        // console.log('pathToCompare', pathToCompare);

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
        const endValue = endOfPath<T>(method, currentNode, paramValues);
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
        const [commonPrefix, similarEdge] = longestCommonPrefix(prefix, this.edges);

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

function longestCommonPrefix<T>(str: string, edges: Map<string, Node<T>>): [string, string] {
  while (str && str !== '/') {
    // go slash by slash
    str = str.slice(0, str.lastIndexOf('/', str.length - 2) + 1);
    for (const [edge] of edges) {
      if (edge.startsWith(str)) {
        return [str, edge];
      }
    }
  }

  //I think we never get here. At some point `str` is "" which is valid
  return ['', ''];
}

function endOfPath<T>(method: string, node: Node<T>, paramValues: Array<string>): ReturnValue<T> | false {
  if (node.methodToPayload) {
    const end = node.methodToPayload[method];
    if (end) {
      return {
        target: end.payload,
        params: buildObject(end.paramNames as Array<string>, paramValues),
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
    obj[keys[i]] = values[i];
  }
  return obj;
}

function splitAtIndex(str: string, index: number): [string, string] {
  if (index === -1) {
    return [str, ''];
  }
  return [str.substring(0, index), str.substring(index)];
}
