
export default class Node {
	edges:Map<string, Node>;
	isParam:boolean;
	constructor(path?:string, isParam?:boolean=false) {
		this.edges = new Map();
		this.isParam = isParam;
		if(path){
			this.insert(path);
		}
	}
	
	search(originalPath:string){
		let path = originalPath;
		let matchIndex;
		while(path && !this.edges.has(path)){
			matchIndex = path.lastIndexOf('/') + 1
			path = path.slice(0, matchIndex);
		}
		if(path){
			const [rest] = originalPath
			return this.edges.get(path).search(originalPath.slice(matchIndex));
		}
	}
	insert(path:string){
		const [prefix, paramAndRest] = path.split(':', 2);

		const restOfPathIndex = paramAndRest.indexOf('/');
		if(restOfPathIndex === -1){
			this.edges.set(prefix, new Node('', true))
		}
		else{
			this.edges.set(prefix, new Node(paramAndRest.slice(restOfPathIndex), true))
		}

		// /api/		
		// /api/v1/user/:userId
	}
}