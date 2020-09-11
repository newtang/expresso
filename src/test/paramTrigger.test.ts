import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('param trigger tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('basic', async () => {
    const app = express();
    const router = expresso();

    let paramValues;
    router.param('value', function(req, res, next, value, name){
      paramValues = {value, name};
      next();
    });

    router.get('/:value', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/hey');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual({value: 'hey', name: 'value'});

  });

  test('multiple', async () => {
    const app = express();
    const router = expresso();

    let paramValues: Array<{value:string, name:string}> = [];
    router.param('id', function(req, res, next, value, name){
      paramValues.push({value, name});
      next();
    });
    router.param('value', function(req, res, next, value, name){
      paramValues.push({value, name});
      next();
    });

    router.get('/api/:value/:id', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/api/test/1234');
    expect(res.text).toBe('test');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual([{value: 'test', name: 'value'}, {value: '1234', name: 'id'}]);

  });

  test('multiple, one ignored', async () => {
    const app = express();
    const router = expresso();

    let paramValues: Array<{value:string, name:string}> = [];
    router.param('id', function(req, res, next, value, name){
      paramValues.push({value, name});
      next();
    });
    router.param('value', function(req, res, next, value, name){
      paramValues.push({value, name});
      next();
    });

    router.get('/api/:value/:cool', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/api/test/1234');
    expect(res.text).toBe('test');
    expect(res.status).toBe(200);
    expect(paramValues).toStrictEqual([{value: 'test', name: 'value'}]);

  });




});

/*
  Test ideas
  error on :test
  error on multiple of the same

  x test the order of multiple valid ones
  test that some are ignored

*/