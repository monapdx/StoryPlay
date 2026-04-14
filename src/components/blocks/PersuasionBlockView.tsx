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
    <div className="storyplay-block persuasion-block">
      {block.title && <h3>{block.title}</h3>}
      {block.prompt && <p>{block.prompt}</p>}
      {block.targetName && (
        <p>
          <strong>Target:</strong> {block.targetName}
        </p>
      )}

      {block.visibleMeter && (
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="persuasion-meter">
            Persuasion: {score} / {block.threshold}
          </label>
          <br />
          <progress id="persuasion-meter" value={score} max={maxScore} />
        </div>
      )}

      {remainingTurns !== undefined && <p>Turns remaining: {remainingTurns}</p>}

      <div style={{ display: "grid", gap: "10px" }}>
        {availableChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => applyChoice(choice)}
            disabled={isFinished}
            style={{ textAlign: "left", padding: "10px" }}
          >
            {choice.text}
          </button>
        ))}
      </div>

      {lastResponse && <p style={{ marginTop: "12px" }}>{lastResponse}</p>}

      <div style={{ marginTop: "16px" }}>
        <button type="button" onClick={() => finish()}>
          {block.submitLabel ?? "Submit"}
        </button>
      </div>
    </div>
  );
}