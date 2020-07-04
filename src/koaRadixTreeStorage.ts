const Node = require('./koaTreeNode');

import { Storage } from './interfaces';
import type { NextHandleFunction } from 'connect';

interface TreeMap {
	[key: string]: NodeTree;
}

interface NodeTree {
	addRoute: (path: string, handlers: Array<NextHandleFunction>)=> void;
	search: (path: string)=> { handle: Array<NextHandleFunction> };
}

export default class KoaRadixTreeStorage implements Storage {

	trees: TreeMap;

	constructor(){
		this.trees = {};
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		if (!this.trees[method]) {
			this.trees[method] = new Node() as NodeTree;
		}

		this.trees[method].addRoute(path, handlers);
	}

	find(method: string, path: string): Array<NextHandleFunction> | false{
		const tree = this.trees[method];
		  if (tree) {
		    const found =  tree.search(path);
		    // console.log("found", found);
		    return found.handle;
		  }
		return false;
	}
}