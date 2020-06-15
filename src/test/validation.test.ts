import expresso from '../index';

describe('basic tests', () => {

	beforeAll(() => {
		console.error = jest.fn();
	});

	test.each([
		'/', '/test', '/v1/api/~user/', '/3/', '/23423-42349', '/CAPITAL_LETTERS',
		'/ca$hmoney/', '/hyphenated-words/__..-+!+-..__/', '/*\'(_-_),/', 
	])
	('valid routes %s', path => { //eslint-disable-line no-unexpected-multiline
		expect(() => {
			expresso().get(path, jest.fn());
		}).not.toThrow();
	});

	test.each([undefined, null, '', true, false, jest.fn(), [], {}, /api/gi])
	('invalid routes %s', path => { //eslint-disable-line no-unexpected-multiline
		expect(() => {
			expresso().get(path, jest.fn());
		}).toThrow(`Invalid path: ${path}`);
	});

	test.each(['hey', 'v1/api/'])('no starting slash %s', path => {
		expect(() => {
			expresso().get(path, jest.fn());
		}).toThrow(`First character in path, must be a slash. ${path}`);
	});

	test('double slash', () => {
		const path = '/v4/api//get/item';
		expect(() => {
			expresso().get(path, jest.fn());
		}).toThrow(`Invalid path. Contains consecutive '//', ${path}`);
	});

	test.each(['/api/%percent', '/test&foo', '/v1?id=3', '/💩', '/path#hashtag'])
	('invalid characters %s', path => { //eslint-disable-line no-unexpected-multiline
		expect(() => {
			expresso().get(path, jest.fn());
		}).toThrow(`Invalid path: ${path}`);
	});

	// eslint-disable-next-line max-len
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-empty-function
	test.each([jest.fn(), async function(){}, async () => {}])('valid handlers %s', handler => {
		expect(() => {
			expresso().get('/test', handler);
		}).not.toThrow();
	});

	test.each([null, undefined, 'function', {}, [], true, false, /api/gi])
	('invalid handlers %s', handler => { //eslint-disable-line no-unexpected-multiline
		const path = '/test';
		expect(() => {
			expresso().get(path, handler);
		}).toThrow(`Non function handler found for path: ${path}`);

		expect(() => {
			expresso().get(path, jest.fn(), handler);
		}).toThrow(`Non function handler found for path: ${path}`);
	});

});