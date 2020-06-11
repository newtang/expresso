import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('options tests', () => {
	test('default strict', async () => {
		const app = express();
		const router = expresso();
		const msg = 'success';

		router.get('/test', (req: Request, res: Response) => res.send(msg));
		app.use(router);

		const res = await request(app).get('/test');
		expect(res.text).toBe(msg);
		expect(res.status).toBe(200);

		const resTrailingSlash = await request(app).get('/test/');
		expect(resTrailingSlash.text).toBe(msg);
		expect(resTrailingSlash.status).toBe(200);
	});

	test('strict:false', async () => {
		const app = express();
		const router = expresso({ strict:false });
		const msg = 'success';
		const otherMsg = 'alsoSuccess';

		//starts with trailing slash
		router.get('/test', (req: Request, res: Response) => res.send(msg));

		//starts without trailing slash
		router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));
		app.use(router);

		const res = await request(app).get('/test');
		expect(res.text).toBe(msg);
		expect(res.status).toBe(200);

		const resTrailingSlash = await request(app).get('/test/');
		expect(resTrailingSlash.text).toBe(msg);
		expect(resTrailingSlash.status).toBe(200);

		const otherRes = await request(app).get('/othertest');
		expect(otherRes.text).toBe(otherMsg);
		expect(otherRes.status).toBe(200);

		const otherResTrailingSlash = await request(app).get('/othertest/');
		expect(otherResTrailingSlash.text).toBe(otherMsg);
		expect(otherResTrailingSlash.status).toBe(200);

	});

	test('strict:true', async () => {
		const app = express();
		const router = expresso({ strict: true });
		const msg = 'success';
		const otherMsg = 'alsoSuccess';

		//starts with trailing slash
		router.get('/test', (req: Request, res: Response) => res.send(msg));

		//starts without trailing slash
		router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));

		app.use(router);

		const res = await request(app).get('/test');
		expect(res.text).toBe(msg);
		expect(res.status).toBe(200);

		// const resTrailingSlash = await request(app).get('/test/');
		// expect(resTrailingSlash.status).toBe(404);

		// const otherRes = await request(app).get('/othertest');
		// expect(otherRes.status).toBe(404);

		const otherResTrailingSlash = await request(app).get('/othertest/');
		expect(otherResTrailingSlash.text).toBe(otherMsg);
		expect(otherResTrailingSlash.status).toBe(200);
	});

});