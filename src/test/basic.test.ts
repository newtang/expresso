import request, { SuperTest, Test } from 'supertest';
import express from 'express';
import expresso from '../index';
import type { Request, Response } from 'express';

import { METHODS } from 'http';

describe('basic tests', () => {
	test('getting started', async () => {
		const app = express();
		const router = expresso();
		const msg = 'success';

		router.get('/test', (req: Request, res: Response) => res.send(msg));
		app.use(router);

		const res = await request(app).get('/test');
		expect(res.text).toBe(msg);
		expect(res.status).toBe(200);
	});

	test.each(METHODS)('all methods %s', async (capsMethod) => {
		if(capsMethod === 'CONNECT'){
			return;
		}
		const app = express();
		const router = expresso();
		const msg = 'success';
		
		const method = capsMethod.toLowerCase();
		router[method]('/test', (req: Request, res: Response) => res.send(msg));
		app.use(router);

		// eslint-disable-next-line @typescript-eslint/ban-types
		const res = await ((request(app)[method as keyof SuperTest<Test>]) as Function)('/test');
		if(method !== 'head'){
			expect(res.text).toBe(msg);
		}
		
		expect(res.status).toBe(200);
		
	});
});