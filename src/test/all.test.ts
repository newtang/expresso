import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';
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

  test('router.route.all', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';
    const paramMsg = 'success-param';
    const regexMsg = 'success-regex';

    router.route('/test').all((req: Request, res: Response) => res.send(msg));
    router.route('/user/:userId').all((req: Request, res: Response) => res.send(paramMsg));
    router.route(/^\/abc/).all((req: Request, res: Response) => res.send(regexMsg));

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

  test('HEAD uses get function', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });
    const msg = 'success';

    let allUsed = false;
    router.all('/test', (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get('/test', (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send(msg);
    });

    router.all('/user/:userId', (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get('/user/:userId', (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send(msg);
    });

    router.all(/^\/abc/, (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get(/^\/abc/, (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send(msg);
    });

    app.use(router);

    for (const path of ['/test', '/user/123', '/abc']) {
      let res = await request(app).head(path);
      expect(res.status).toBe(200);
      expect(res.header['x-get-hit']).toBe('true');
      expect(allUsed).toBe(false);

      res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.header['x-get-hit']).toBe('true');
      expect(res.text).toBe(msg);
    }
  });

  test('OPTIONS uses all function', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    let allUsed = false;
    router.all('/test', (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get('/test', (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send('success-static-get');
    });

    router.all('/user/:userId', (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get('/user/:userId', (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send('success-static-get');
    });

    router.all(/^\/abc/, (req: Request, res: Response) => {
      res.send('all');
      allUsed = true;
    });
    router.get(/^\/abc/, (req: Request, res: Response) => {
      res.set('x-get-hit', 'true');
      res.send('success-static-get');
    });

    app.use(router);

    for (const path of ['/test', '/user/123', '/abc']) {
      const res = await request(app).options(path);
      expect(res.status).toBe(200);
      expect(allUsed).toBe(true);
      allUsed = false;
    }
  });
});
