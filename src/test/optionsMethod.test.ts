import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('HEAD', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('static', async () => {
    const app = express();
    const router = expresso();

    router.get('/', () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD';
    let res = await request(app).options('/');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('static - non GET', async () => {
    const app = express();
    const router = expresso();

    router.post('/api', () => jest.fn());
    app.use(router);

    const methods = 'POST';
    let res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('static - multiple', async () => {
    const app = express();
    const router = expresso();

    router.post('/api', () => jest.fn());
    router.get('/api', () => jest.fn());
    router.patch('/api', () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD, PATCH, POST';
    let res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('static - options override', async () => {
    const app = express();
    const router = expresso();

    const message = 'hello!';
    router.options('/api', (req: Request, res: Response) => res.send(message));
    router.post('/api', () => jest.fn());
    router.get('/api', () => jest.fn());
    router.patch('/api', () => jest.fn());
    app.use(router);

    let res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);

    res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);
  });

  test('param', async () => {
    const app = express();
    const router = expresso();

    router.get('/:id', () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD';
    let res = await request(app).options('/1234');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/5678');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('param - non GET', async () => {
    const app = express();
    const router = expresso();

    router.post('/:id', () => jest.fn());
    app.use(router);

    const methods = 'POST';
    let res = await request(app).options('/1234');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/5678');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('param - multiple', async () => {
    const app = express();
    const router = expresso();

    router.post('/:id', () => jest.fn());
    router.get('/:id', () => jest.fn());
    router.patch('/:id', () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD, PATCH, POST';
    let res = await request(app).options('/1234');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/1234');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('param - options override', async () => {
    const app = express();
    const router = expresso();

    const message = 'hello!';
    router.options('/:id', (req: Request, res: Response) => res.send(message));
    router.post('/:id', () => jest.fn());
    router.get('/:id', () => jest.fn());
    router.patch('/:id', () => jest.fn());
    app.use(router);

    let res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);

    res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);
  });

  test('regex', async () => {
    const app = express();
    const router = expresso();

    router.get(/^\/api$/, () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD';
    let res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('regex - non GET', async () => {
    const app = express();
    const router = expresso();

    router.post(/^\/api$/, () => jest.fn());
    app.use(router);

    const methods = 'POST';
    let res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('regex - multiple', async () => {
    const app = express();
    const router = expresso();

    router.post(/^\/api$/, () => jest.fn());
    router.get(/^\/api$/, () => jest.fn());
    router.patch(/^\/api$/, () => jest.fn());
    app.use(router);

    const methods = 'GET, HEAD, PATCH, POST';
    let res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);

    //test twice, because results get cached internally
    res = await request(app).options('/api');
    expect(res.text).toBe(methods);
    expect(res.status).toBe(200);
    expectHeaders(res.header, methods);
  });

  test('regex - options override', async () => {
    const app = express();
    const router = expresso();

    const message = 'hello!';
    router.options(/^\/api$/, (req: Request, res: Response) => res.send(message));
    router.post(/^\/api$/, () => jest.fn());
    router.get(/^\/api$/, () => jest.fn());
    router.patch(/^\/api$/, () => jest.fn());
    app.use(router);

    let res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);

    res = await request(app).options('/api');
    expect(res.text).toBe(message);
    expect(res.status).toBe(200);
  });
});

function expectHeaders(headers: { [key: string]: string }, methods: string): void {
  expect(headers['allow']).toBe(methods);
  expect(headers['content-length']).toBe(Buffer.byteLength(methods).toString());
  expect(headers['content-type']).toBe('text/plain; charset=utf-8');
  expect(headers['x-content-type-options']).toBe('nosniff');
}
