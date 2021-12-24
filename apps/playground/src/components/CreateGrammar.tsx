import { TextField } from "@mui/material";
import { useState } from "react";
import { useGrammarInput } from "../hooks";
import { UserInputGrammar } from "../types";
import { Button } from "./Button";
import { GrammarString } from "./GrammarString";
import { AddIcon, DeleteIcon } from "./Icons";

interface CreateGrammarProps {
  addGrammar: (userInputGrammar: UserInputGrammar) => void
}

export function CreateGrammar(props: CreateGrammarProps) {
  const { addGrammar } = props;
  const [grammarLabel, setGrammarLabel] = useState("")
  const { userInputGrammar, productionRules, updateRuleVariable, resetState, removeRule, addRule, updateToken, addSubstitution, addToken, removeToken, removeSubstitution } = useGrammarInput();

  let isValidGrammar = true;
  if (userInputGrammar.rules.length === 0 || userInputGrammar.rules[0]?.substitutions.length === 0 || !grammarLabel) {
    isValidGrammar = false;
  }
  isValidGrammar = isValidGrammar && userInputGrammar.rules.every(rule => rule.variable !== "")

  return <div className="flex flex-col gap-3 w-full overflow-auto px-5">
    <div className="text-4xl font-bold">Create</div>
    <TextField variant="outlined" placeholder="Grammar label" value={grammarLabel} onChange={(e) => setGrammarLabel(e.target.value)} />
    <div className="flex gap-3 flex-col justify-center text-2xl">
      {userInputGrammar.rules.map((rule, ruleIndex) =>
        <div className="flex gap-3 items-center" key={`rule-${ruleIndex}`}>
          <input placeholder="ε" onChange={(event) => {
            updateRuleVariable(ruleIndex, event.target.value);
          }} size={Math.max(rule.variable.length, 1)} value={rule.variable} className="font-medium text-2xl rounded-sm bg-gray-800 outline-none px-3 py-1" />
          {(rule.substitutions.length !== 0) && <div className="flex gap-3">
            {rule.substitutions.map((tokens, substitutionIndex) => {
              return tokens.length !== 0 && <div className="flex p-2 text-sm gap-3 font-bold bg-gray-800 items-center rounded-sm" key={`rule-${ruleIndex}-substitution-${substitutionIndex}`}>
                {tokens.map((token, tokenIndex) => {
                  return <div className="flex gap-1 items-center" key={`rule-${ruleIndex}-substitution-${substitutionIndex}-token-${tokenIndex}`}>
                    <DeleteIcon size={17.5} onClick={() => {
                      removeToken(ruleIndex, substitutionIndex, tokenIndex);
                    }} />
                    <input placeholder="ε" onChange={(event) => {
                      updateToken(ruleIndex, substitutionIndex, tokenIndex, event.target.value);
                    }} size={Math.max(token.length, 1)} value={token} className="text-base rounded-sm outline-none bg-gray-900 px-2 py-1" />
                  </div>
                })}
                <div className="flex items-center gap-1 rounded-sm">
                  <AddIcon size={17.5} onClick={() => {
                    addToken(tokens)
                  }} />
                  <DeleteIcon size={20} onClick={() => {
                    removeSubstitution(ruleIndex, substitutionIndex)
                  }} />
                </div>
              </div>
            })}
          </div>}
          <div className="flex gap-2 bg-gray-800 p-2 rounded-sm items-center">
            <AddIcon onClick={() => {
              addSubstitution(ruleIndex)
            }} />
            {ruleIndex !== 0 && <DeleteIcon size={20} onClick={() => {
              removeRule(ruleIndex)
            }} />}
          </div>
        </div>)}
      <AddIcon onClick={() => {
        addRule()
      }} />
    </div>
    <div className="my-3">
      <GrammarString productionRules={productionRules} />
    </div>

    <Button disabled={!isValidGrammar} onClick={() => {
      addGrammar({ ...userInputGrammar, label: grammarLabel });
      resetState();
      setGrammarLabel("")
    }} label="Add Grammar" />
  </div>
}