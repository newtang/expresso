import request from 'supertest';
import expresso from '../index';
import { createServer, Server } from 'http';

describe('basic tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('restore previous value outside the router', async () => {
    const router = expresso();
    const server = buildServer(function (req, res, next) {
      req.params = { foo: 'bar' };

      router(req, res, function (err) {
        if (err) return next(err);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.params));
      });
    });

    router.get('/', (req, res, next) => {
      res.setHeader('params-in-handler', JSON.stringify(req.params));
      next();
    });

    const res = await request(server).get('/');
    expect(res.header['params-in-handler']).toBe('{}');
    expect(res.text).toBe('{"foo":"bar"}');
    expect(res.status).toBe(200);
  });

  test('should not exist outside the router', async () => {
    const router = expresso();
    const server = buildServer(function (req, res, next) {
      router(req, res, function (err) {
        if (err) return next(err);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.params));
      });
    });

    router.get('/', (req, res, next) => {
      res.setHeader('params-in-handler', JSON.stringify(req.params));
      next();
    });

    const res = await request(server).get('/');
    expect(res.header['params-in-handler']).toBe('{}');
    expect(res.text).toBe('');
    expect(res.status).toBe(200);
  });

  test('should overwrite value outside the router', async () => {
    const router = expresso();
    const server = buildServer(function (req, res, next) {
      req.params = { foo: 'bar' };
      router(req, res, next);
    });

    router.get('/', (req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.params));
    });

    const res = await request(server).get('/');
    expect(res.text).toBe('{}');
    expect(res.status).toBe(200);
  });
});

function buildServer(router): Server {
  return createServer(function (req, res) {
    router(req, res, jest.fn());
  });
}