import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response, NextFunction } from 'express';

describe('router.use', () => {
  test('chainable', async () => {
    const router = expresso();
    expect(router).toBe(router.use(jest.fn()));
  });

  test.each(['', [], '/:param', '/api/#hash'])('invalid use paths', (path) => {
    const router = expresso();
    expect(() => {
      router.use(path, jest.fn());
    }).toThrowError(`Invalid path: ${path}`);
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
    const router = expresso();

    let useCalled = false;
    router.use(function (req: Request, res: Response, next: NextFunction) {
      useCalled = true;
      next();
    });

    const msg = 'success';

    router.get('/', (req: Request, res: Response) => res.send(msg));
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);
    expect(useCalled).toBe(true);

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('all paths - multiple functions', async () => {
    const app = express();
    const router = expresso();

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
    let getUrlProps;
    router.get('/', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send(msg);
    });
    app.use(router);

    const res = await request(app).get('/');
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

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('specified path', async () => {
    const app = express();
    const router = expresso();

    let useUrlProps: null | { [key: string]: string } = null;
    router.use('/v1/', function (req: Request, res: Response, next: NextFunction) {
      useUrlProps = cloneUrlProps(req);
      next();
    });

    let getUrlProps;
    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/v2/api', (req: Request, res: Response) => res.send('success2'));
    router.get('/v1/api', (req: Request, res: Response) => {
      getUrlProps = cloneUrlProps(req);
      res.send('success3');
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

    res = await request(app).get('/v1/api');
    expect(res.text).toBe('success3');
    expect(res.status).toBe(200);

    expect(useUrlProps).toStrictEqual({
      originalUrl: '/v1/api',
      url: '/api',
      baseUrl: '/v1',
      path: '/api',
    });

    expect(getUrlProps).toStrictEqual({
      originalUrl: '/v1/api',
      url: '/v1/api',
      baseUrl: '',
      path: '/v1/api',
    });

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  })

  test('mounted router', async () => {
    const mountedRouter = expresso();
    const baseRouter = expresso();
    const app = express();

    let mountedRouterProps;
    mountedRouter.get('/id/:id/settings', (req, res) => {
      mountedRouterProps = cloneUrlProps(req);
      res.send('success');
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
    baseRouter.get('/otherapi/test', (req, res) => {
      otherProps = cloneUrlProps(req);
      res.send("other success");
    });

    app.use(baseRouter);

    let res = await request(app).get('/api/id/1234/settings');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);

    expect(baseRouterProps).toStrictEqual({
      path: '/id/1234/settings',
      originalUrl: '/api/id/1234/settings',
      url: '/id/1234/settings',
      baseUrl: '/api'
    })

    expect(mountedRouterProps).toStrictEqual({
      path:'/id/1234/settings',
      originalUrl:'/api/id/1234/settings',
      url:'/id/1234/settings',
      baseUrl:'/api'
    });

    res = await request(app).get('/otherapi/test');
    expect(res.text).toBe('other success');
    expect(res.status).toBe(200);
    expect(otherProps).toStrictEqual({
      originalUrl: '/otherapi/test',
      url: '/otherapi/test',
      baseUrl: '',
      path: '/otherapi/test',
    });
  });

  test('multi-level, mounted router', async () => {
    const specificDessertRouter = expresso();
    const specificEntreeRouter = expresso();
    const dessertRouter = expresso();
    const entreeRouter = expresso();
    const baseRouter = expresso();
    const app = express();

    let currentRouteReqProps;

    specificEntreeRouter.get('/', (req, res, next) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('entrees');
    });

    specificEntreeRouter.get('/hamburger', (req, res, next) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send('hamburger');
    });


    specificDessertRouter.get('/cupcakes', (req, res, next) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send("cupcakes!");
    });

    specificDessertRouter.get('/cookies/chocolatechip', (req, res, next) => {
      currentRouteReqProps = cloneUrlProps(req);
      res.send("chocolate chip cookies!");
    });



    let dessertRouterProps;
    dessertRouter.use('/desserts', (req, res, next) => {
      dessertRouterProps = cloneUrlProps(req);
      next();
    }, specificDessertRouter);

    let entreeRouterProps;
    entreeRouter.use('/entrees', (req, res, next) => {
      entreeRouterProps = cloneUrlProps(req);
      next();
    }, specificEntreeRouter);


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



    let res = await request(app).get('/api/v1/desserts/cupcakes');
    expect(res.text).toBe('cupcakes!');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/desserts/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/desserts/cupcakes',
      baseUrl: '/api/v1'
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts'
    });

    expect(entreeRouterProps).toBeUndefined();

    expect(currentRouteReqProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts'
    });


    res = await request(app).get('/api/v1/entrees/hamburger');
    expect(res.text).toBe('hamburger');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/entrees/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/entrees/hamburger',
      baseUrl: '/api/v1'
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cupcakes',
      originalUrl: '/api/v1/desserts/cupcakes',
      url: '/cupcakes',
      baseUrl: '/api/v1/desserts'
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees'
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees'
    });






    res = await request(app).get('/api/v1/desserts/cookies/chocolatechip');
    expect(res.text).toBe("chocolate chip cookies!");
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/desserts/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/desserts/cookies/chocolatechip',
      baseUrl: '/api/v1'
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts'
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/hamburger',
      originalUrl: '/api/v1/entrees/hamburger',
      url: '/hamburger',
      baseUrl: '/api/v1/entrees'
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts'
    });





    res = await request(app).get('/api/v1/entrees');
    expect(res.text).toBe('entrees');
    expect(res.status).toBe(200);
    expect(baseRouterProps).toStrictEqual({
      path: '/entrees',
      originalUrl: '/api/v1/entrees',
      url: '/entrees',
      baseUrl: '/api/v1'
    });

    expect(dessertRouterProps).toStrictEqual({
      path: '/cookies/chocolatechip',
      originalUrl: '/api/v1/desserts/cookies/chocolatechip',
      url: '/cookies/chocolatechip',
      baseUrl: '/api/v1/desserts'
    });

    expect(entreeRouterProps).toStrictEqual({
      path: '/',
      originalUrl: '/api/v1/entrees',
      url: '/',
      baseUrl: '/api/v1/entrees'
    });

    expect(currentRouteReqProps).toStrictEqual({
      path: '/',
      originalUrl: '/api/v1/entrees',
      url: '/',
      baseUrl: '/api/v1/entrees'
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
