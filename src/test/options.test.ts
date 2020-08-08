import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

describe('options tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test.each([{ strict: false }, undefined])('strict:false', async (options) => {
    const app = express();
    const router = expresso(options);
    const msg = 'success';
    const otherMsg = 'alsoSuccess';
    const slashSuccess = 'slashSuccess';

    //starts with trailing slash
    router.get('/test', (req: Request, res: Response) => res.send(msg));

    //starts without trailing slash
    router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));

    //param route without trailing slash
    router.get('/api/:id', (req: Request, res: Response) => res.send(req.params.id));

    //param route with trailing slash
    router.get('/v2/:user/', (req: Request, res: Response) => res.send(req.params.user));

    //base route
    router.get('/', (req: Request, res: Response) => res.send(slashSuccess));
    app.use(router);

    let res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/test/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/othertest');
    expect(res.text).toBe(otherMsg);
    expect(res.status).toBe(200);

    res = await request(app).get('/othertest/');
    expect(res.text).toBe(otherMsg);
    expect(res.status).toBe(200);

    res = await request(app).get('/api/yo');
    expect(res.text).toBe('yo');
    expect(res.status).toBe(200);

    res = await request(app).get('/api/yo2/');
    expect(res.text).toBe('yo2');
    expect(res.status).toBe(200);

    res = await request(app).get('/v2/someone');
    expect(res.text).toBe('someone');
    expect(res.status).toBe(200);

    res = await request(app).get('/v2/someone2/');
    expect(res.text).toBe('someone2');
    expect(res.status).toBe(200);

    res = await request(app).get('/');
    expect(res.text).toBe(slashSuccess);
    expect(res.status).toBe(200);
  });

  test('strict:true', async () => {
    const app = express();
    const router = expresso({ strict: true });
    const msg = 'success';
    const otherMsg = 'alsoSuccess';
    const slashSuccess = 'slashSuccess';

    //starts with trailing slash
    router.get('/test', (req: Request, res: Response) => res.send(msg));

    //starts without trailing slash
    router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));

    //param route without trailing slash
    router.get('/api/:id', (req: Request, res: Response) => res.send(req.params.id));

    //param route with trailing slash
    router.get('/v2/:user/', (req: Request, res: Response) => res.send(req.params.user));

    //base route
    router.get('/', (req: Request, res: Response) => res.send(slashSuccess));

    app.use(router);

    let res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/test/');
    expect(res.status).toBe(500);

    res = await request(app).get('/othertest');
    expect(res.status).toBe(500);

    res = await request(app).get('/othertest/');
    expect(res.text).toBe(otherMsg);
    expect(res.status).toBe(200);

    res = await request(app).get('/api/yo');
    expect(res.text).toBe('yo');
    expect(res.status).toBe(200);

    res = await request(app).get('/api/yo2/');
    expect(res.status).toBe(500);

    res = await request(app).get('/v2/someone');
    expect(res.status).toBe(500);

    res = await request(app).get('/v2/someone2/');
    expect(res.text).toBe('someone2');
    expect(res.status).toBe(200);

    res = await request(app).get('/');
    expect(res.text).toBe(slashSuccess);
    expect(res.status).toBe(200);
  });

  test.each([{ caseSensitive: false }, undefined])('caseSensitive:false', async (options) => {
    const app = express();
    const router = expresso(options);
    const msg = 'success!';

    router.get('/test', (req: Request, res: Response) => res.send(msg));
    router.get('/route/:paRAM', (req: Request, res: Response) => res.send(req.params.paRAM));

    app.use(router);

    let res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/TEST');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/tEsT/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/route/test');
    expect(res.text).toBe('test');
    expect(res.status).toBe(200);

    res = await request(app).get('/ROUTE/TEST');
    expect(res.text).toBe('TEST');
    expect(res.status).toBe(200);

    res = await request(app).get('/rOUte/tEsT');
    expect(res.text).toBe('tEsT');
    expect(res.status).toBe(200);
  });

  test('caseSensitive:true', async () => {
    const app = express();
    const router = expresso({ caseSensitive: true });
    const msg = 'success!';
    const msg2 = 'also success';

    router.get('/test', (req: Request, res: Response) => res.send(msg));

    router.get('/OtHeR', (req: Request, res: Response) => res.send(msg2));

    router.get('/roUTE/:paRAM', (req: Request, res: Response) => res.send(req.params.paRAM));

    app.use(router);

    let res = await request(app).get('/test');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    res = await request(app).get('/TEST');
    expect(res.status).toBe(500);

    res = await request(app).get('/tEsT/');
    expect(res.status).toBe(500);

    res = await request(app).get('/OtHeR');
    expect(res.text).toBe(msg2);
    expect(res.status).toBe(200);

    res = await request(app).get('/OTHER');
    expect(res.status).toBe(500);

    res = await request(app).get('/oThEr/');
    expect(res.status).toBe(500);

    res = await request(app).get('/other/');
    expect(res.status).toBe(500);

    res = await request(app).get('/roUTE/oK');
    expect(res.text).toBe('oK');
    expect(res.status).toBe(200);

    res = await request(app).get('/route/oK');
    expect(res.status).toBe(500);

    res = await request(app).get('/ROUTE/oK');
    expect(res.status).toBe(500);
  });

  test.each(['/', '/test', '/abc/123/'])('allowDuplicatePaths: false', async (path) => {
    const app = express();
    const router = expresso({ allowDuplicatePaths: false });

    router.get(path, (req: Request, res: Response) => res.send({}));
    expect(() => {
        router.get(path, (req: Request, res: Response) => res.send({}));
    })
    .toThrowError(`Duplicate path prohibited with allowDuplicatePaths=false. GET: ${path}`)
  });

  test('allowDuplicatePaths:true', async () => {
    const app = express();
    const router = expresso({ allowDuplicatePaths: true });
    const msg = 'success!';
    let firstCalled = false;


    router.get('/test', (req: Request, res: Response, next:NextFunction) => {
        firstCalled = true;
        next();
    });

    router.get('/test', (req: Request, res: Response) => res.send(msg));

    app.use(router);

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.text).toBe(msg);

  });

});
