

export default function buildRouter(/*options*/){

	const routes: {[key:string]: {[key:string]: Array<Function>}} = {};

	const handler = (req, res, next) => {
		routes[req.path].get[0](req, res, next);
	}
	const routerObj = {
		get: function(path:string, ...handlers:Array<Function>){
			routes[path] = {
				get: handlers
			}
		}
	}
	return Object.assign(handler, routerObj);
}