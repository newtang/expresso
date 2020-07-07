import type { NextHandleFunction } from 'connect';
import { Storage, RouterOptions } from '../interfaces';
import StaticStorage from './StaticStorage';
import ParamRadixTreeStorage from './ParamRadixTreeStorage';

export default class CompositeStorage implements Storage {
	staticStorage: Storage;
	paramStorage: Storage;
	storages: Array<Storage>;
	options: RouterOptions;
	constructor(options: RouterOptions){
		this.options = options;
		this.staticStorage = new StaticStorage();
		this.paramStorage = new ParamRadixTreeStorage();
		this.storages = [this.staticStorage, this.paramStorage];
	}

	add(method: string, path: string, handlers: Array<NextHandleFunction>): void {
		validatePath(path);
		validateHandlers(path, handlers);

		const storage = path.indexOf(':') === -1
			? this.staticStorage
			: this.paramStorage;

		const validPaths = getValidPaths(path, this.options);

		for(const p of validPaths){
			storage.add(method, p, handlers);
		}
	}

	find(method: string, path: string): Array<NextHandleFunction> | false {
		for(const storage of this.storages){
			const result = storage.find(method, path);
			if(result){
				return result;
			}
		}

		return false;
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
	const pass = /^\/[a-zA-Z0-9:$\-_.+!*'(),/~]*$/gi.test(path);
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
