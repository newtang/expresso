import { Storage } from './interfaces';
import type { NextHandleFunction } from 'connect';

interface RouteMap {
	[key: string]: {[key: string]: Array<NextHandleFunction>};
}

export default class StaticStorage implements Storage {

	routes: RouteMap;

	constructor(){
		this.routes = {};
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		if(!this.routes[path]){
			this.routes[path] = {};
		}
		this.routes[path][method] = handlers;
	}

	find(method: string, path: string): Array<NextHandleFunction> | false{
		const pathRoutes = this.routes[path];
		if(pathRoutes && pathRoutes[method]){
			return pathRoutes[method];
		}
		return false;
	}
}