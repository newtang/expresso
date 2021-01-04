import http from 'http';
import finalhandler from 'finalhandler';

export function createBasicServer(router) {
  return http.createServer(function onRequest(req, res) {
    router(req, res, finalhandler(req, res));
  });
}
