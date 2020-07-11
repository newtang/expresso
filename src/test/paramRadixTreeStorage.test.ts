import { Node as ParamRadixTreeStorage } from '../storage/ParamRadixTreeStorage';

describe('param radix tree storage tests', () => {
	beforeAll(() => {
		
	});

	test('1 param in middle', () => {
		const node = new ParamRadixTreeStorage<string>();
		const target = 'jackpot!';
		node.insert('get', '/v1/api/users/:userId/settings', target);
		expect(node.search('get', '/v1/api/users/coolUserId/settings')).toStrictEqual({ target, params:{ userId:'coolUserId' } });
		expect(node.search('post', '/v1/api/users/coolUserId/settings')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId/settings/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId/settingsX')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId/set')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId')).toStrictEqual(false);
	});

	test('end param, with and without slash - short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/api/users/:userId', 'jackpot1');
		node.insert('get', '/v1/api/users/:userId/', 'jackpot2');
		expect(node.search('get', '/v1/api/users/coolUserId')).toStrictEqual({ target: 'jackpot1', params:{ userId:'coolUserId' } });
		expect(node.search('get', '/v1/api/users/otherUserId/')).toStrictEqual({ target: 'jackpot2', params:{ userId:'otherUserId' } });

		expect(node.search('post', '/v1/api/users/coolUserId')).toStrictEqual(false);
		expect(node.search('post', '/v1/api/users/otherUserId/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/coolUserId/a')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users')).toStrictEqual(false);
	});

	test('end param, with and without slash - long then short', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/api/users/:userId/', 'jackpot1');
		node.insert('get', '/v1/api/users/:userId', 'jackpot2');
		expect(node.search('get', '/v1/api/users/coolUserId/')).toStrictEqual({ target: 'jackpot1', params:{ userId:'coolUserId' } });
		expect(node.search('get', '/v1/api/users/otherUserId')).toStrictEqual({ target: 'jackpot2', params:{ userId:'otherUserId' } });

		expect(node.search('get', '/v1/api/users/coolUserId/a')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users')).toStrictEqual(false);
	});

	test('begin param', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/:param', 'jackpot1');
		node.insert('get', '/:param/', 'jackpot2');
		expect(node.search('get', '/anything')).toStrictEqual({ target: 'jackpot1', params:{ param:'anything' } });
		expect(node.search('get', '/anything/')).toStrictEqual({ target: 'jackpot2', params:{ param:'anything' } });
		expect(node.search('get', '/anything/else')).toStrictEqual(false);
	});

	test('multiple params back-to-back - short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/api/users/:userId/:objectId', 'jackpot1');
		node.insert('get', '/v1/api/users/:userId/:objectId/settings', 'jackpot2');
		expect(node.search('get', '/v1/api/users/id1/abcd')).toStrictEqual({ target: 'jackpot1', params:{ userId:'id1', objectId:'abcd' } });
		expect(node.search('get', '/v1/api/users/id2/1234/settings')).toStrictEqual({ target: 'jackpot2', params:{ userId:'id2', objectId:'1234' } });

		expect(node.search('get', '/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
	});

	test('multiple params back-to-back - long then short', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/api/users/:userId/:objectId/settings', 'jackpot1');
		node.insert('get', '/v1/api/users/:userId/:objectId', 'jackpot2');
		expect(node.search('get', '/v1/api/users/id1/abcd/settings')).toStrictEqual({ target: 'jackpot1', params:{ userId:'id1', objectId:'abcd' } });
		expect(node.search('get', '/v1/api/users/id2/1234')).toStrictEqual({ target: 'jackpot2', params:{ userId:'id2', objectId:'1234' } });

		expect(node.search('get', '/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
	});

	test('same param position, but different name', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/api/users/:userId', 'jackpot1');
		node.insert('get', '/v1/api/users/:someOtherId/path', 'jackpot2');
		expect(node.search('get', '/v1/api/users/id1')).toStrictEqual({ target: 'jackpot1', params:{ userId:'id1' } });
		expect(node.search('get', '/v1/api/users/id2/path')).toStrictEqual({ target: 'jackpot2', params:{ someOtherId:'id2' } });

		expect(node.search('get', '/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
	});

	test('short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/:test', 'jackpot1');
		node.insert('get', '/v1/api/users/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('get', '/v1/yo')).toStrictEqual({ target: 'jackpot1', params:{ test:'yo' } });
		expect(node.search('get', '/v1/api/users/id1')).toStrictEqual({ target: 'jackpot2', params:{ id:'id1' } });
		expect(node.search('get', '/v1/api')).toStrictEqual({ target: 'jackpot1', params:{ test:'api' } });

		expect(node.search('get', '/v1/api/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/')).toStrictEqual(false);
		expect(node.search('get', '/v1/api/users/something/more')).toStrictEqual(false);
	});

	test('short then long #2', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/a/b/c/:id', 'jackpot1');
		node.insert('get', '/v1/a/bbb/users/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('get', '/v1/a/b/c/yo')).toStrictEqual({ target: 'jackpot1', params:{ id:'yo' } });
		expect(node.search('get', '/v1/a/bbb/users/id1')).toStrictEqual({ target: 'jackpot2', params:{ id:'id1' } });

		expect(node.search('get', '/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/b')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/b/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/b/c')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/b/c/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/b/c/id1/other')).toStrictEqual(false);

		expect(node.search('get', '/v1/a/bbb')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/bbb/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/bbb/users')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/bbb/users/')).toStrictEqual(false);
		expect(node.search('get', '/v1/a/bbb/users/id1/other')).toStrictEqual(false);
	});

	test('short, different roots', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/v1/:id', 'jackpot1');
		node.insert('get', '/v2/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('get', '/v1/hi')).toStrictEqual({ target: 'jackpot1', params:{ id:'hi' } });
		expect(node.search('get', '/v2/hello')).toStrictEqual({ target: 'jackpot2', params:{ id:'hello' } });
		
		expect(node.search('get', '/')).toStrictEqual(false);
		expect(node.search('get', '/v1')).toStrictEqual(false);
		expect(node.search('get', '/v1/')).toStrictEqual(false);
		expect(node.search('get', '/v2')).toStrictEqual(false);
		expect(node.search('get', '/v2/')).toStrictEqual(false);
	});

	test('short, different roots', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/api/v1/food/desserts/cookies/:id', 'jackpot1');
		node.insert('get', '/api/v1/food/dinners/pasta/:id', 'jackpot2');
		node.insert('get', '/api/v1/food/desserts/icecream/:id', 'jackpot3');
		node.insert('get', '/api/v1/food/breakfasts/cereal/:id', 'jackpot4');
		
		expect(node.search('get', '/api/v1/food/desserts/cookies/1')).toStrictEqual({ target: 'jackpot1', params:{ id:'1' } });
		expect(node.search('get', '/api/v1/food/dinners/pasta/2')).toStrictEqual({ target: 'jackpot2', params:{ id:'2' } });
		expect(node.search('get', '/api/v1/food/desserts/icecream/3')).toStrictEqual({ target: 'jackpot3', params:{ id:'3' } });
		expect(node.search('get', '/api/v1/food/breakfasts/cereal/4')).toStrictEqual({ target: 'jackpot4', params:{ id:'4' } });
		
		expect(node.search('get', '/api/v1/food/desserts/cookies/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/food/dinners/pasta/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/food/desserts/icecream/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/food/breakfasts/cereal/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/food/')).toStrictEqual(false);
	});

	test('identical routes, different methods', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/api/v1/:id', 'jackpot1');
		node.insert('post', '/api/v1/:id', 'jackpot2');

		expect(node.search('get', '/api/v1/hi')).toStrictEqual({ target: 'jackpot1', params:{ id:'hi' } });
		expect(node.search('post', '/api/v1/hello')).toStrictEqual({ target: 'jackpot2', params:{ id:'hello' } });
		
		expect(node.search('put', '/api/v1/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/')).toStrictEqual(false);
		expect(node.search('post', '/api/v1/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1')).toStrictEqual(false);
		expect(node.search('post', '/api/v1')).toStrictEqual(false);
	});

	test('identical routes, different methods and params', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('get', '/api/v1/:get_id', 'jackpot1');
		node.insert('post', '/api/v1/:post_id', 'jackpot2');

		expect(node.search('get', '/api/v1/hi')).toStrictEqual({ target: 'jackpot1', params:{ get_id:'hi' } });
		expect(node.search('post', '/api/v1/hello')).toStrictEqual({ target: 'jackpot2', params:{ post_id:'hello' } });
		
		expect(node.search('put', '/api/v1/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1/')).toStrictEqual(false);
		expect(node.search('post', '/api/v1/')).toStrictEqual(false);
		expect(node.search('get', '/api/v1')).toStrictEqual(false);
		expect(node.search('post', '/api/v1')).toStrictEqual(false);
	});

});

function stringify(node: ParamRadixTreeStorage<string>){
	const obj: {[key: string]: any} = {};
	for(const [k, v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage<string>>)){
		obj[k] = stringify(v); 
	}
	return obj;
}