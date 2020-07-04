import ParamRadixTreeStorage from '../paramRadixTreeStorage';


describe('param radix tree storage tests', () => {
	beforeAll(() => {
		
	});

	test('1 param in middle', () => {
		const node = new ParamRadixTreeStorage<string>();
		const payload = "jackpot!";
		node.insert("/v1/api/users/:userId/settings", payload);
		expect(node.search("/v1/api/users/coolUserId/settings")).toBe(payload);
		expect(node.search("/v1/api/users/coolUserId/")).toBe(false);
		expect(node.search("/v1/api/users/coolUserId/settingsX")).toBe(false);
		expect(node.search("/v1/api/users/coolUserId/set")).toBe(false);
		expect(node.search("/v1/api/users/coolUserId")).toBe(false);
	});

	test('end param, with and without slash', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert("/v1/api/users/:userId", "jackpot1");
		node.insert("/v1/api/users/:userId/", "jackpot2");
		expect(node.search("/v1/api/users/coolUserId")).toBe("jackpot1");
		expect(node.search("/v1/api/users/coolUserId/")).toBe("jackpot2");

		expect(node.search("/v1/api/users/coolUserId/a")).toBe(false);
		expect(node.search("/v1/api/users/")).toBe(false);
		expect(node.search("/v1/api/users")).toBe(false);
	});

	test('begin param', () => {
		const node = new ParamRadixTreeStorage<string>();
		node.insert("/:param", "jackpot1");
		node.insert("/:param/", "jackpot2");
		expect(node.search("/anything")).toBe("jackpot1");
		expect(node.search("/anything/")).toBe("jackpot2");
		expect(node.search("/anything/else")).toBe(false);

		console.log(JSON.stringify(stringify(node), null, 2));
	});


});

function stringify(node: ParamRadixTreeStorage<string>){
	const obj:{[key:string]:any} = {};
	for(const [k,v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage<string>>)){
		obj[k] = stringify(v); 
	}
	return obj;
}