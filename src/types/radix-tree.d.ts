declare module 'radix-tree' {

	export interface Data {
		path: string;
		data: any;
	}

	export class Tree {
		add: (path: string, data: any)=> void;
		find: (path: string)=> Data | undefined;
		log: () => void;
		remove: (path: string)=> void;
		removeAll: ()=> void; 

	}
} 