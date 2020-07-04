
export interface ReturnValue<T> {
	payload: T;
	params: {[param: string]: string};
}

export default class Node<T> {
	edges: Map<string, Node<T>>;
	paramNames?: Array<string>;
	payload?: T;
	constructor() {
		this.edges = new Map();
	}

	search(path: string): ReturnValue<T> | false {
		let currentNode: Node<T> = this; //eslint-disable-line @typescript-eslint/no-this-alias
		const paramValues = [];
		walk:
		while(path){
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

				const [paramValue, newPath] = splitAtIndex(path, sliceIndex);
				path = newPath;
				paramValues.push(paramValue);
			}
			else{
				return false;
			}
		}

		return endOfPath<T>(currentNode, paramValues);
	}
	insert(path: string, payload: T, paramNames: Array<string> = []): void {
		
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

function endOfPath<T>(node: Node<T>, paramValues: Array<string>): ReturnValue<T> | false{
	if(node.payload){
		return {
			payload: node.payload,
			params: buildObject(node.paramNames as Array<string>, paramValues)
		};
	}
	else{
		return false;
	}
}

function buildObject(keys: Array<string>, values: Array<string>): {[key: string]: string} {
	const obj: {[key: string]: string} = {};
	for(let i=0; i<keys.length; ++i){
		obj[keys[i]] = values[i];
	}
	return obj;
}

function splitAtIndex(str: string, index: number): [string, string] {
	if(index === -1){
		return [str, ''];
	}
	return [str.substring(0, index), str.substring(index)];
}

