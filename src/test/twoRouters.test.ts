import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('two routers', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('basic', async () => {
    const app = express();
    const router1 = expresso();
    const router2 = expresso();

    router1.get('/', (req: Request, res: Response) => res.send('jackpot1'));

    router2.get('/test', (req: Request, res: Response) => res.send('jackpot2'));

    app.use(router1);
    app.use(router2);

    let res = await request(app).get('/');
    expect(res.text).toBe('jackpot1');
    expect(res.status).toBe(200);

    res = await request(app).get('/test');
    expect(res.text).toBe('jackpot2');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });
});
