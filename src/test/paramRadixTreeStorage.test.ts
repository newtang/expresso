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

	test('end param, with and without slash', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId', 'jackpot1');
		node.insert('/v1/api/users/:userId/', 'jackpot2');
		expect(node.search('/v1/api/users/coolUserId')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'coolUserId' } });
		expect(node.search('/v1/api/users/otherUserId/')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'otherUserId' } });

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

		console.log(JSON.stringify(stringify(node), null, 2));
	});

	test('multiple params back-to-back', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId/:objectId', 'jackpot1');
		node.insert('/v1/api/users/:userId/:objectId/settings', 'jackpot2');
		expect(node.search('/v1/api/users/id1/abcd')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'id1', objectId:'abcd' } });
		expect(node.search('/v1/api/users/id2/1234/settings')).toStrictEqual({ payload: 'jackpot2', params:{ userId:'id2', objectId:'1234' } });

		expect(node.search('/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
	});

	test('same param position, but different name', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert('/v1/api/users/:userId', 'jackpot1');
		node.insert('/v1/api/users/:someOtherId/path', 'jackpot2');
		expect(node.search('/v1/api/users/id1')).toStrictEqual({ payload: 'jackpot1', params:{ userId:'id1'} });
		expect(node.search('/v1/api/users/id2/path')).toStrictEqual({ payload: 'jackpot2', params:{ someOtherId:'id2' } });

		expect(node.search('/v1/api/users/id2/1234/settings/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/id2/1234/')).toStrictEqual(false);
		expect(node.search('/v1/api/users/')).toStrictEqual(false);
	});

});

function stringify(node: ParamRadixTreeStorage<string>){
	const obj: {[key: string]: any} = {};
	for(const [k, v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage<string>>)){
		obj[k] = stringify(v); 
	}
	return obj;
}