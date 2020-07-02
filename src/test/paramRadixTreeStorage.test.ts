import ParamRadixTreeStorage from '../paramRadixTreeStorage';


describe('param radix tree storage tests', () => {
	beforeAll(() => {
		
	});

	test('insert', () => {
		const node = new ParamRadixTreeStorage();
		node.insert("/v1/api/users/:userId/settings");
		console.log(JSON.stringify(stringify(node), null, 2));

		expect(true).toBe(true);
	});
});

function stringify(node: ParamRadixTreeStorage){
	const obj:{[key:string]:any} = {};
	for(const [k,v] of Array.from(node.edges as Map<string, ParamRadixTreeStorage>)){
		obj[k] = stringify(v); 
	}
	return obj;
}