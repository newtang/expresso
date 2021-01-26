import request from 'supertest';
import express from 'express';
import expresso from '../src/index';
import type { Request, Response, NextFunction } from 'express';

describe('router.use', () => {
  test('chainable', async () => {
    const router = expresso();
    expect(router).toBe(router.use(jest.fn()));
  });

  test.each(['', [], '/:param', '/api/#hash'])('invalid use paths', (path) => {
    const router = expresso();
    expect(() => {
      router.use(path as never, jest.fn());
    }).toThrowError(`Invalid path: ${path}`);
  });

  test.each(['yo', null, undefined, 12, ['test']])('invalid handlers', (handler) => {
    const router = expresso();
    expect(() => {
      router.use('/', handler as never);
    }).toThrowError(`Handler must be a function`);
  });

  test('an array of numbers', async () => {
    const router = expresso();

    expect(() => {
      router.use(([3] as never) as Array<string>);
    }).toThrowError('Handler must be a function');
  });

  test('cannot use regular expressions', () => {
    const router = expresso();
    expect(() => {
      router.use(/api/ as never, jest.fn());
    }).toThrowError(`router.use does not support regular expressions yet: /api/`);
  });

  test('invalid use paths, special error', () => {
    const router = expresso();

    expect(() => {
      router.use('abc', jest.fn());
    }).toThrowError(`First character in path, must be a slash. abc`);

    expect(() => {
      router.use('/v1//api', jest.fn());
    }).toThrowError(`Invalid path. Contains consecutive '//', /v1//api`);
  });

  test('caseSensitive is true', async () => {
    const app = express();
    const router = expresso({ caseSensitive: true });

    router.use('/foo', (req, res, next) => {
      res.send(`saw ${req.method} ${req.url}`);
    });

    app.use(router);

    let response = await request(app).get('/foo/bar');
    expect(response.status).toBe(200);
    expect(response.text).toBe('saw GET /bar');

    response = await request(app).get('/FOO/bar');
    expect(response.status).toBe(404);

    response = await request(app).get('/FOO/BAR');
    expect(response.status).toBe(404);
  });

  test('caseSensitive is false', async () => {
    const app = express();
    const router = expresso({ caseSensitive: false });

    router.use('/foo', (req, res, next) => {
      res.send(`saw ${req.method} ${req.url}`);
    });

    app.use(router);

    let response = await request(app).get('/foo/bar');
    expect(response.status).toBe(200);
    expect(response.text).toBe('saw GET /bar');

    response = await request(app).get('/FOO/bar');
    expect(response.status).toBe(200);
    expect(response.text).toBe('saw GET /bar');

    response = await request(app).get('/FOO/BAR');
    expect(response.status).toBe(200);
    expect(response.text).toBe('saw GET /BAR');
  });

  test('should accept single array of middleware', async () => {
    const app = express();
    const router = expresso();

    router.use([
      (req, res, next): void => {
        res.set('x-header-1', 'hit 1');
        next();
      },
      (req, res, next): void => {
        res.set('x-header-2', 'hit 2');
        next();
      },
      (req, res): void => res.send('success'),
    ]);

    app.use(router);

    const response = await request(app).get('/');
    expect(response.header['x-header-1']).toBe('hit 1');
    expect(response.header['x-header-2']).toBe('hit 2');
    expect(response.status).toBe(200);
    expect(response.text).toBe('success');
  });

  test('should restore req.url', async () => {
    const app = express();
    const router = expresso();

    router.use('/foo', function (req, res, next) {
      res.setHeader('x-header-1', req.method + ' ' + req.url);
      next();
    });
    router.use(function (req, res, next) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`resp ${req.method} ${req.url}`);
    });

    app.use(router);

    const res = await request(app).get('/foo/bar');
    expect(res.status).toBe(200);
    expect(res.header['x-header-1']).toBe('GET /bar');
    expect(res.text).toBe('resp GET /foo/bar');
  });

  test('should strip/restore with trailing stash', async () => {
    const app = express();
    const router = expresso({ allowDuplicatePaths: true });

    router.use('/foo', function (req, res, next) {
      res.setHeader('x-header-1', req.method + ' ' + req.url);
      next();
    });
    router.use(function (req, res, next) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`resp ${req.method} ${req.url}`);
    });

    app.use(router);

    const res = await request(app).get('/foo/');
    expect(res.status).toBe(200);
    expect(res.header['x-header-1']).toBe('GET /');
    expect(res.text).toBe('resp GET /foo/');
  });

  test('use added after route', async () => {
    const app = express();
    const router = expresso();
    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    let useCalled = false;
    router.use(function usefxn(req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(false);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('all paths', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    let useCalled = false;
    router.use(function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    const msg = 'success';
    const msg2 = 'success2';

    router.get('/some/long/url', (req: Request, res: Response) => res.send(msg));
    router.get(/^\/api\/v1\/$/gi, (req: Request, res: Response) => res.send(msg2));
    app.use(router);

    let res = await request(app).get('/some/long/url');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    useCalled = false;
    res = await request(app).get('/api/v1/');
    expect(res.text).toBe(msg2);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('all paths - multiple functions', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    let useUrlProps1;
    let useUrlProps2;
    router.use(
      function (req: Request, res: Response, next: NextFunction) {
        useUrlProps1 = cloneUrlProps(req);
        next();
      },
      function (req: Request, res: Response, next: NextFunction) {
        useUrlProps2 = cloneUrlProps(req);
        next();
      }
    );

    const msg = 'success';
    const msg2 = 'success2';
    let getUrlProps;
    let regexGetUrlProps;
    router.get('/', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send(msg);
    });
    router.get(/^\/api\/v1\/$/gi, (req: Request, res: Response) => {
      regexGetUrlProps = cloneUrlProps(req);
      res.send(msg2);
    });
    app.use(router);

    let res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    expect(useUrlProps1).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/',
    });

    expect(useUrlProps2).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/',
    });

    expect(getUrlProps).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/',
    });

    expect(regexGetUrlProps).toBeUndefined();

    useUrlProps1 = null;
    useUrlProps2 = null;
    getUrlProps = null;

    res = await request(app).get('/api/v1/');
    expect(res.text).toBe(msg2);
    expect(res.status).toBe(200);

    expect(useUrlProps1).toStrictEqual({
      originalUrl: '/api/v1/',
      url: '/api/v1/',
      baseUrl: '',
      path: '/api/v1/',
    });

    expect(useUrlProps2).toStrictEqual({
      originalUrl: '/api/v1/',
      url: '/api/v1/',
      baseUrl: '',
      path: '/api/v1/',
    });

    expect(getUrlProps).toBeNull();

    expect(regexGetUrlProps).toStrictEqual({
      originalUrl: '/api/v1/',
      url: '/api/v1/',
      baseUrl: '',
      path: '/api/v1/',
    });

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('specified path', async () => {
    const app = express();
    const router = expresso({ allowRegex: 'safe' });

    let useUrlProps: null | { [key: string]: string } = null;
    router.use('/v1/', function (req: Request, res: Response, next: NextFunction) {
      useUrlProps = cloneUrlProps(req);
      next();
    });

    let getUrlProps;
    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/v2/api', (req: Request, res: Response) => res.send('success2'));
    router.get(/^\/v3\/api$/, (req: Request, res: Response) => res.send('success_regex'));
    router.get('/v1/api', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success3');
    });

    router.get(/^\/v1\/api\/regex\/test\/$/, (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success4');
    });

    app.use(router);

    let res = await request(app).get('/');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useUrlProps).toBeNull();

    res = await request(app).get('/v2/api');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(useUrlProps).toBeNull();

    res = await request(app).get('/v3/api');
    expect(res.text).toBe('success_regex');
    expect(res.status).toBe(200);
    expect(useUrlProps).toBeNull();

    res = await request(app).get('/v1/api');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);

    expect(useUrlProps).toStrictEqual({
      path: '/api',
      originalUrl: '/v1/api',
      url: '/api',
      baseUrl: '/v1',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/v1/api',
      originalUrl: '/v1/api',
      url: '/v1/api',
      baseUrl: '',
    });

    useUrlProps = null; //eslint-disable-line  require-atomic-updates
    getUrlProps = null;

    res = await request(app).get('/v1/api/regex/test/');
    expect(res.text).toBe('success4');
    expect(res.status).toBe(200);

    expect(useUrlProps).toStrictEqual({
      path: '/api/regex/test/',
      originalUrl: '/v1/api/regex/test/',
      url: '/api/regex/test/',
      baseUrl: '/v1',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/v1/api/regex/test/',
      originalUrl: '/v1/api/regex/test/',
      url: '/v1/api/regex/test/',
      baseUrl: '',
    });

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('specified path - non strict', async () => {
    const app = express();
    const router = expresso();

    let useUrlProps: null | { [key: string]: string } = null;
    let useCalled = false;
    router.use('/api/', function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      useUrlProps = cloneUrlProps(req);
      next();
    });

    let getUrlProps;
    router.get('/api', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success');
    });
    app.use(router);

    let res = await request(app).get('/api');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);
    expect(useUrlProps).toStrictEqual({
      path: '/',
      originalUrl: '/api',
      url: '/',
      baseUrl: '/api',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/api',
      originalUrl: '/api',
      url: '/api',
      baseUrl: '',
    });

    useCalled = false;

    res = await request(app).get('/api/');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);
    expect(useUrlProps).toStrictEqual({
      path: '/',
      originalUrl: '/api/',
      url: '/',
      baseUrl: '/api',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/api/',
      originalUrl: '/api/',
      url: '/api/',
      baseUrl: '',
    });
  });

  test('multiple paths', async () => {
    const app = express();
    const router = expresso();

    let useUrlProps: null | { [key: string]: string } = null;
    let useCalled = false;
    router.use(['/api/', '/abc/'], function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      useUrlProps = cloneUrlProps(req);
      next();
    });

    let getUrlProps;
    router.get('/api', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success');
    });

    router.get('/abc', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success2');
    });

    app.use(router);

    let res = await request(app).get('/api');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);
    expect(useUrlProps).toStrictEqual({
      path: '/',
      originalUrl: '/api',
      url: '/',
      baseUrl: '/api',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/api',
      originalUrl: '/api',
      url: '/api',
      baseUrl: '',
    });

    useCalled = false;

    res = await request(app).get('/abc/');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);
    expect(useUrlProps).toStrictEqual({
      path: '/',
      originalUrl: '/abc/',
      url: '/',
      baseUrl: '/abc',
    });

    expect(getUrlProps).toStrictEqual({
      path: '/abc/',
      originalUrl: '/abc/',
      url: '/abc/',
      baseUrl: '',
    });
  });

  test('mounted router', async () => {
    const mountedRouter = expresso({ allowRegex: 'safe' });
    const baseRouter = expresso();
    const app = express();

    let mountedRouterProps;
    mountedRouter.get('/id/:id/settings', (req: Request, res: Response) => {
      mountedRouterProps = cloneUrlProps(req);
      res.send('success');
    });

    mountedRouter.get(/^\/regex\/$/, (req: Request, res: Response) => {
      mountedRouterProps = cloneUrlProps(req);
      res.send('success2');
    });

    let baseRouterProps;
    baseRouter.use(
      '/api/',
      (req, res, next) => {
        baseRouterProps = cloneUrlProps(req);
        next();
      },
      mountedRouter
    );

    let otherProps;
    baseRouter.get('/otherapi/test', (req: Request, res: Response) => {
      otherProps = cloneUrlProps(req);
      res.send('other success');
    });

    app.use(baseRouter);

    let res = await request(app).get('/api/id/1234/settings');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);

    expect(baseRouterProps).toStrictEqual({
      path: '/id/1234/settings',
      originalUrl: '/api/id/1234/settings',
      url: '/id/1234/settings',
      baseUrl: '/api',
    });

    expect(mountedRouterProps).toStrictEqual({
      path: '/id/1234/settings',
      originalUrl: '/api/id/1234/settings',
      url: '/id/1234/settings',
      baseUrl: '/api',
    });

    mountedRouterProps = null;
    res = await request(app).get('/otherapi/test');
    expect(res.text).toBe('other success');
    expect(res.status).toBe(200);
    expect(otherProps).toStrictEqual({
      originalUrl: '/otherapi/test',
      url: '/otherapi/test',
      baseUrl: '',
      path: '/otherapi/test',
    });
    expect(mountedRouterProps).toBeNull();

    res = await request(app).get('/api/regex/');
    expect(res.text).toBe('success2');
    expect(res.status).toBe(200);
    expect(mountedRouterProps).toStrictEqual({
      originalUrl: '/api/regex/',
      url: '/regex/',
      baseUrl: '/api',
      path: '/regex/',
    });
  });

  test('multi-level, mounted router', async () => {
    const specificDessertRouter = expresso({ allowRegex: 'safe' });
    const specificEntreeRouter = expresso();
    const dessertRouter = expresso();
    const entreeRouter = expresso();
    const baseRouter = expresso();
    const app = express();

    let currentRouteReqProps;

    specificEntreeRouter.get('/', (req: Request, res: Response) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('entrees');
    });

    specificEntreeRouter.get('/hamburger', (req: Request, res: Response) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('hamburger');
    });

    specificDessertRouter.get('/cupcakes', (req: Request, res: Response) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('cupcakes!');
    });

    specificDessertRouter.get(/^\/cupcakes\/chocolate$/, (req: Request, res: Response) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('chocolate cupcakes!');
    });

    specificDessertRouter.get('/cookies/chocolatechip', (req: Request, res: Response) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('chocolate chip cookies!');
    });

    let dessertRouterProps;
    dessertRouter.use(
      '/desserts',
      (req, res, next) => {
        dessertRouterProps = cloneUrlProps(req);
        next();
      },
      specificDessertRouter
    );

    let entreeRouterProps;
    entreeRouter.use(
      '/entrees',
      (req, res, next) => {
        entreeRouterProps = cloneUrlProps(req);
        next();
      },
      specificEntreeRouter
    );

    let baseRouterProps;
    baseRouter.use(
      '/api/v1',
      (req, res, next) => {
        baseRouterProps = cloneUrlProps(req);
        next();
      },
      dessertRouter,
      entreeRouter
    );

    app.use(baseRouter);

    let res = await request(app).get('/api/v1/desserts/cupcakes/chocolate');
    expect(res.text).toBe('chocolate cupcakes!');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/desserts/cupcakes/chocolate',
      originalUrl: '/api/v1/desserts/cupcakes/chocolate',
      url: '/desserts/cupcakes/chocolate',
      baseUrl: '/api/v1',
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cupcakes/chocolate',
      originalUrl: '/api/v1/desserts/cupcakes/chocolate',
      url: '/cupcakes/chocolate',
      baseUrl: '/api/v1/desserts',
    });

    expect(entreeRouterProps).toBeUndefined();

    expect(currentRouteReqProps).toStrictEqual({
      path: '/cupcakes/chocolate',
      originalUrl: '/api/v1/desserts/cupcakes/chocolate',
      url: '/cupcakes/chocolate',
      baseUrl: '/api/v1/desserts',
    });

    res = await request(app).get('/api/v1/desserts/cupcakes');
    expect(res.text).toBe('cupcakes!');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/desserts/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/desserts/cupcakes',
      baseUrl: '/api/v1',
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts',
    });

    expect(entreeRouterProps).toBeUndefined();

    expect(currentRouteReqProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts',
    });

    res = await request(app).get('/api/v1/entrees/hamburger');
    expect(res.text).toBe('hamburger');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/entrees/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/entrees/hamburger',
      baseUrl: '/api/v1',
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts',
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees',
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees',
    });

    res = await request(app).get('/api/v1/desserts/cookies/chocolatechip');
    expect(res.text).toBe('chocolate chip cookies!');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/desserts/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/desserts/cookies/chocolatechip',
      baseUrl: '/api/v1',
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts',
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees',
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts',
    });

    res = await request(app).get('/api/v1/entrees');
    expect(res.text).toBe('entrees');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/entrees',
      originalUrl: '/api/v1/entrees',
      url: '/entrees',
      baseUrl: '/api/v1',
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts',
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/',
      originalUrl: '/api/v1/entrees',
      url: '/',
      baseUrl: '/api/v1/entrees',
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/',
      originalUrl: '/api/v1/entrees',
      url: '/',
      baseUrl: '/api/v1/entrees',
    });
  });
});

function cloneProps(obj: { [key: string]: string }, props: Array<string>): { [key: string]: string } {
  const clone = {};
  for (const prop of props) {
    clone[prop] = obj[prop];
  }
  return clone;
}

function cloneUrlProps(req): { [key: string]: string } {
  return cloneProps(req, ['originalUrl', 'url', 'baseUrl', 'path']);
}
