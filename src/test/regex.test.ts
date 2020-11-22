import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('regex tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('basic regex test', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get(/^\/api\/$/, (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/api/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    let resWithError = await request(app).get('/api');
    expect(resWithError.status).toBe(404);

    resWithError = await request(app).get('/api/test');
    expect(resWithError.status).toBe(404);
  });

  test('same regex - different verbs', async () => {
    const app = express();
    const router = expresso();


    router.get(/^\/test\/$/, (req: Request, res: Response) => res.send("getSuccess"));
    router.post(/^\/test\/$/, (req: Request, res: Response) => res.send("postSuccess"));
    app.use(router);

    let res = await request(app).get('/test/');
    expect(res.text).toBe('getSuccess');
    expect(res.status).toBe(200);

    res = await request(app).post('/test/');
    expect(res.text).toBe('postSuccess');
    expect(res.status).toBe(200);

    res = await request(app).delete('/test/');
    expect(res.status).toBe(404);
  });

  test('similar regex - different verbs', async () => {
    const app = express();
    const router = expresso();


    router.get(/^\/tests?\/$/, (req: Request, res: Response) => res.send("getSuccess"));
    router.post(/^\/tests\/$/, (req: Request, res: Response) => res.send("postSuccess"));
    app.use(router);

    let res = await request(app).get('/test/');
    expect(res.text).toBe('getSuccess');
    expect(res.status).toBe(200);

    res = await request(app).post('/test/');
    expect(res.status).toBe(404);

    res = await request(app).get('/tests/');
    expect(res.text).toBe('getSuccess');
    expect(res.status).toBe(200);

    res = await request(app).post('/tests/');
    expect(res.text).toBe('postSuccess');
    expect(res.status).toBe(200);

    res = await request(app).delete('/test/');
    expect(res.status).toBe(404);
  });



  /**
   * x Same regexes but different verbs
   * Similar regexes, but different verbs
   * combining handlers?
   * making sure all handlers are called?
   * order of regexes matter
  **/

});