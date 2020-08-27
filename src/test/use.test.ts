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
      res.send(msg)
    });
    app.use(router);

    const res = await request(app).get('/');
    expect(res.text).toBe(msg);
    expect(res.status).toBe(200);

    expect(useUrlProps1).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/'
    });

    expect(useUrlProps2).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/'
    });

    expect(getUrlProps).toStrictEqual({
      originalUrl: '/',
      url: '/',
      baseUrl: '',
      path: '/'
    });



    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  test('specified path', async () => {
    const app = express();
    const router = expresso();

    let useUrlProps: null | {} = null;
    router.use('/v1/', function (req: Request, res: Response, next: NextFunction) {
      useUrlProps = cloneUrlProps(req);
      next();
    });

    router.get('/', (req: Request, res: Response) => res.send('success'));
    router.get('/v2/api', (req: Request, res: Response) => res.send('success2'));
    router.get('/v1/api', (req: Request, res: Response) => res.send('success3'));
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

    /***
      * TODO Check this
    **/

    expect(useUrlProps).toStrictEqual({
      originalUrl: '/v1/api',
      url: '/v1/api',
      baseUrl: '/v1/',
      path: '/v1/api'
    });

    const resWithError = await request(app).get('/error');
    expect(resWithError.status).toBe(404);
  });

  /**
   Test
   req.originalUrl, 
   req.url,
   req.baseUrl
   req.path

   errors call all the use functions
   params in mounted routers

  **/

  test('mounted router', async () => {
    const mountedRouter = expresso();
    const baseRouter = expresso();
    const app = express();

    let mountedRouterProps;
    mountedRouter.get("/id/:id/settings", 
      (req, res, next) => {
        mountedRouterProps = cloneUrlProps(req);
        res.send('success');
      }
    );

    let baseRouterProps;
    baseRouter.use("/api/", (req, res, next) => {
      baseRouterProps = cloneUrlProps(req);
      next();
    }, mountedRouter);

    app.use(baseRouter);
  

    let res = await request(app).get('/api/id/1234/settings');
    expect(res.text).toBe('success');
    expect(res.status).toBe(200);

    expect(baseRouterProps.path).toBe('/id/1234/settings');
    expect(baseRouterProps.originalUrl).toBe('/api/id/1234/settings');
    expect(baseRouterProps.url).toBe('/id/1234/settings');
    expect(baseRouterProps.baseUrl).toBe('/api');
    
    expect(mountedRouterProps.path).toBe('/id/1234/settings');
    expect(mountedRouterProps.originalUrl).toBe('/api/id/1234/settings');
    expect(mountedRouterProps.url).toBe('/id/1234/settings');
    expect(mountedRouterProps.baseUrl).toBe('/api');
    

  });

});

function cloneProps(obj, props){
  const clone = {};
  for(const prop of props){
    clone[prop] = obj[prop];
  }
  return clone;
}

function cloneUrlProps(req:Request){
  return cloneProps(req, ['originalUrl', 'url', 'baseUrl', 'path']);
}







