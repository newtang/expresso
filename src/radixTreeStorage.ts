import { Tree } from 'radix-tree';
import { Storage } from './interfaces';
import type { NextHandleFunction } from 'connect';

export default class RadixTreeStorage implements Storage {

	routeTree: Tree;

	constructor(){
		this.routeTree = new Tree();
		//eslint-disable-next-line @typescript-eslint/no-empty-function
		this.routeTree.log = function(): void {};
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		const added = this.routeTree.find(path);
		if(added && added.data){
			added.data[method] = handlers;
		}
		else{
			this.routeTree.add(path, { [method]: handlers });
		}
	}

	find(method: string, path: string): Array<NextHandleFunction> | false{
		const pathRoutes = this.routeTree.find(path);
		if(pathRoutes){
			return pathRoutes.data[method];
		}
		return false;
	}
}