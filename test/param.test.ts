import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('param tests', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  test('start with param', async () => {
    const app = express();
    const router = expresso();

    router.get('/:value', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    let res = await request(app).get('/hey');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);

    res = await request(app).get('/other/');
    expect(res.text).toBe('other');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/');
    expect(resWithError.status).toBe(404);
  });

  test('param then static', async () => {
    const app = express();
    const router = expresso();

    router.get('/:value/static', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    let res = await request(app).get('/hey/static');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);

    res = await request(app).get('/other/static/');
    expect(res.text).toBe('other');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/test/');
    expect(resWithError.status).toBe(404);
  });

  test('static then param', async () => {
    const app = express();
    const router = expresso();

    router.get('/static/:value/', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    let res = await request(app).get('/static/hey');
    expect(res.text).toBe('hey');
    expect(res.status).toBe(200);

    res = await request(app).get('/static/other/');
    expect(res.text).toBe('other');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/static/');
    expect(resWithError.status).toBe(404);
  });

  test('2 params, different param names', async () => {
    const app = express();
    const router = expresso();

    router.get('/static/:value/:othervalue', (req: Request, res: Response) =>
      res.send(`${req.params.value}-${req.params.othervalue}`)
    );

    app.use(router);

    let res = await request(app).get('/static/hey/there');
    expect(res.text).toBe('hey-there');
    expect(res.status).toBe(200);

    res = await request(app).get('/static/good/bye/');
    expect(res.text).toBe('good-bye');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/static/hey/');
    expect(resWithError.status).toBe(404);
  });

  test('2 params, same param names - prohibited', async () => {
    const router = expresso({ strict: true, allowDuplicateParams: false });

    expect(() => {
      router.get('/static/:value/:value', (req: Request, res: Response) => res.send(req.params.value));
    }).toThrowError(
      "In path /static/:value/:value, duplicate param name discovered: value. Consider renaming or enabling 'allowDuplicateParams'."
    );
  });

  test('2 params, same param names - permitted', async () => {
    const app = express();
    const router = expresso({ allowDuplicateParams: true });

    router.get('/static/:value/:value', (req: Request, res: Response) => res.send(req.params.value));

    app.use(router);

    let res = await request(app).get('/static/hey/there');
    expect(res.text).toBe('there');
    expect(res.status).toBe(200);

    res = await request(app).get('/static/good/bye/');
    expect(res.text).toBe('bye');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/static/hey/');
    expect(resWithError.status).toBe(404);
  });

  test('param shadowed by static', async () => {
    const app = express();
    const router = expresso();

    router.get('/v1/:id/', (req: Request, res: Response) => res.send(req.params.id));

    router.get('/v1/admin/', (req: Request, res: Response) => res.send('jackpot'));

    app.use(router);

    let res = await request(app).get('/v1/1234');
    expect(res.text).toBe('1234');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/1234/');
    expect(res.text).toBe('1234');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/admin');
    expect(res.text).toBe('jackpot');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/admin/');
    expect(res.text).toBe('jackpot');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/v1/');
    expect(resWithError.status).toBe(404);
  });

  test('param shadowed by static #2', async () => {
    const app = express();
    const router = expresso();

    router.get('/v1/admin/', (req: Request, res: Response) => res.send('jackpot'));

    router.get('/v1/:id/', (req: Request, res: Response) => res.send(req.params.id));

    app.use(router);

    let res = await request(app).get('/v1/1234');
    expect(res.text).toBe('1234');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/1234/');
    expect(res.text).toBe('1234');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/admin');
    expect(res.text).toBe('jackpot');
    expect(res.status).toBe(200);

    res = await request(app).get('/v1/admin/');
    expect(res.text).toBe('jackpot');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/v1/');
    expect(resWithError.status).toBe(404);
  });

  test('case sensitive param name', async () => {
    const app = express();
    const router = expresso();

    router.get('/api/:userId', (req: Request, res: Response) => res.send(req.params.userId));

    app.use(router);

    let res = await request(app).get('/api/jon');
    expect(res.text).toBe('jon');
    expect(res.status).toBe(200);

    res = await request(app).get('/api/camelCaseValue');
    expect(res.text).toBe('camelCaseValue');
    expect(res.status).toBe(200);
  });

  test('value with dash', async () => {
    const app = express();
    const router = expresso();

    router.get('/v1/:value', (req: Request, res: Response) => res.send(req.params.value));
    app.use(router);

    const res = await request(app).get('/v1/test-dash');
    expect(res.text).toBe('test-dash');
    expect(res.status).toBe(200);
  });

  test('.route param basic', async () => {
    const app = express();
    const router = expresso();

    router
      .route('/api/:id')
      .get((req: Request, res: Response) => {
        res.send(`get success ${req.params.id}`);
      })
      .post((req: Request, res: Response) => {
        res.send(`post success ${req.params.id}`);
      })
      .patch((req: Request, res: Response) => {
        res.send(`patch success ${req.params.id}`);
      });

    app.use(router);

    let res = await request(app).get('/api/cool');
    expect(res.text).toBe('get success cool');
    expect(res.status).toBe(200);

    res = await request(app).post('/api/1234');
    expect(res.text).toBe('post success 1234');
    expect(res.status).toBe(200);

    res = await request(app).patch('/api/foobar');
    expect(res.text).toBe('patch success foobar');
    expect(res.status).toBe(200);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('should automatically decode path value', async () => {
    const app = express();
    const router = expresso();

    router.get('/user/:id', function (req, res) {
      res.send('encode ' + req.params.id);
    });

    app.use(router);

    const res = await request(app).get('/user/%22abc%2Fefgh%22');
    expect(res.text).toBe('encode "abc/efgh"');
    expect(res.status).toBe(200);
  });

  test('should handle malformed uri encoding', async () => {
    const app = express();
    const router = expresso();

    router.get('/user/:id', function (req, res) {
      res.send('encode ' + req.params.id);
    });

    app.use(router);

    const res = await request(app).get('/user/%E0%A4%A');
    expect(res.text).toBe('encode %E0%A4%A');
    expect(res.status).toBe(200);
  });
});
