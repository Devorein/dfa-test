/* eslint-disable no-loop-func */
function setDifference(setA: Set<string>, setB: Set<string>) {
	return new Set(Array.from(setA).filter((setAElement) => !setB.has(setAElement)));
}

export function isAllTerminal(terminals: string[], word: string) {
	const terminalsSet = new Set(terminals);
	return word.split('').every((letter) => terminalsSet.has(letter));
}

export function checkForTermination(
	terminals: string[],
	variables: string[],
	transitionRecord: Record<string, string[]>
) {
	let terminableVariables: Set<string> = new Set();
	const transitionRecordKeySet = new Set(Object.keys(transitionRecord));
	const variablesSet = new Set(variables);
	let done = false;

	// Check if any of the variable in the word is terminable or not
	function checkAnyVariableIsTerminable(nonTerminableVariable: string) {
		transitionRecord[nonTerminableVariable].some((word) => {
			// Extracting variables from word
			const variablesFromWord = word.split('').filter((letter) => variablesSet.has(letter));
			// Checking if all the extracted variables are terminable
			return variablesFromWord.every((variable) => terminableVariables.has(variable));
		});
	}

	while (!done) {
		done = true;
		const tempTerminableVariables = new Set(Array.from(terminableVariables));
		// Current non terminable variables
		const nonTerminableVariables = setDifference(transitionRecordKeySet, terminableVariables);
		nonTerminableVariables.forEach((nonTerminableVariable) => {
			// Check if some of the words contains only terminals
			const doesSomeWordContainOnlyTerminals = transitionRecord[nonTerminableVariable].some(
				(substitutedWord) => isAllTerminal(terminals, substitutedWord)
			);
			// Check if any of the variables from the words are terminable or not
			const isAnyVariableTerminable =
				doesSomeWordContainOnlyTerminals || checkAnyVariableIsTerminable(nonTerminableVariable);
			// If either of this is true, the variable is terminable
			if (doesSomeWordContainOnlyTerminals || isAnyVariableTerminable) {
				done = false;
				tempTerminableVariables.add(nonTerminableVariable);
			}
		});
		terminableVariables = tempTerminableVariables;
	}
	// return the variables that are not terminable
	if (terminableVariables.size !== transitionRecordKeySet.size) {
		return Array.from(setDifference(transitionRecordKeySet, terminableVariables));
	} else {
		return true;
	}
}
