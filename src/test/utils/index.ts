import http from 'http';
import finalhandler from 'finalhandler';
import type { Server } from 'http';
import type { NextHandleFunction } from 'connect';

export function createBasicServer(router: NextHandleFunction): Server {
  return http.createServer(function onRequest(req, res) {
    router(req, res, finalhandler(req, res));
  });
}
