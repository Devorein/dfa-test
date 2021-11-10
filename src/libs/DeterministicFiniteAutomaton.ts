import { IFiniteAutomaton, InputFiniteAutomaton, TransformedFiniteAutomaton } from '../types';
import { FiniteAutomaton } from './FiniteAutomaton';

type IMergedDfaOptions = Partial<
	Pick<Pick<IFiniteAutomaton, 'automaton'>['automaton'], 'label' | 'description'> & {
		separator: string;
	}
>;

type TMergeOperation = 'or' | 'and' | 'not';
export class DeterministicFiniteAutomaton extends FiniteAutomaton {
	constructor(
		testLogic: (inputString: string, automatonTestResult: boolean) => boolean,
		automaton: InputFiniteAutomaton | TransformedFiniteAutomaton,
		automatonId?: string
	) {
		super(testLogic, automaton, 'deterministic', automatonId);
	}

	#generateMergedDfaData(
		state: string,
		newStates: string[],
		newTransitions: IFiniteAutomaton['automaton']['transitions'],
		newFinalStates: Set<string>,
		mergeOperation: TMergeOperation,
		inputAutomaton: DeterministicFiniteAutomaton | undefined,
		isComposite: boolean,
		separator: string
	) {
		const currentAutomatonFinalStates = new Set(this.automaton.final_states);
		const inputAutomatonFinalStates = new Set(
			inputAutomaton ? inputAutomaton.automaton.final_states : []
		);

		this.automaton.states.forEach((currentDfaState) => {
			const newState = isComposite ? `${currentDfaState}${separator}${state}` : currentDfaState;
			if (isComposite) {
				newStates.push(newState);
				newTransitions[newState] = {};
				this.automaton.alphabets.forEach((automatonAlphabet) => {
					newTransitions[newState][automatonAlphabet] = [
						this.automaton.transitions[currentDfaState][automatonAlphabet] +
							separator +
							(inputAutomaton
								? inputAutomaton.automaton.transitions[state][automatonAlphabet]
								: ''),
					];
				});
				if (
					mergeOperation === 'or' &&
					((inputAutomaton ? inputAutomatonFinalStates.has(state) : true) ||
						currentAutomatonFinalStates.has(currentDfaState))
				) {
					newFinalStates.add(newState);
				} else if (
					mergeOperation === 'and' &&
					(inputAutomaton ? inputAutomatonFinalStates.has(state) : true) &&
					currentAutomatonFinalStates.has(currentDfaState)
				) {
					newFinalStates.add(newState);
				} else if (mergeOperation === 'not' && !currentAutomatonFinalStates.has(currentDfaState)) {
					newFinalStates.add(newState);
				}
			} else {
				if (
					mergeOperation === 'or' &&
					((inputAutomaton ? inputAutomatonFinalStates.has(newState) : true) ||
						currentAutomatonFinalStates.has(newState))
				) {
					newFinalStates.add(newState);
				} else if (
					mergeOperation === 'and' &&
					(inputAutomaton ? inputAutomatonFinalStates.has(newState) : true) &&
					currentAutomatonFinalStates.has(newState)
				) {
					newFinalStates.add(newState);
				} else if (mergeOperation === 'not' && !currentAutomatonFinalStates.has(newState)) {
					newFinalStates.add(newState);
				}
			}
		});
	}

	#merge(
		finiteAutomaton: DeterministicFiniteAutomaton | undefined,
		mergeOperation: TMergeOperation,
		mergedDfaOptions?: IMergedDfaOptions
	) {
		const { separator = '.', label, description } = mergedDfaOptions ?? ({} as IMergedDfaOptions);
		const newStates: string[] = [];
		const newTransitions: IFiniteAutomaton['automaton']['transitions'] = {};
		// If we have two different dfa's we are in composite mode
		const isComposite = Boolean(
			finiteAutomaton &&
				(finiteAutomaton ? finiteAutomaton.getAutomatonId() : '') !== this.getAutomatonId()
		);

		// If we are in composite mode, we need to generate a new id for the new dfa, by merging the ids of two input dfs separated by a separator
		const newDfaId =
			isComposite && finiteAutomaton
				? this.getAutomatonId() + separator + finiteAutomaton.getAutomatonId()
				: this.getAutomatonId();

		// Only create a new state if its not composite
		const newStartState =
			isComposite && finiteAutomaton
				? this.automaton.start_state + separator + finiteAutomaton.automaton.start_state
				: this.automaton.start_state;
		const newFinalStates: Set<string> = new Set();

		// If we have a input dfa, for operations like AND and OR
		if (finiteAutomaton) {
			finiteAutomaton.automaton.states.forEach((state) => {
				this.#generateMergedDfaData(
					state,
					newStates,
					newTransitions,
					newFinalStates,
					mergeOperation,
					finiteAutomaton,
					isComposite,
					separator
				);
			});
		}
		// If we dont have an input dfa, for operations like NOT, which acts on the dfa itself
		else {
			this.#generateMergedDfaData(
				'',
				newStates,
				newTransitions,
				newFinalStates,
				mergeOperation,
				finiteAutomaton,
				isComposite,
				separator
			);
		}
		return new DeterministicFiniteAutomaton(
			(inputString, automatonTestResult) => {
				if (mergeOperation === 'or') {
					return (
						finiteAutomaton!.testLogic(inputString, automatonTestResult) ||
						this.testLogic(inputString, automatonTestResult)
					);
				} else if (mergeOperation === 'and') {
					return (
						finiteAutomaton!.testLogic(inputString, automatonTestResult) &&
						this.testLogic(inputString, automatonTestResult)
					);
				} else {
					return !this.testLogic(inputString, automatonTestResult);
				}
			},
			{
				final_states: Array.from(newFinalStates),
				label:
					label ??
					mergeOperation +
						'(' +
						`${this.automaton.label}${mergeOperation !== 'not' ? ', ' : ''}${
							finiteAutomaton ? finiteAutomaton.automaton.label : ''
						}` +
						')',
				description:
					description ??
					mergeOperation.toUpperCase() +
						'(' +
						`${this.automaton.description}${mergeOperation !== 'not' ? ', ' : ''}${
							finiteAutomaton ? finiteAutomaton.automaton.description : ''
						}` +
						')',
				start_state: isComposite ? newStartState : this.automaton.start_state,
				states: isComposite ? newStates : JSON.parse(JSON.stringify(this.automaton.states)),
				transitions: (isComposite
					? newTransitions
					: JSON.parse(
							JSON.stringify(this.automaton.transitions)
					  )) as TransformedFiniteAutomaton['transitions'],
				alphabets: this.automaton.alphabets,
				epsilon_transitions: null,
			},
			isComposite ? newDfaId : this.getAutomatonId()
		);
	}

	AND(dfaModule: DeterministicFiniteAutomaton, mergedDfaOptions: IMergedDfaOptions) {
		return this.#merge(dfaModule, 'and', mergedDfaOptions);
	}

	NOT(mergedDfaOptions: IMergedDfaOptions) {
		return this.#merge(undefined, 'not', mergedDfaOptions);
	}

	OR(dfaModule: DeterministicFiniteAutomaton, mergedDfaOptions: IMergedDfaOptions) {
		return this.#merge(dfaModule, 'or', mergedDfaOptions);
	}
}
