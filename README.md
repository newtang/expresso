# expresso-router

A faster, safer, backwards compatible router alternative for Express.

```js
const express = require('express');
const expresso = require('expresso-router');
const router = expresso();

router.get('/', function (req, res) {
  res.send('Hello World');
});

app.use(router);

app.listen(3000);
```

## Installation

```sh
npm install expresso-router
```

## Features

**Speed**
- significantly faster than the default Express original router, especially for static and parameterized routes

**Compatibility**
 - highly compatible with Express [APIs](API.md). A drop-in replacement in many cases.
 - also compatible with [Node's built in http server](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener). 

**Safety**
 - Prevents common sources of error by default by throwing easy-to-understand exceptions when creating invalid or overlapping routes
 - Disallows suboptimal choices, such as regular expression routes, unless explicitly allowed
 - Order independent. The order you add routes shouldn't matter. Expresso will match by specificity.


## Documentation and migration information.

[More detailed API documentation](API.md)


## License

[MIT](LICENSE)

