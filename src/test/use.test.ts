import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

describe('router.use', () => {
  test('use added after route', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    let useCalled = false;
    router.use(function usefxn(req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('use - all paths', async () => {
    const app = express();
    const router = expresso();

    let useCalled = false;
    router.use(function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('use - all paths - multiple functions', async () => {
    const app = express();
    const router = expresso();

    let useCalled1 = false;
    let useCalled2 = false;
    router.use(
      function (req: Request, res: Response, next: NextFunction) {
        useCalled1 = true;
        next();
      },
      function (req: Request, res: Response, next: NextFunction) {
        useCalled2 = true;
        next();
      }
    );

    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled1).toBe(true);
    expect(useCalled2).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });
});
