import http from 'http';
import type { Server, IncomingMessage, ServerResponse } from 'http';
import type { NextHandleFunction, NextFunction } from 'connect';

export function createBasicServer(router: NextHandleFunction): Server {
  return http.createServer(function onRequest(req: IncomingMessage, res: ServerResponse) {
    router(req, res, () => {
		res.statusCode = 404;
		res.end();
    });
  });
}
