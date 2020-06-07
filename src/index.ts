import { NextHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function buildRouter(/*options*/): any {

	const routes: {[key: string]: {[key: string]: Array<NextHandleFunction>}} = {};

	const handler = (req: Request, res: Response, next: NextFunction): void => {
		routes[req.path].get[0](req, res, next);
	};
	const routerObj = {
		get: function(path: string, ...handlers: Array<NextHandleFunction>): void {
			routes[path] = {
				get: handlers
			};
		}
	};
	return Object.assign(handler, routerObj);
}