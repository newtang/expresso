import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';

import { METHODS } from 'http';

// function getCurrentNodeMethods () {
//   return http.METHODS && http.METHODS.map(function lowerCaseMethod (method) {
//     return method.toLowerCase()
//   })
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function buildRouter(/*options*/): any {
	const routes: {[key: string]: {[key: string]: Array<NextHandleFunction>}} = {};

	const handler = (req: Request, res: Response, next: NextFunction): void => {
		const verb = req.method.toLowerCase();
		routes[req.path][verb][0](req, res, next);
	};
	
	const routerObj = buildRouterMethods(routes);
	return Object.assign(handler, routerObj);
}

function buildRouterMethods(
	routes: {[key: string]: {[key: string]: Array<NextHandleFunction>}}): 
	{[key: string]: (path: string, ...handlers: Array<NextHandleFunction>)=> void}
{
	const routerObj: {[key: string]: 
	(path: string, ...handlers: Array<NextHandleFunction>)=> void;} = {};
	for(const capsMethod of METHODS){
		const method = capsMethod.toLowerCase();
		routerObj[method] = function(path: string, ...handlers: Array<NextHandleFunction>): void {
			routes[path] = {
				[method]: handlers
			};
		};
	}
	return routerObj;
}