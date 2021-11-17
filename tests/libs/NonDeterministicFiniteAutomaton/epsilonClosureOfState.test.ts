import { epsilonClosureOfState } from '../../../src/libs/NonDeterministicFiniteAutomaton/utils/epsilonClosureOfState';

it(`Should generate epsilon closure of a state`, () => {
	expect(
		epsilonClosureOfState(
			{
				A: ['B'],
				B: ['C', 'D'],
			},
			'A'
		)
	).toStrictEqual(['A', 'B', 'C', 'D']);
});
