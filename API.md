# API

## Config

The router takes an optional configuration object. 

| Property  | Description | Default |
|---|---|---|
| allowDuplicatePaths | Enables duplicate paths. |  Disabled by default. Two identical paths like: `/api` and `/api` or `/id/:id` and `/id/:num` are prohibited |
| allowDuplicateParams | Allows a path to have parameters with duplicate names.  |  Disabled by default. `/api/:foo/something/:foo` is prohibited |
| allowRegex | Enable regular expression routes. Valid values are: false, 'safe', 'all'. The value 'safe' will throw an exception if it detects a catastrophic, exponential-time regular expression, as specified by [safe-regex](https://www.npmjs.com/package/safe-regex). | Disabled by default. |
| caseSensitive | Enable case sensitivity.  | Disabled by default, treating “/Foo” and “/foo” as the same. [Same as Express](https://expressjs.com/en/4x/api.html#express.router) |
| strict | Enable strict routing. | Disabled by default, “/foo” and “/foo/” are treated the same by the router. [Same as Express](https://expressjs.com/en/4x/api.html#express.router) |

```js
//throws exception
const router = expresso();
router.get(/^api$/, (req, res) => {
  res.send('Hello World');
});
```

```js
//works fine
const router = expresso({allowRegex:'safe'});
router.get(/^api$/, (req, res) => { 
  res.send('Hello World');
});
````

## API

Expresso mimics the available function calls from the default Express Router, listed below. There are a few subtle differences which are outlined in the [Migration section](#Migration).

- [router.all()](https://expressjs.com/en/4x/api.html#router.all)
- [router.METHOD()](https://expressjs.com/en/4x/api.html#router.METHOD)
- [router.param()](https://expressjs.com/en/4x/api.html#router.param)
- [router.route()](https://expressjs.com/en/4x/api.html#router.route)
- [router.use()](https://expressjs.com/en/4x/api.html#router.use)


## Speed

For several different measures of static route comparison, Expresso-router comes out ahead of the default express router.

```sh

====================
 expresso benchmark
====================
short static: 8,375,979 ops/sec
static with same radix: 8,533,307 ops/sec
long static: 7,822,262 ops/sec

=================================
 default express router benchmark
=================================
short static: 1,676,429 ops/sec
static with same radix: 1,590,129 ops/sec
long static: 829,426 ops/sec

```

For parameterized routes, Expresso-router is again faster, but the difference isn't as stark.

```sh
====================
 expresso benchmark
====================
dynamic route: 928,018 ops/sec
mixed static dynamic: 765,725 ops/sec

=================================
 default express router benchmark
=================================
dynamic route: 743,979 ops/sec
mixed static dynamic: 613,461 ops/sec
```

However, the default express router can get slower the more routes that are added. For example, if it has 100 parameterized routes, it would run through all of them until it found a match. Expresso-router, utilizes a tree, so it scales much more efficiently.


## Route Order Independence 

Order independence is a big feature for Expresso. In the default Express router, this situation was possible:

```js
router.get('/api/v1/:user', (req, res) => {res.send(req.params.user)});

// will never get called in Express, but will get called in Expresso-Router
router.get('/api/v1/settings', (req, res) => {res.send('settings')});

```

In the above example, a GET request to '/api/v1/settings' will never trigger the second route in Express because the previous one would technically a match a request to '/api/v1/settings' even though it's less specific. However, with Expresso-router, this is no longer a concern. Routes are order independent, and Expresso-Router will check the most specific route first.

The minor exception to this rule is the `use` function. `use` will only affect the valid routes defined after it.

```js
const express = require('express');
const expresso = require('expresso-router');
const router = expresso({allowRegex:'safe'});

// use function below is not called
router.get('/api/user/:id', (req, res) => { 
  res.send('Hello World');
});

router.use('/api', () => {/* do something */});

// above use function will be called
router.get('/api/object/:id', (req, res) => { 
  res.send('Hello World');
});

````


## Migration

If you're considering changing your router, there are a few patterns that the default Express router allows that will not function as expected in Expresso-router. These are mostly around triggering multiple routes with the same request. Here are some examples:


Filtering one router into another. [Issue](https://github.com/newtang/expresso/issues/21)
```js
router.get("/api/static", (req, res, next) => next()) 
router.get("/api/:param", (req, res, next) => doSomething()) //won't get called with expresso-router
```

Changing the url mid-route 
```js
router.get("/api", (req, res, next) => {
  req.url = "/foo";
  next();
});

router.get("/foo", (req, res, next) => doSomething()) //won't get called with expresso-router
````

Additionally, there are some features that are possible, but haven't been implemented, like [wildcard support in parameterized routes](https://github.com/newtang/expresso/issues/19), or [supporting parameterized routes in `router.use`](https://github.com/newtang/expresso/issues/6). If you're excited about a feature, please leave a comment or a reaction, or a file a new issue.


