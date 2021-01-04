import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';
import { createBasicServer } from './utils';
import { METHODS } from 'http';

describe('basic tests - express', () => {
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

  test.each(['/test', /^\/test/])('basic route', async (path) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    router.get(path, (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each(['/test', /^\/test/])('same routes, different verb', async (path) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const getMsg = 'success';
    const patchMsg = 'patchSuccess';

    router.get(path, (req: Request, res: Response) => res.send(getMsg));
    router.patch(path, (req: Request, res: Response) => res.send(patchMsg));
    app.use(router);

    const getRes = await request(app).get('/test');
    expect(getRes.text).toBe(getMsg);
    expect(getRes.status).toBe(200);

    const patchRes = await request(app).patch('/test');
    expect(patchRes.text).toBe(patchMsg);
    expect(patchRes.status).toBe(200);
  });

  test.each(['/test', /^\/test/])('with error handler', async (path) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    router.get(path, (req: Request, res: Response) => res.send(msg));
    app.use(router);

    //eslint-disable-next-line  @typescript-eslint/no-unused-vars
    app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
      res.status(404).end();
    });

    const res = await request(app).get('/err');
    expect(res.status).toBe(404);
  });

  test.each(['/test', /^\/test/])('with middlewares', async (path) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.get(
      path,
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

  test.each(METHODS)('string - all methods %s', async (capsMethod) => {
    if (capsMethod === 'CONNECT') {
      return;
    }
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';
    const regexMsg = 'success-regex';

    const method = capsMethod.toLowerCase();
    router[method]('/test', (req: Request, res: Response) => res.send(msg));
    router[method](/^\/abc/, (req: Request, res: Response) => res.send(regexMsg));
    app.use(router);

    for (const [path, response] of [
      ['/test', msg],
      ['/abc', regexMsg],
    ]) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const res = await (request(app)[method as keyof SuperTest<Test>] as Function)(path);
      if (method !== 'head') {
        expect(res.text).toBe(response);
      }
      expect(res.status).toBe(200);
    }
  });

  test.each(['/api', /^\/api/])('.route basic', async (path) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    router
      .route(path)
      .get((req: Request, res: Response) => {
        res.send('get success');
      })
      .post((req: Request, res: Response) => {
        res.send('post success');
      })
      .patch((req: Request, res: Response) => {
        res.send('patch success');
      });

    app.use(router);

    let res = await request(app).get('/api');
    expect(res.text).toBe('get success');
    expect(res.status).toBe(200);

    res = await request(app).post('/api');
    expect(res.text).toBe('post success');
    expect(res.status).toBe(200);

    res = await request(app).patch('/api');
    expect(res.text).toBe('patch success');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each([
    { paths: ['/', '/api', '/api/:id'] },
    { paths: [/^\/$/, /^\/api/, /^\/api\/foo$/] },
    { paths: [/^\/$/, /^\/api/, '/api/:id'] },
  ])('path array', async ({ paths }) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    router.get(paths, (req: Request, res: Response) => res.send(msg));
    app.use(router);

    for (const path of ['/', '/api', '/api/foo']) {
      const res = await request(app).get(path);
      expect(res.text).toBe(msg);
      expect(res.status).toBe(200);
    }

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each([
    { paths: ['/', '/api', '/api/:id'] },
    { paths: [/^\/$/, /^\/api/, /^\/api\/foo$/] },
    { paths: [/^\/$/, /^\/api/, '/api/:id'] },
  ])('path array in .route', async ({ paths }) => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    router
      .route(paths)
      .get((req: Request, res: Response) => {
        res.send('get success');
      })
      .post((req: Request, res: Response) => {
        res.send('post success');
      })
      .patch((req: Request, res: Response) => {
        res.send('patch success');
      });

    app.use(router);

    for (const path of ['/', '/api', '/api/foo']) {
      let res = await request(app).get(path);
      expect(res.text).toBe('get success');
      expect(res.status).toBe(200);

      res = await request(app).post(path);
      expect(res.text).toBe('post success');
      expect(res.status).toBe(200);

      res = await request(app).patch(path);
      expect(res.text).toBe('patch success');
      expect(res.status).toBe(200);
    }

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('array of handlers', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.get('/test', [
      (req: Request, res: Response, next: NextFunction): void => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction): void => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response): void => {
        res.send(msg);
      },
    ]);
    app.use(router);

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });

  test('array of handlers - route', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.route('/test').get([
      (req: Request, res: Response, next: NextFunction): void => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction): void => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response): void => {
        res.send(msg);
      },
    ]);
    app.use(router);

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });
});

