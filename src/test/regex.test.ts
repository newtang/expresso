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

  /**
   * Same regexes but different verbs
   * Similar regexes, but different verbs
  **/

});