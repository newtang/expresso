import request from 'supertest';
import express from 'express';
import expresso from '../index';

test('getting started', async () => {
	const app = express();
	const router = expresso();
	const msg = 'success';

	router.get('/test', (req, res) => res.send(msg));
	app.use(router);

	const res = await request(app).get('/test');
	expect(res.text).toBe(msg);
	expect(res.status).toBe(200);
});