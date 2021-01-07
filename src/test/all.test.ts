import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';
import { createBasicServer } from './utils';
import { METHODS } from 'http';

describe(' "all" tests - express', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('basic routes', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';
    const paramMsg = 'success-param';
    const regexMsg = 'success-regex';

    router.all('/test', (req: Request, res: Response) => res.send(msg));
    router.all('/user/:userId', (req: Request, res: Response) => res.send(paramMsg));
    router.all(/^\/abc/, (req: Request, res: Response) => res.send(regexMsg));
    app.use(router);

    for (const [path, response] of [
      ['/test', msg],
      ['/user/123', paramMsg],
      ['/abc', regexMsg],
    ]) {
      for (const capsMethod of METHODS) {
        if (capsMethod === 'CONNECT') {
          continue;
        }
        const method = capsMethod.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/ban-types
        const res = await (request(app)[method as keyof SuperTest<Test>] as Function)(path);
        if (method !== 'head') {
          expect(res.text).toBe(response);
        }
        expect(res.status).toBe(200);
      }
    }
  });
});

/*
router.all
 - static
 - param
 - regex

- override options
- HEAD still defers to get
- options should not include ALL

 route.all

 */
