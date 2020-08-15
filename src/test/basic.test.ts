import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

import { METHODS } from 'http';

describe('basic tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('slash route', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('basic route', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/test', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('same routes, different verb', async () => {
    const app = express();
    const router = expresso();
    const getMsg = 'success';
    const patchMsg = 'patchSuccess';

    router.get('/test', (req: Request, res: Response) => res.send(getMsg));
    router.patch('/test', (req: Request, res: Response) => res.send(patchMsg));
    app.use(router);

    const getRes = await request(app).get('/test');
    expect(getRes.text).toBe(getMsg);
    expect(getRes.status).toBe(200);

    const patchRes = await request(app).patch('/test');
    expect(patchRes.text).toBe(patchMsg);
    expect(patchRes.status).toBe(200);
  });

  test('with error handler', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/test', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    //eslint-disable-next-line  @typescript-eslint/no-unused-vars
    app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
      res.status(404).end();
    });

    const res = await request(app).get('/err');
    expect(res.status).toBe(404);
  });

  test('with middlewares', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.get(
      '/test',
      (req: Request, res: Response, next: NextFunction) => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction) => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response) => res.send(msg)
    );
    app.use(router);

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });

  test.each(METHODS)('all methods %s', async (capsMethod) => {
    if (capsMethod === 'CONNECT') {
      return;
    }
    const app = express();
    const router = expresso();
    const msg = 'success';

    const method = capsMethod.toLowerCase();
    router[method]('/test', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    // eslint-disable-next-line @typescript-eslint/ban-types
    const res = await (request(app)[method as keyof SuperTest<Test>] as Function)('/test');
    if (method !== 'head') {
      expect(res.text).toBe(msg);
    }

    expect(res.status).toBe(200);
  });
});
