
export default class Node {
	edges:Map<string, Node>;
	param?:string;
	constructor(path?:string) {
		this.edges = new Map();
		if(path){
			this.insert(path);
		}
	}
	
	// search(originalPath:string):{
	// 	let path = originalPath;
	// 	let matchIndex;
	// 	while(path && !this.edges.has(path)){
	// 		matchIndex = path.lastIndexOf('/') + 1
	// 		path = path.slice(0, matchIndex);
	// 	}
	// 	if(path){
	// 		const [rest] = originalPath
	// 		return this.edges.get(path).search(originalPath.slice(matchIndex));
	// 	}
	// }
	insert(path:string){
		const paramIndex = path.indexOf(':');

		let prefix = paramIndex === -1
			? path
			: path.slice(0, paramIndex);

		let suffix = paramIndex === -1
			? ''
			: path.slice(paramIndex);

		if(paramIndex === 0){
			prefix = ':';
			const nextSlash = path.indexOf('/');
			const paramEndIndex = nextSlash === -1
				? path.length
				: nextSlash;

			this.param = path.slice(1, paramEndIndex)
			suffix = path.slice(paramEndIndex);
		}

		console.log("prefix:", prefix);
		console.log("suffix:", suffix);


		//consider leaving colon in, and the constructor determines if it's building a 
		// a param edge (if the first char is a ':')

		//if edges
			//	find match
			//     if no match, create one up to param
			//     if match, exactly, use it
			//	   if match partially, create a new edge with longest common prefix

		if(this.edges.size){
			if(this.edges.has(prefix)){
				(this.edges.get(prefix) as Node).insert(suffix);
			}
			else{
				// const [commonPrefix, otherNode] = longestCommonPrefix(prefix, this.edges);
				// if(commonPrefix){

				// }
				// else{
					this.edges.set(prefix, new Node(suffix));
				// }
			}
		}
		else{

			//if no edges, create one up to param
			
				



			this.edges.set(prefix, new Node(suffix));

			
		}

		// for(const [path, n] of Array.from(node.edges)){

		// }



		/*
			/v1/api/users/:userId
			/v1/api/users/:userId/settings
			/v1/api/users/admin/
			/v1/:param
			/v1/api/users/:mystery/delete
		
		*/


	}
}