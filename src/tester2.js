const express = require('express');

const router = express.Router(); 
// const router = require('../dist/index.js')();
const app = express();



router.param('id', function(req, res, next, id){
  console.log(".param: Id here", id);
  req.params.id = id + "X";
  next();
});

router.param('id', function(req, res, next, id){
  console.log(".param: Id here #2", id, req.params.id);
  req.params.id = id + "Y";
  next();
});

router.use("/api/", function(req, res, next){
  console.log("Use", req.params);
  next();
});



router.get('/api/:id/settings', function(req, res, next){
  console.log("get middleware, id", req.params.id);
  next();
},
function(req, res, next){
  console.log("get, id", req.params.id);
  res.send('hi');
});




router.param('foo', function(req,res, next, id, name){
  console.log("foo", id, name);
  next();
})

router.param('bar', function(req,res, next, id, name){
  console.log("bar", id, name);
  next();
})


router.get('/test/:foo/:bar', function(req, res, next){
  res.send('foobar');
})



app.use(router);

app.listen(3000);
console.log("listening on localhost:3000")