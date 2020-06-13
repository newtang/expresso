import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';

import { METHODS } from 'http';

interface RouterUserOptions {
	strict?: boolean;
}

interface RouterOptions {
	strict: boolean;
}

interface RouteMap {
	[key: string]: {[key: string]: Array<NextHandleFunction>};
}

const defaultOptions: RouterOptions = {
	strict: false
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function buildRouter(userOptions?: RouterUserOptions): any {
	const options = Object.assign({}, defaultOptions, userOptions);
	const routes: RouteMap = {};
	const routerObj = buildRouterMethods(routes, options);
	return Object.assign(handleRequest.bind(null, routes), routerObj);
}

function handleRequest(routes: RouteMap, req: Request, res: Response, done: NextFunction): void {
	const verb = req.method.toLowerCase();
	let notFound = false;
	const pathRoutes = routes[req.path];

	if(pathRoutes){
		const handlers = pathRoutes[verb];
		if(handlers && handlers[0]){
			executeHandlers(req, res, done, handlers);
		}
		else{
			notFound = true;
		}
	}
	else{
		notFound = true;
	}

	if(notFound){
		return done(new Error('404'));
	}

} 

function executeHandlers(req: Request, res: Response, done: NextFunction, 
	handlerStack: Array<NextHandleFunction>): void{
	let index = 0;
	next();
	function next(err?: Error): void{
		if(err){
			return done(err);
		}
		const nextHandler = handlerStack[index++];
		if(nextHandler){
			try{
				nextHandler(req, res, next);
			}
			catch(handlerException){
				return done(handlerException);
			}
			
		}
		else{
			done();
		}	
	}
}

function buildRouterMethods(
	routes: RouteMap,
	options: RouterOptions): 
	{[key: string]: (path: string, ...handlers: Array<NextHandleFunction>)=> void}
	
{
	const routerObj: {[key: string]: 
	(path: string, ...handlers: Array<NextHandleFunction>)=> void;} = {};
	for(const capsMethod of METHODS){
		const method = capsMethod.toLowerCase();
		routerObj[method] = addRoute.bind(null, method, routes, options);
	}
	return routerObj;
}

function addRoute(method: string, routes: RouteMap, options: RouterOptions, 
	path: string, ...handlers: Array<NextHandleFunction>): void {
	const validPaths = options.strict
		? [path]
		: getNonStrictPaths(path);

	for(const p of validPaths){
		if(!routes[p]){
			routes[p] = {};
		}
		routes[p][method] = handlers;
	}
}

function getNonStrictPaths(path: string): Array<string>{
	if(path === '/'){
		return [path];
	}

	const endsWithSlashPath = path.endsWith('/')
		? path
		: `${path}/`;

	const noEndingSlashPath = !path.endsWith('/')
		? path
		: path.slice(0, path.length -1);

	return [endsWithSlashPath, noEndingSlashPath];
	
}

