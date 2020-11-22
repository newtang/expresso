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
    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).head('/');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
  });

  test('param', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/:id', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).head('/1234');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
  });

  test('param head override', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.get('/id/:id', (req: Request, res: Response) => res.send(msg));
    router.head('/id/:id', (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });

    app.use(router);

    const res = await request(app).head('/id/abcd');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });

  test('param head override - order reversed', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.head('/id/:id', (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });
    router.get('/id/:id', (req: Request, res: Response) => res.send(msg));

    app.use(router);

    const res = await request(app).head('/id/abcd');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });

  test('static head override', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.get('/api', (req: Request, res: Response) => res.send(msg));
    router.head('/api', (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });

    app.use(router);

    const res = await request(app).head('/api');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });

  test('head override - order reversed', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.head('/api', (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });
    router.get('/api', (req: Request, res: Response) => res.send(msg));

    app.use(router);

    const res = await request(app).head('/api');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });

  test('regex', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get(/^\/api\/$/, (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).head('/api/');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
  });

  test('regex head override', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.get(/^\/api$/, (req: Request, res: Response) => res.send(msg));
    router.head(/^\/api$/, (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });

    app.use(router);

    const res = await request(app).head('/api');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });

  test('regex head override - order reversed.', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    let headCalled = false;
    router.head(/^\/api$/, (req: Request, res: Response) => {
      headCalled = true;
      res.send(msg);
    });
    router.get(/^\/api$/, (req: Request, res: Response) => res.send(msg));

    app.use(router);

    const res = await request(app).head('/api');
    expect(res.text).toBeUndefined();
    expect(res.status).toBe(200);
    expect(headCalled).toBe(true);
  });
});