describe('basic tests - basic server', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('slash route', async () => {
    const router = expresso();
    const app = createBasicServer(router);

    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.end(msg));

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each(['/test', /^\/test/])('basic route', async (path) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    router.get(path, (req: Request, res: Response) => res.end(msg));

    const res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each(['/test', /^\/test/])('same routes, different verb', async (path) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const getMsg = 'success';
    const patchMsg = 'patchSuccess';

    router.get(path, (req: Request, res: Response) => res.end(getMsg));
    router.patch(path, (req: Request, res: Response) => res.end(patchMsg));

    const getRes = await request(app).get('/test');
    expect(getRes.text).toBe(getMsg);
    expect(getRes.status).toBe(200);

    const patchRes = await request(app).patch('/test');
    expect(patchRes.text).toBe(patchMsg);
    expect(patchRes.status).toBe(200);
  });

  test.each(['/test', /^\/test/])('with error handler', async (path) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    router.get(path, (req: Request, res: Response) => res.end(msg));

    const res = await request(app).get('/err');
    expect(res.status).toBe(404);
  });

  test.each(['/test', /^\/test/])('with middlewares', async (path) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.get(
      path,
      (req: Request, res: Response, next: NextFunction) => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction) => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response) => res.end(msg)
    );

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });

  test.each(METHODS)('string - all methods %s', async (capsMethod) => {
    if (capsMethod === 'CONNECT') {
      return;
    }
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';
    const regexMsg = 'success-regex';

    const method = capsMethod.toLowerCase();
    router[method]('/test', (req: Request, res: Response) => res.end(msg));
    router[method](/^\/abc/, (req: Request, res: Response) => res.end(regexMsg));

    for (const [path, response] of [
      ['/test', msg],
      ['/abc', regexMsg],
    ]) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const res = await (request(app)[method as keyof SuperTest<Test>] as Function)(path);
      if (method !== 'head') {
        expect(res.text).toBe(response);
      }
      expect(res.status).toBe(200);
    }
  });

  test.each(['/api', /^\/api/])('.route basic', async (path) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);

    router
      .route(path)
      .get((req: Request, res: Response) => {
        res.end('get success');
      })
      .post((req: Request, res: Response) => {
        res.end('post success');
      })
      .patch((req: Request, res: Response) => {
        res.end('patch success');
      });

    let res = await request(app).get('/api');
    expect(res.text).toBe('get success');
    expect(res.status).toBe(200);

    res = await request(app).post('/api');
    expect(res.text).toBe('post success');
    expect(res.status).toBe(200);

    res = await request(app).patch('/api');
    expect(res.text).toBe('patch success');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each([
    { paths: ['/', '/api', '/api/:id'] },
    { paths: [/^\/$/, /^\/api/, /^\/api\/foo$/] },
    { paths: [/^\/$/, /^\/api/, '/api/:id'] },
  ])('path array', async ({ paths }) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    router.get(paths, (req: Request, res: Response) => res.end(msg));

    for (const path of ['/', '/api', '/api/foo']) {
      const res = await request(app).get(path);
      expect(res.text).toBe(msg);
      expect(res.status).toBe(200);
    }

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test.each([
    { paths: ['/', '/api', '/api/:id'] },
    { paths: [/^\/$/, /^\/api/, /^\/api\/foo$/] },
    { paths: [/^\/$/, /^\/api/, '/api/:id'] },
  ])('path array in .route', async ({ paths }) => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);

    router
      .route(paths)
      .get((req: Request, res: Response) => {
        res.end('get success');
      })
      .post((req: Request, res: Response) => {
        res.end('post success');
      })
      .patch((req: Request, res: Response) => {
        res.end('patch success');
      });

    for (const path of ['/', '/api', '/api/foo']) {
      let res = await request(app).get(path);
      expect(res.text).toBe('get success');
      expect(res.status).toBe(200);

      res = await request(app).post(path);
      expect(res.text).toBe('post success');
      expect(res.status).toBe(200);

      res = await request(app).patch(path);
      expect(res.text).toBe('patch success');
      expect(res.status).toBe(200);
    }

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('array of handlers', async () => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.get('/test', [
      (req: Request, res: Response, next: NextFunction): void => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction): void => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response): void => {
        res.end(msg);
      },
    ]);

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });

  test('array of handlers - route', async () => {
    const router = expresso({ allowRegex: 'safe' });
    const app = createBasicServer(router);
    const msg = 'success';

    let middleware1Called = false;
    let middleware2Called = false;

    router.route('/test').get([
      (req: Request, res: Response, next: NextFunction): void => {
        middleware1Called = true;
        next();
      },
      (req: Request, res: Response, next: NextFunction): void => {
        middleware2Called = true;
        next();
      },
      (req: Request, res: Response): void => {
        res.end(msg);
      },
    ]);

    const res = await request(app).get('/test');
    expect(middleware1Called).toBe(true);
    expect(middleware2Called).toBe(true);
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
  });
});
