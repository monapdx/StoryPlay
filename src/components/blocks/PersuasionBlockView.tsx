import React, { useMemo, useState } from "react";
import type {
  PersuasionBlock,
  PersuasionBlockResult,
  PersuasionChoice,
} from "../../types/minigames";

interface PersuasionBlockViewProps {
  block: PersuasionBlock;
  onComplete: (result: PersuasionBlockResult) => void;
}

export default function PersuasionBlockView({
  block,
  onComplete,
}: PersuasionBlockViewProps) {
  const [score, setScore] = useState(block.startScore);
  const [usedChoiceIds, setUsedChoiceIds] = useState<string[]>([]);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [lastResponse, setLastResponse] = useState("");

  const minScore = block.minScore ?? 0;
  const maxScore = block.maxScore ?? 100;

  const remainingTurns =
    block.maxTurns !== undefined
      ? Math.max(0, block.maxTurns - turnsUsed)
      : undefined;

  const passed = score >= block.threshold;
  const outOfTurns =
    block.maxTurns !== undefined ? turnsUsed >= block.maxTurns : false;
  const isFinished = passed || outOfTurns;

  const availableChoices = useMemo(() => {
    return block.choices.filter(
      (choice) => !(choice.once && usedChoiceIds.includes(choice.id))
    );
  }, [block.choices, usedChoiceIds]);

  function applyChoice(choice: PersuasionChoice) {
    if (isFinished) return;

    const nextScore = Math.max(minScore, Math.min(maxScore, score + choice.delta));
    const nextTurns = turnsUsed + 1;
    const nextUsedChoiceIds = [...usedChoiceIds, choice.id];

    setScore(nextScore);
    setTurnsUsed(nextTurns);
    setUsedChoiceIds(nextUsedChoiceIds);
    setLastResponse(choice.response ?? "");

    const nextPassed = nextScore >= block.threshold;
    const nextOutOfTurns =
      block.maxTurns !== undefined ? nextTurns >= block.maxTurns : false;

    if (block.autoAdvance && (nextPassed || nextOutOfTurns)) {
      finish(nextScore, nextTurns, nextUsedChoiceIds);
    }
  }

  function finish(
    finalScore = score,
    finalTurns = turnsUsed,
    finalChoiceIds = usedChoiceIds
  ) {
    const didPass = finalScore >= block.threshold;

    onComplete({
      type: "persuasion",
      completed: true,
      finalScore,
      passed: didPass,
      turnsUsed: finalTurns,
      selectedChoiceIds: finalChoiceIds,
      nextNodeId: didPass ? block.successNodeId : block.failureNodeId,
      variablePatch: {
        ...(block.scoreVariable ? { [block.scoreVariable]: finalScore } : {}),
        ...(block.successVariable ? { [block.successVariable]: didPass } : {}),
      },
    });
  }

  return (
    <div className="storyplay-block persuasion-block minigame-play">
      {block.title && <h3 className="minigame-play-heading">{block.title}</h3>}
      {block.prompt && <p className="minigame-play-prompt">{block.prompt}</p>}
      {block.targetName && (
        <p className="minigame-play-target">
          <span className="minigame-play-target__label">Target</span>
          {block.targetName}
        </p>
      )}

      {block.visibleMeter && (
        <div className="minigame-play-meter">
          <label className="minigame-play-meter__label" htmlFor="persuasion-meter">
            Persuasion <span className="minigame-play-meter__value">{score}</span> /{" "}
            {block.threshold}
          </label>
          <progress
            id="persuasion-meter"
            className="minigame-play-progress"
            value={score}
            max={maxScore}
          />
        </div>
      )}

      {remainingTurns !== undefined && (
        <p className="minigame-play-status">Turns remaining: {remainingTurns}</p>
      )}

      <div className="minigame-play-choice-stack">
        {availableChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="preview-choice-button minigame-play-persuasion-choice"
            onClick={() => applyChoice(choice)}
            disabled={isFinished}
          >
            <span>{choice.text}</span>
            <span className="preview-choice-target">
              {Number(choice.delta || 0) >= 0 ? "+" : ""}
              {Number(choice.delta || 0)} to score
            </span>
          </button>
        ))}
      </div>

      {lastResponse && (
        <div className="minigame-play-response helper-box">{lastResponse}</div>
      )}

      <div className="minigame-play-actions">
        <button type="button" className="minigame-play-submit" onClick={() => finish()}>
          {block.submitLabel ?? "Submit"}
        </button>
      </div>
    </div>
  );
}