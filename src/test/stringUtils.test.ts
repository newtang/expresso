import { lowercaseStaticParts } from '../utils/stringUtils';

describe('utils tests', () => {

	beforeAll(() => {
		console.error = jest.fn();
	});

	test('lowercaseStaticPathPortions', async () => {
		expect(lowercaseStaticParts('/')).toBe('/');
		expect(lowercaseStaticParts('/:test')).toBe('/:test');
		expect(lowercaseStaticParts('/:teST')).toBe('/:teST');
		expect(lowercaseStaticParts('/:TEST')).toBe('/:TEST');
		expect(lowercaseStaticParts('/:test/')).toBe('/:test/');
		expect(lowercaseStaticParts('/:teST/')).toBe('/:teST/');
		expect(lowercaseStaticParts('/:TEST/')).toBe('/:TEST/');

		expect(lowercaseStaticParts('/first/:test/second')).toBe('/first/:test/second');
		expect(lowercaseStaticParts('/fiRSt/:teST/sECOnD')).toBe('/first/:teST/second');
		expect(lowercaseStaticParts('/FIRST/:TEST/SECOND')).toBe('/first/:TEST/second');
		expect(lowercaseStaticParts('/first/:test/second/')).toBe('/first/:test/second/');
		expect(lowercaseStaticParts('/fiRSt/:teST/sECOnD/')).toBe('/first/:teST/second/');
		expect(lowercaseStaticParts('/FIRST/:TEST/SECOND/')).toBe('/first/:TEST/second/');
	});
});