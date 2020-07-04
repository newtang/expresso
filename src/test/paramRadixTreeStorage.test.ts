import ParamRadixTreeStorage from '../paramRadixTreeStorage';


describe('param radix tree storage tests', () => {
	beforeAll(() => {
		
	});

	test('insert', () => {
		const node = new ParamRadixTreeStorage<string>();
		const payload = "jackpot!";
		node.insert("/v1/api/users/:userId/settings", payload);
		console.log(JSON.stringify(stringify(node), null, 2));

		const result = node.search("/v1/api/users/coolUserId/settings");
		console.log("RESULT", result);


		expect(result).toBe(payload);
	});
});

function stringify(node: ParamRadixTreeStorage<string>){
	const obj:{[key:string]:any} = {};
	for(const [k,v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage<string>>)){
		obj[k] = stringify(v); 
	}
	return obj;
}