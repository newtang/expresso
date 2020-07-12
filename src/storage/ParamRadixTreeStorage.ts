import { FoundRouteData, Storage } from '../interfaces';
import type { NextHandleFunction } from 'connect';
import { lowercaseStaticParts } from '../utils/stringUtils';

const validParamChars = /[^A-Za-z0-9_]+/;

export interface ReturnValue<T> {
	target: T;
	params: {[param: string]: string};
}

interface ParamStorageOptions {
	caseSensitive: boolean;
}

const DEFAULT_OPTIONS: ParamStorageOptions = { caseSensitive: false };

/**
 * This functions as a Radix Tree of nodes. If a node has
 * payload set, it is the end of a full, legitimate path
 *
 * Except for edges in the root node, edges do not begin with '/'
**/	

export default class ParamRadixTreeStorage implements Storage {
	root: Node<Array<NextHandleFunction>>;
	options: ParamStorageOptions;
	constructor(options: ParamStorageOptions = DEFAULT_OPTIONS) {
		this.root = new Node<Array<NextHandleFunction>>();
		this.options = options;
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		path = modifyPath(path, this.options);
		this.root.insert(method, path, handlers);
	}

	find(method: string, path: string): FoundRouteData | false{
		const result = this.root.search(method, path, this.options.caseSensitive);
		if(result){
			return result;
		}
		return false;
	}

}

function modifyPath(path: string, options: ParamStorageOptions): string{
	return options.caseSensitive
		? path
		: lowercaseStaticParts(path);
}

export class Node<T> {
	edges: Map<string, Node<T>>;
	methodToPayload?: {[method: string]: {payload: T; paramNames: Array<string>} };
	constructor() {
		this.edges = new Map();
	}

	search(method: string, path: string, caseSensitive=false): ReturnValue<T> | false {
		let currentNode: Node<T> = this; //eslint-disable-line @typescript-eslint/no-this-alias
		const paramValues = [];

		let pathToCompare = caseSensitive
			? path
			: path.toLowerCase();

		walk:
		while(pathToCompare){
			for(const [key, node] of currentNode.edges){
				if(key !== ':' && pathToCompare.startsWith(key)){
					currentNode = node;
					pathToCompare = pathToCompare.slice(key.length);
					path = path.slice(key.length);
					continue walk;
				}
			}
			const paramNode = currentNode.edges.get(':');
			if(paramNode){
				currentNode = paramNode;

				//prevents matching with a starting slash
				// const sliceIndex = path.indexOf('/', 1);

				const sliceIndex = searchAt(path, validParamChars, 1);				
				const [paramValue, newPath] = splitAtIndex(path, sliceIndex);
				const [, newPathToCompare] = splitAtIndex(pathToCompare, sliceIndex);

				pathToCompare = newPathToCompare;
				path = newPath;

				paramValues.push(paramValue);
			}
			else{
				return false;
			}
		}

		return endOfPath<T>(method, currentNode, paramValues);
	}
	insert(method: string, path: string, payload: T, paramNames: Array<string> = []): void {
		
		if(!path){

			if(!this.methodToPayload){
				this.methodToPayload = {};
			}

			this.methodToPayload[method] = {
				payload, paramNames
			};
			return;
		}

		const paramIndex = path.indexOf(':');
		let [prefix, suffix] = splitAtIndex(path, paramIndex);

		if(paramIndex === 0){
			prefix = ':';
			// const paramEnd = path.indexOf('/');
			// The name of route parameters must be made up of “word characters” ([A-Za-z0-9_]).
			const paramEnd = path.slice(1).search(validParamChars) + 1;
			// console.log("paramEnd", paramEnd, path);
			const paramEndIndex = paramEnd === 0  //(-1 + 1)
				? path.length
				: paramEnd;

			paramNames.push(path.slice(1, paramEndIndex));
			// console.log("paramNames" ,paramNames);
			suffix = path.slice(paramEndIndex);
		}

		//if edges
		//	find match
		//     if no match, create one up to param
		//     if match, exactly, use it
		//	   if match partially, create a new edge with longest common prefix

		if(this.edges.size){
			if(this.edges.has(prefix)){
				(this.edges.get(prefix) as Node<T>).insert(method, suffix, payload, paramNames);
			}
			else{
				const [commonPrefix, similarEdge] = longestCommonPrefix(prefix, this.edges);

				if(commonPrefix){

					if(this.edges.has(commonPrefix)){
						(this.edges.get(commonPrefix) as Node<T>)
							.insert(method, path.slice(commonPrefix.length), payload, paramNames);
					}
					else{
						//remove edge this node to old node
						const oldNode: Node<T> = this.edges.get(similarEdge) as Node<T>;
						this.edges.delete(similarEdge);

						//create new node. Point common prefix to it. 
						//set up old node
						
						const newNode = new Node<T>();
						this.edges.set(commonPrefix, newNode);
						newNode.edges.set(similarEdge.slice(commonPrefix.length), oldNode);
						
						//continue inserting the original node
						newNode.insert(method, 
							path.slice(commonPrefix.length), payload, paramNames);
					}
				}
				else{
					newChild<T>(this, method, prefix, suffix, payload, paramNames);
				}
			}
		}
		else{
			//if no edges, create one up to param
			newChild<T>(this, method, prefix, suffix, payload, paramNames);
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
	parentNode: Node<T>, method: string, prefix: string, 
	suffix: string, payload: T, paramNames: Array<string>): void {

	const newNode = new Node<T>();
	newNode.insert(method, suffix, payload, paramNames);
	parentNode.edges.set(prefix, newNode);
}

function longestCommonPrefix<T>(str: string, edges: Map<string, Node<T>>): [string, string]{
	while(str && str !== '/'){
		// go slash by slash
		str = str.slice(0, str.lastIndexOf('/', str.length-2) + 1);
		for(const [edge] of edges){
			if(edge.startsWith(str)){
				return [str, edge];
			}
		}
	}

	//I think we never get here. At some point `str` is "" which is valid

	return ['', ''];
}

function endOfPath<T>(
	method: string, node: Node<T>, paramValues: Array<string>): ReturnValue<T> | false{
	
	if(node.methodToPayload){
		const end = node.methodToPayload[method];
		if(end){
			return {
				target: end.payload,
				params: buildObject(end.paramNames as Array<string>, paramValues)
			};
		}
		else{
			return false;
		}
	}
	else{
		return false;
	}
}

function buildObject(keys: Array<string>, values: Array<string>): {[key: string]: string} {
	const obj: {[key: string]: string} = {};
	for(let i=0; i<keys.length; ++i){
		obj[keys[i]] = values[i];
	}
	return obj;
}

function searchAt(str: string, regex: RegExp, index: number): number{
	const searchIndex = str.slice(index).search(regex);
	return searchIndex === -1
		? -1
		: searchIndex + index;
}

function splitAtIndex(str: string, index: number): [string, string] {
	if(index === -1){
		return [str, ''];
	}
	return [str.substring(0, index), str.substring(index)];
}

