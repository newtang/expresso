const express = require('express');

function getRouter() {
  // return express.Router();
  return require('../dist/index.js')();
}

    const specificDessertRouter = getRouter()
    const specificEntreeRouter = getRouter()
    const dessertRouter = getRouter()
    const entreeRouter = getRouter()
    const baseRouter = getRouter()
    const app = express();

    let currentRouteReqProps;

    specificEntreeRouter.get('/', (req, res, next) => {
      console.log("get entrees", req.path, req.originalUrl, req.url, req.baseUrl);
      res.send('entrees');
    });

    specificEntreeRouter.get('/hamburger', (req, res, next) => {
      // currentRouteReqProps = cloneUrlProps(req);
      res.send('hamburger');
    });


    specificDessertRouter.get('/cupcakes', (req, res, next) => {
      console.log("get cupcakes", req.path, req.originalUrl, req.url, req.baseUrl);
      res.send("cupcakes!");
    });

    specificDessertRouter.get('/cookies/chocolatechip', (req, res, next) => {
      // currentRouteReqProps = cloneUrlProps(req);
      res.send("chocolate chip cookies!");
    });



    dessertRouter.use('/desserts', (req, res, next) => {
      console.log("dessertRouter.use", req.path, req.originalUrl, req.url, req.baseUrl);
      next();
    }, specificDessertRouter);

    entreeRouter.use('/entrees', (req, res, next) => {
      console.log("entrees.use", req.path, req.originalUrl, req.url, req.baseUrl);
      next();
    }, specificEntreeRouter);




    baseRouter.use(
      '/api/v1',
      (req, res, next) => {
        console.log("baseRouter.use", req.path, req.originalUrl, req.url, req.baseUrl);
        next();
      },
      dessertRouter,
      entreeRouter
    );

    app.use(baseRouter);


app.use(function(err, req, res, next) {
	console.log("error catcher", err);
	res.send("error here!")
});


app.listen(3000);
console.log("listening on localhost:3000")