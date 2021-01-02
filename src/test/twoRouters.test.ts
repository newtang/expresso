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

  test('multiple use', async () => {
    const router = expresso();
    const app = express();

    app.use(router);

    const sub1 = expresso();
    const sub2 = expresso();
    const sub3 = expresso();

    //c
    sub3.get('/zed', setsawBase(1));

    sub2.use('/baz', sub3);

    //b
    sub1.use('/', setsawBase(2));

    sub1.use('/bar', sub2);
    sub1.use('/bar', setsawBase(3));

    //a
    router.use(setsawBase(4));
    router.use('/foo', sub1);

    router.use(setsawBase(5));
    router.use((req, res) => {
      res.send('hello world');
    });

    const res = await request(app).get('/foo/bar/baz/zed');

    expect(res.header['x-saw-base-1']).toBe('/foo/bar/baz');
    expect(res.header['x-saw-base-2']).toBe('/foo');
    expect(res.header['x-saw-base-3']).toBe('/foo/bar');
    expect(res.header['x-saw-base-4']).toBe('');
    expect(res.header['x-saw-base-5']).toBe('');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hello world');
  });

  /*
    Expected order:
    set saw base 4
    set saw base 2
    set saw base 1
    set saw base 3
    set saw base 5

  */
});

function setsawBase(num) {
  const name = 'x-saw-base-' + String(num);
  return function sawBase(req, res, next) {
    console.log('set saw base', num);
    res.setHeader(name, String(req.baseUrl));
    next();
  };
}
