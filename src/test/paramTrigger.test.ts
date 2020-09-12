import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('param trigger tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test.each([undefined, 3])('invalid param type %p', (arg) => {
    const router = expresso();
    expect(() => {
      router.param(arg);
    }).toThrowError('Expected name to be a string');
  });

  test.each(['::value', 'left-right', 'te$t', 'hi there'])('invalid param name %s', (name) => {
    const router = expresso();
    expect(() => {
      router.param(name, jest.fn());
    }).toThrowError(`Invalid parameter name: ${name}`);
  });

  test('duplicate callback error', async () => {
    const router = expresso();
    router.param('id', jest.fn());
    expect(() => {
      router.param('id', jest.fn());
    }).toThrowError('Parameter id already has a callback');
  });

  test('duplicate callback error, colon', async () => {
    const router = expresso();
    router.param('id', jest.fn());
    expect(() => {
      router.param(':id', jest.fn());
    }).toThrowError('Parameter id already has a callback');
  });

  test('No function', async () => {
    const router = expresso();
    expect(() => {
      router.param('id');
    }).toThrowError('Expected callback to be a function');
  });

  test('basic', async () => {
    const app = express();
    const router = expresso();

    let paramValues;
    router.param('value', function (req, res, next, value, name) {
      paramValues = { value, name };
      next();
    });

    router.get('/:value', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/hey');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual({ value: 'hey', name: 'value' });
  });

  test('basic with colon', async () => {
    const app = express();
    const router = expresso();

    let paramValues;
    router.param(':value', function (req, res, next, value, name) {
      paramValues = { value, name };
      next();
    });

    router.get('/:value', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/hey');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual({ value: 'hey', name: 'value' });
  });

  test('multiple', async () => {
    const app = express();
    const router = expresso();

    const paramValues: Array<{ value: string; name: string }> = [];
    router.param('id', function (req, res, next, value, name) {
      paramValues.push({ value, name });
      next();
    });
    router.param('value', function (req, res, next, value, name) {
      paramValues.push({ value, name });
      next();
    });

    router.get('/api/:value/:id', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/api/test/1234');
    expect(res.text).toBe('test');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual([
      { value: 'test', name: 'value' },
      { value: '1234', name: 'id' },
    ]);
  });

  test('multiple, one ignored', async () => {
    const app = express();
    const router = expresso();

    const paramValues: Array<{ value: string; name: string }> = [];
    router.param('id', function (req, res, next, value, name) {
      paramValues.push({ value, name });
      next();
    });
    router.param('value', function (req, res, next, value, name) {
      paramValues.push({ value, name });
      next();
    });

    router.get('/api/:value/:cool', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/api/test/1234');
    expect(res.text).toBe('test');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual([{ value: 'test', name: 'value' }]);
  });
});
