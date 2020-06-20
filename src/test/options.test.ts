import request from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

describe('options tests', () => {
	beforeAll(() => {
		console.error = jest.fn();
	});

	test.each([{ strict:false }/*, undefined*/])('strict:false', async (options) => {
		const app = express();
		const router = expresso(options);
		const msg = 'success';
		const otherMsg = 'alsoSuccess';
		const slashSuccess = 'slashSuccess';

		//starts with trailing slash
		router.get('/test', (req: Request, res: Response) => res.send(msg));

		//starts without trailing slash
		router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));

		//base route
		router.get('/', (req: Request, res: Response) => res.send(slashSuccess));
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

		const slashRes = await request(app).get('/');
		expect(slashRes.text).toBe(slashSuccess);
		expect(slashRes.status).toBe(200);

	});

	// test('strict:true', async () => {
	// 	const app = express();
	// 	const router = expresso({ strict: true });
	// 	const msg = 'success';
	// 	const otherMsg = 'alsoSuccess';
	// 	const slashSuccess = 'slashSuccess';

	// 	//starts with trailing slash
	// 	router.get('/test', (req: Request, res: Response) => res.send(msg));

	// 	//starts without trailing slash
	// 	router.get('/othertest/', (req: Request, res: Response) => res.send(otherMsg));

	// 	//base route
	// 	router.get('/', (req: Request, res: Response) => res.send(slashSuccess));

	// 	app.use(router);

	// 	const res = await request(app).get('/test');
	// 	expect(res.text).toBe(msg);
	// 	expect(res.status).toBe(200);

	// 	const resTrailingSlash = await request(app).get('/test/');
	// 	expect(resTrailingSlash.status).toBe(500);

	// 	const otherRes = await request(app).get('/othertest');
	// 	expect(otherRes.status).toBe(500);

	// 	const otherResTrailingSlash = await request(app).get('/othertest/');
	// 	expect(otherResTrailingSlash.text).toBe(otherMsg);
	// 	expect(otherResTrailingSlash.status).toBe(200);

	// 	const slashRes = await request(app).get('/');
	// 	expect(slashRes.text).toBe(slashSuccess);
	// 	expect(slashRes.status).toBe(200);
	// });

	// test.each([{ caseSensitive:false }, undefined])('caseSensitive:false', async (options) => {
	// 	const app = express();
	// 	const router = expresso(options);
	// 	const msg = 'success!';
		
	// 	router.get('/test', (req: Request, res: Response) => res.send(msg));

	// 	app.use(router);

	// 	let res = await request(app).get('/test');
	// 	expect(res.text).toBe(msg);
	// 	expect(res.status).toBe(200);

	// 	res = await request(app).get('/TEST');
	// 	expect(res.text).toBe(msg);
	// 	expect(res.status).toBe(200);

	// 	res = await request(app).get('/tEsT/');
	// 	expect(res.text).toBe(msg);
	// 	expect(res.status).toBe(200);

	// });

	// test('caseSensitive:true', async () => {
	// 	const app = express();
	// 	const router = expresso({ caseSensitive: true });
	// 	const msg = 'success!';
	// 	const msg2 = 'also success';
		
	// 	router.get('/test', (req: Request, res: Response) => res.send(msg));

	// 	router.get('/OtHeR', (req: Request, res: Response) => res.send(msg2));

	// 	app.use(router);

	// 	let res = await request(app).get('/test');
	// 	expect(res.text).toBe(msg);
	// 	expect(res.status).toBe(200);

	// 	res = await request(app).get('/TEST');
	// 	expect(res.status).toBe(500);

	// 	res = await request(app).get('/tEsT/');
	// 	expect(res.status).toBe(500);

	// 	let otherRes = await request(app).get('/OtHeR');
	// 	expect(otherRes.text).toBe(msg2);
	// 	expect(otherRes.status).toBe(200);

	// 	otherRes = await request(app).get('/OTHER');
	// 	expect(otherRes.status).toBe(500);

	// 	otherRes = await request(app).get('/oThEr/');
	// 	expect(res.status).toBe(500);

	// 	otherRes = await request(app).get('/other/');
	// 	expect(otherRes.status).toBe(500);

	// });

});