import { Storage, FoundRouteData } from '../interfaces';
import type { NextHandleFunction } from 'connect';

interface RouteMap {
	[key: string]: {[key: string]: FoundRouteData};
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
		this.routes[path][method] = { target: handlers };
	}

	find(method: string, path: string): FoundRouteData | false{
		const pathRoutes = this.routes[path];
		return (pathRoutes && pathRoutes[method]) || false;
	}
}