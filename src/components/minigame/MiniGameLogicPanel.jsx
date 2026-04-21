import React from "react";

export default function MiniGameLogicPanel({ editor }) {
  const { draft, validation } = editor;

  return (
    <div className="minigame-panel">
      <h3 className="section-title">Validation & Logic</h3>

      <div className="minigame-checklist">
        <div className={validation.hasPrompt ? "check-pass" : "check-fail"}>
          {validation.hasPrompt ? "✓" : "✕"} Prompt is filled out
        </div>

        <div className={validation.hasEnoughItems ? "check-pass" : "check-fail"}>
          {validation.hasEnoughItems ? "✓" : "✕"} Enough choices/options added
        </div>

        {draft.type === "choiceWeighting" && (
          <div className={validation.exactTotalOk ? "check-pass" : "check-fail"}>
            {validation.exactTotalOk ? "✓" : "✕"} Assigned points satisfy total
          </div>
        )}
      </div>

      <div className="helper-box">
        {draft.type === "choiceWeighting" && (
          <>
            Players combine weighted options and try to reach the target score.
          </>
        )}

        {draft.type === "persuasion" && (
          <>
            Each choice changes the persuasion score. Success depends on reaching the threshold.
          </>
        )}

        {draft.type === "traitPicker" && (
          <>
            Players choose traits within the allowed selection range.
          </>
        )}
      </div>
    </div>
  );
}