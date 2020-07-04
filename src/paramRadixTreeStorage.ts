
export default class Node<T> {
	edges:Map<string, Node<T>>;
	paramNames?:Array<string>;
	payload?:T;
	constructor() {
		this.edges = new Map();
	}
	
	search(path:string): T | false{
		let currentNode: Node<T> = this;
		walk:
		while(true){
			if(!path){
				if(currentNode.payload){
					return currentNode.payload;
				}
				else{
					return false;
				}
			}
			for(const [key, node] of currentNode.edges){
				if(key !== ':' && path.startsWith(key)){
					currentNode = node;
					path = path.slice(key.length);
					continue walk;
				}
			}
			const paramNode = currentNode.edges.get(':');
			if(paramNode){
				currentNode = paramNode;
				//prevents matching with a starting slash
				const sliceIndex = path.indexOf('/', 1);
				if(sliceIndex === -1){
					path = "";
				}
				else{
					path = path.slice(sliceIndex);
				}
				
			}
			else{
				return false;
			}


		}
	}
	insert(path:string, payload:T, paramNames:Array<string> = []): void {
		
		if(!path){
			this.payload = payload;
			this.paramNames = paramNames;
			return;
		}

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

			paramNames.push(path.slice(1, paramEndIndex));
			suffix = path.slice(paramEndIndex);
		}

		//consider leaving colon in, and the constructor determines if it's building a 
		// a param edge (if the first char is a ':')

		//if edges
			//	find match
			//     if no match, create one up to param
			//     if match, exactly, use it
			//	   if match partially, create a new edge with longest common prefix

		if(this.edges.size){
			if(this.edges.has(prefix)){
				(this.edges.get(prefix) as Node<T>).insert(suffix, payload, paramNames);
			}
			else{
				// const [commonPrefix, otherNode] = longestCommonPrefix(prefix, this.edges);
				// if(commonPrefix){

				// }
				// else{
					const newNode = new Node<T>();
					newNode.insert(suffix, payload, paramNames);
					this.edges.set(prefix, newNode);
				// }
			}
		}
		else{

			//if no edges, create one up to param
			
				


			const newNode = new Node<T>();
			newNode.insert(suffix, payload, paramNames);
			this.edges.set(prefix, newNode);

			
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