import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

describe('router.use', () => {
  test('chainable', async () => {
    const router = expresso();

    expect(router).toBe(router.use(jest.fn()));
  });

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

  test('all paths', async () => {
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

  test('all paths - multiple functions', async () => {
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

  test('specified path', async () => {
    const app = express();
    const router = expresso();

    let useCalled = false;
    router.use('/v1/', function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/v2/api', (req: Request, res: Response) => res.send('success2'));
    router.get('/v1/api', (req: Request, res: Response) => res.send('success3'));
    app.use(router);

    let res = await request(app).get('/');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    res = await request(app).get('/v2/api');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    res = await request(app).get('/v1/api');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('param path', async () => {
    const app = express();
    const router = expresso();

    let useCalled = false;
    router.use('/v1/:param/id', function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/v2/api', (req: Request, res: Response) => res.send('success2'));
    router.get('/v1/abc/id', (req: Request, res: Response) => res.send('success3'));
    router.get('/v1/:param/id/settings', (req: Request, res: Response) => res.send('success3'));
    app.use(router);

    let res = await request(app).get('/');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    res = await request(app).get('/v2/api');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    res = await request(app).get('/v1/abc/id');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    useCalled = false; //eslint-disable-line require-atomic-updates
    res = await request(app).get('/v1/paramValue/id/settings');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('regex', async () => {
    const app = express();
    const router = expresso();

    let useCalled = false;
    router.use(/\/api/, function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/api', (req: Request, res: Response) => res.send('success2'));
    router.get('/api/v2/id', (req: Request, res: Response) => res.send('success3'));
    app.use(router);

    let res = await request(app).get('/');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    res = await request(app).get('/api/');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    useCalled = false; //eslint-disable-line require-atomic-updates
    res = await request(app).get('/api/v2/id');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);
  });
});
