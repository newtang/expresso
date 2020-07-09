import { Storage } from '../interfaces';
import type { NextHandleFunction } from 'connect';

export interface ReturnValue<T> {
	payload: T;
	params: {[param: string]: string};
}

/**
 * This functions as a Radix Tree of nodes. If a node has
 * payload set, it is the end of a full, legitimate path
 *
 * Except for edges in the root node, roots do not begin with '/'
**/	

export default class ParamRadixTreeStorage implements Storage {
	root: Node<Array<NextHandleFunction>>;
	constructor() {
		this.root = new Node<Array<NextHandleFunction>>();
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		this.root.insert(method, path, handlers);
	}

	find(method: string, path: string): Array<NextHandleFunction> | false{
		const result = this.root.search(method, path);
		if(result){
			return result.payload;
		}
		return false;
	}

}

export class Node<T> {
	edges: Map<string, Node<T>>;
	methodToPayload?: {[method: string]: {payload: T; paramNames: Array<string>} };
	constructor() {
		this.edges = new Map();
	}

	search(method: string, path: string): ReturnValue<T> | false {
		let currentNode: Node<T> = this; //eslint-disable-line @typescript-eslint/no-this-alias
		const paramValues = [];
		walk:
		while(path){
			for(const [key, node] of currentNode.edges){
				if(key !== ':' && path.startsWith(key)){
					currentNode = node;
					path = path.slice(key.length);
					continue walk;
				}
			}
			const paramNode = currentNode.edges.get(':');
			if(paramNode){
				currentNode = paramNode;

				//prevents matching with a starting slash
				const sliceIndex = path.indexOf('/', 1);

				const [paramValue, newPath] = splitAtIndex(path, sliceIndex);
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
		// let prefix = paramIndex === -1
		// 	? path
		// 	: path.slice(0, paramIndex);

		// let suffix = paramIndex === -1
		// 	? ''
		// 	: path.slice(paramIndex);

		if(paramIndex === 0){
			prefix = ':';
			const nextSlash = path.indexOf('/');
			const paramEndIndex = nextSlash === -1
				? path.length
				: nextSlash;

			paramNames.push(path.slice(1, paramEndIndex));
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
				payload: end.payload,
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

function splitAtIndex(str: string, index: number): [string, string] {
	if(index === -1){
		return [str, ''];
	}
	return [str.substring(0, index), str.substring(index)];
}

