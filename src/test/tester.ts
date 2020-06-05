import express from 'express';
import expresso from '../index';
// const router = express.Router();
const router = expresso();


const app = express();

// define the home page route
router.get('/test', function (req, res) {
  res.send('Birds home page')
})

app.use(router);

const port = 3000;
app.listen(port);
console.log(`server listening on ${port}`)