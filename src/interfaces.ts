import type { NextHandleFunction } from 'connect';

export interface Storage {
	add(method: string, path: string, handlers: Array<NextHandleFunction>): void ;
	find(method: string, path: string): Array<NextHandleFunction> | false ;
}