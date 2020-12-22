import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';
import { NextHandleFunction, HandleFunction, ErrorHandleFunction } from 'connect';
import { METHODS } from 'http';

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
      (((req: Request, res: Response, next: NextFunction) => {
        errCalled = true;
        next();
      }) as ErrorHandleFunction),
      (req: Request, res: Response, next: NextFunction) => {
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
});

/**
  error is skipped
  non-error is skipped when in error mode

  may need tests for different storages
  may need test for use, route(), etc

  test for err === 'route',
  test for err === 'router

**/
