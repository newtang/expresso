import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';
import { Storage } from './interfaces';
import KoaRadixTreeStorage from './koaRadixTreeStorage';
import RadixTreeStorage from './radixTreeStorage';
import StaticStorage from './staticStorage';
import { METHODS } from 'http';

interface RouterUserOptions {
	strict?: boolean;
	caseSensitive?: boolean;
}

interface RouterOptions {
	strict: boolean;
	caseSensitive: boolean;
}

const defaultOptions: RouterOptions = {
	strict: false,
	caseSensitive: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRouter(userOptions?: RouterUserOptions): any {
	const options = Object.assign({}, defaultOptions, userOptions);
	// const routeStorage = new StaticStorage();
	// const routeStorage = new RadixTreeStorage();
	const routeStorage = new KoaRadixTreeStorage();
	

	const routerObj = buildRouterMethods(routeStorage, options);
	return Object.assign(handleRequest.bind(null, routeStorage, options), routerObj);
}

export = buildRouter;

function handleRequest(routeStorage: Storage, options: RouterOptions, 
	req: Request, res: Response, done: NextFunction): void {

	const verb = req.method;
	const path = options.caseSensitive
		? req.path
		: req.path.toLowerCase();

	const handlers = routeStorage.find(verb, path);
	if(handlers){
		executeHandlers(req, res, done, handlers);
	}
	else{
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
	routeStorage: Storage,
	options: RouterOptions): 
	{[key: string]: (path: string, ...handlers: Array<NextHandleFunction>)=> void}
	
{
	const routerObj: {[key: string]: 
	(path: string, ...handlers: Array<NextHandleFunction>)=> void;} = {};
	for(const capsMethod of METHODS){
		const method = capsMethod.toLowerCase();
		/**
		  * The value of the method property on req always seems to be capitalized.
		  * Using the capitalized method (as opposed to lowercasing it on every request)
		  * is actually a relatively significant optimization
		 **/
		routerObj[method] = addRoute.bind(null, capsMethod, routeStorage, options);
	}
	return routerObj;
}

function addRoute(method: string, routeStorage: Storage, options: RouterOptions, 
	path: string, ...handlers: Array<NextHandleFunction>): void {

	validatePath(path);
	validateHandlers(path, handlers);

	const validPaths = getValidPaths(path, options);

	for(const p of validPaths){
		routeStorage.add(method, p, handlers);

	}
}

function validatePath(path: string): void{
	if(!path || typeof path !== 'string'){
		throw new Error(`Invalid path: ${path}`);
	}

	if(path[0] !== '/'){
		throw new Error(`First character in path, must be a slash. ${path}`);
	}

	//allowable characters
	const pass = /^\/[a-zA-Z0-9$\-_.+!*'(),/~]*$/gi.test(path);
	if(!pass){
		throw new Error(`Invalid path: ${path}`);
	}

	const fail = /\/\//gi.test(path);
	if(fail){
		throw new Error(`Invalid path. Contains consecutive '//', ${path}`); 
	}
}

function validateHandlers(path: string, handlers: Array<NextHandleFunction>): void{
	for(const handler of handlers){
		if(typeof handler !== 'function'){
			throw new Error(`Non function handler found for path: ${path}`);
		}
	}
}

function getValidPaths(userPath: string, options: RouterOptions): Array<string>{
	const validPaths = options.strict
		? [userPath]
		: getNonStrictPaths(userPath);

	if(!options.caseSensitive){
		return validPaths.map(p => p.toLowerCase());
	}
	return validPaths;
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

