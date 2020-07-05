import ParamRadixTreeStorage from '../paramRadixTreeStorage';

describe('param radix tree storage tests', () => {
	beforeAll(() => {
		
	});

	test('1 param in middle', () => {
		const node = new ParamRadixTreeStorage<string>();
		const payload = 'jackpot!';
		node.insert('/v1/api/users/:userId/settings', payload);
		expect(node.search('/v1/api/users/coolUserId/settings')).toStrictEqual({ payload, params:{ userId:'coolUserId' } });
		expect(node.search('/v1/api/users/coolUserId/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/coolUserId/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/coolUserId/settingsX')).toStrictEqual(false);
		expect(node.search('/v1/api/users/coolUserId/set')).toStrictEqual(false);
		expect(node.search('/v1/api/users/coolUserId')).toStrictEqual(false);
	});

	test('end param, with and without slash - short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId', 'jackpot1');
		node.insert('/v1/api/users/:userId/', 'jackpot2');
		expect(node.search('/v1/api/users/coolUserId')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'coolUserId' } });
		expect(node.search('/v1/api/users/otherUserId/')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'otherUserId' } });

		expect(node.search('/v1/api/users/coolUserId/a')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
		expect(node.search('/v1/api/users')).toStrictEqual(false);
	});

	test('end param, with and without slash - long then short', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId/', 'jackpot1');
		node.insert('/v1/api/users/:userId', 'jackpot2');
		expect(node.search('/v1/api/users/coolUserId/')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'coolUserId' } });
		expect(node.search('/v1/api/users/otherUserId')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'otherUserId' } });

		expect(node.search('/v1/api/users/coolUserId/a')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
		expect(node.search('/v1/api/users')).toStrictEqual(false);
	});

	test('begin param', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/:param', 'jackpot1');
		node.insert('/:param/', 'jackpot2');
		expect(node.search('/anything')).toStrictEqual({ payload: 'jackpot1', params:{ param:'anything' } });
		expect(node.search('/anything/')).toStrictEqual({ payload: 'jackpot2', params:{ param:'anything' } });
		expect(node.search('/anything/else')).toStrictEqual(false);
	});

	test('multiple params back-to-back - short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId/:objectId', 'jackpot1');
		node.insert('/v1/api/users/:userId/:objectId/settings', 'jackpot2');
		expect(node.search('/v1/api/users/id1/abcd')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'id1', objectId:'abcd' } });
		expect(node.search('/v1/api/users/id2/1234/settings')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'id2', objectId:'1234' } });

		expect(node.search('/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
	});

	test('multiple params back-to-back - long then short', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId/:objectId/settings', 'jackpot1');
		node.insert('/v1/api/users/:userId/:objectId', 'jackpot2');
		expect(node.search('/v1/api/users/id1/abcd/settings')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'id1', objectId:'abcd' } });
		expect(node.search('/v1/api/users/id2/1234')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'id2', objectId:'1234' } });

		expect(node.search('/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
	});

	test('same param position, but different name', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId', 'jackpot1');
		node.insert('/v1/api/users/:someOtherId/path', 'jackpot2');
		expect(node.search('/v1/api/users/id1')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'id1' } });
		expect(node.search('/v1/api/users/id2/path')).toStrictEqual({ payload: 'jackpot2', params:{ someOtherId:'id2' } });

		expect(node.search('/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
	});

	test('short then long', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/:test', 'jackpot1');
		node.insert('/v1/api/users/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('/v1/yo')).toStrictEqual({ payload: 'jackpot1', params:{ test:'yo' } });
		expect(node.search('/v1/api/users/id1')).toStrictEqual({ payload: 'jackpot2', params:{ id:'id1' } });
		expect(node.search('/v1/api')).toStrictEqual({ payload: 'jackpot1', params:{ test:'api' } });

		expect(node.search('/v1/api/')).toStrictEqual(false);
		expect(node.search('/v1/api/users')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/something/more')).toStrictEqual(false);
	});

	test('short then long #2', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/a/b/c/:id', 'jackpot1');
		node.insert('/v1/a/bbb/users/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('/v1/a/b/c/yo')).toStrictEqual({ payload: 'jackpot1', params:{ id:'yo' } });
		expect(node.search('/v1/a/bbb/users/id1')).toStrictEqual({ payload: 'jackpot2', params:{ id:'id1' } });

		expect(node.search('/')).toStrictEqual(false);
		expect(node.search('/v1/a')).toStrictEqual(false);
		expect(node.search('/v1/a/')).toStrictEqual(false);
		expect(node.search('/v1/a/b')).toStrictEqual(false);
		expect(node.search('/v1/a/b/')).toStrictEqual(false);
		expect(node.search('/v1/a/b/c')).toStrictEqual(false);
		expect(node.search('/v1/a/b/c/')).toStrictEqual(false);
		expect(node.search('/v1/a/b/c/id1/other')).toStrictEqual(false);

		expect(node.search('/v1/a/bbb')).toStrictEqual(false);
		expect(node.search('/v1/a/bbb/')).toStrictEqual(false);
		expect(node.search('/v1/a/bbb/users')).toStrictEqual(false);
		expect(node.search('/v1/a/bbb/users/')).toStrictEqual(false);
		expect(node.search('/v1/a/bbb/users/id1/other')).toStrictEqual(false);
	});

	test('short, different roots', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/:id', 'jackpot1');
		node.insert('/v2/:id', 'jackpot2');
		
		// console.log(JSON.stringify(stringify(node), null, 2));

		expect(node.search('/v1/hi')).toStrictEqual({ payload: 'jackpot1', params:{ id:'hi' } });
		expect(node.search('/v2/hello')).toStrictEqual({ payload: 'jackpot2', params:{ id:'hello' } });
		
		expect(node.search('/')).toStrictEqual(false);
		expect(node.search('/v1')).toStrictEqual(false);
		expect(node.search('/v1/')).toStrictEqual(false);
		expect(node.search('/v2')).toStrictEqual(false);
		expect(node.search('/v2/')).toStrictEqual(false);
	});

	test('short, different roots', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/api/v1/food/desserts/cookies/:id', 'jackpot1');
		node.insert('/api/v1/food/dinners/pasta/:id', 'jackpot2');
		node.insert('/api/v1/food/desserts/icecream/:id', 'jackpot3');
		node.insert('/api/v1/food/breakfasts/cereal/:id', 'jackpot4');
		
		expect(node.search('/api/v1/food/desserts/cookies/1')).toStrictEqual({ payload: 'jackpot1', params:{ id:'1' } });
		expect(node.search('/api/v1/food/dinners/pasta/2')).toStrictEqual({ payload: 'jackpot2', params:{ id:'2' } });
		expect(node.search('/api/v1/food/desserts/icecream/3')).toStrictEqual({ payload: 'jackpot3', params:{ id:'3' } });
		expect(node.search('/api/v1/food/breakfasts/cereal/4')).toStrictEqual({ payload: 'jackpot4', params:{ id:'4' } });
		
		expect(node.search('/api/v1/food/desserts/cookies/')).toStrictEqual(false);
		expect(node.search('/api/v1/food/dinners/pasta/')).toStrictEqual(false);
		expect(node.search('/api/v1/food/desserts/icecream/')).toStrictEqual(false);
		expect(node.search('/api/v1/food/breakfasts/cereal/')).toStrictEqual(false);
		expect(node.search('/api/v1/food/')).toStrictEqual(false);
	});

});

function stringify(node: ParamRadixTreeStorage<string>){
	const obj: {[key: string]: any} = {};
	for(const [k, v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage<string>>)){
		obj[k] = stringify(v); 
	}
	return obj;
}