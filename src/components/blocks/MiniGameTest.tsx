import React from "react";
import TraitPickerBlockView from "./TraitPickerBlockView";
import PersuasionBlockView from "./PersuasionBlockView";
import ChoiceWeightingBlockView from "./ChoiceWeightingBlockView";
import {
  traitPickerExample,
  persuasionExample,
  choiceWeightingExample,
} from "../../types/minigameExamples";

export default function MiniGameTest() {
  return (
    <div style={{ padding: "24px", display: "grid", gap: "32px" }}>
      <TraitPickerBlockView
        block={traitPickerExample}
        onComplete={(result) => {
          console.log("Trait picker result:", result);
        }}
      />

      <PersuasionBlockView
        block={persuasionExample}
        onComplete={(result) => {
          console.log("Persuasion result:", result);
        }}
      />

      <ChoiceWeightingBlockView
        block={choiceWeightingExample}
        onComplete={(result) => {
          console.log("Choice weighting result:", result);
        }}
      />
    </div>
  );
}