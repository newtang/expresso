import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

describe('error tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('error skipped', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let errCalled = false;

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        errCalled = true;
        next();
      },
      (req: Request, res: Response) => {
        res.send(msg);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(errCalled).toBe(false);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('handler skipped', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let called = false;

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('some error');
      },
      (req: Request, res: Response, next: NextFunction) => {
        called = true;
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.send(`${msg}_${err}`);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(called).toBe(false);
    expect(res.text).toBe('success_some error');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('handler skipped - exception', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let called = false;

    router.get(
      '/',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (req: Request, res: Response, next: NextFunction) => {
        throw 'exception';
      },
      (req: Request, res: Response, next: NextFunction) => {
        called = true;
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.send(`${msg}_${err}`);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(called).toBe(false);
    expect(res.text).toBe('success_exception');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('exception in error handler', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let called = false;

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('some error');
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      (err: any, req: Request, res: Response, next: NextFunction) => {
        called = true;
        throw 'exception';
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.send(`${msg}_${err}`);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(called).toBe(true);
    expect(res.text).toBe('success_exception');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('use - error skipped', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let errCalled = false;
    let useErrCalled = false;

    router.use(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        useErrCalled = true;
        next();
      }
    );

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        errCalled = true;
        next();
      },
      (req: Request, res: Response) => {
        res.send(msg);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(errCalled).toBe(false);
    expect(useErrCalled).toBe(false);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('use - handler skipped', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let called = false;
    let useFxnCalled = false;
    let useErrCalled = false;
    router.use(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('some error');
      },
      (req: Request, res: Response, next: NextFunction) => {
        useFxnCalled = true;
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        useErrCalled = true;
        next();
      }
    );

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('some error');
      },
      (req: Request, res: Response, next: NextFunction) => {
        called = true;
        next();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.send(`${msg}_${err}`);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe('success_some error');
    expect(res.status).toBe(200);
    expect(called).toBe(false);
    expect(useFxnCalled).toBe(false);
    expect(useErrCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('error = router', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let errCalled = false;

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('router');
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        errCalled = true;
        next();
      },
      (req: Request, res: Response) => {
        res.send(msg);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).not.toBe(msg);
    expect(res.status).toBe(404);
    expect(errCalled).toBe(false);
  });

  test('error = route', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let errCalled = false;

    router.get(
      '/',
      (req: Request, res: Response, next: NextFunction) => {
        next('route');
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, req: Request, res: Response, next: NextFunction) => {
        errCalled = true;
        next();
      },
      (req: Request, res: Response) => {
        res.send(msg);
      }
    );
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).not.toBe(msg);
    expect(res.status).toBe(404);
    expect(errCalled).toBe(false);
  });
});
