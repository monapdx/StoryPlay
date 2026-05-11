import React, { useEffect, useMemo, useState } from "react";
import type {
  ChoiceWeightingBlock,
  ChoiceWeightingBlockResult,
  WeightedOption,
} from "../../types/minigames";
import type { VariablePatch } from "../../types/storyBlocks";

interface ChoiceWeightingBlockViewProps {
  block: ChoiceWeightingBlock;
  previewSessionNonce?: number;
  onComplete: (result: ChoiceWeightingBlockResult) => void;
}

function buildInitialAllocation(options: WeightedOption[]) {
  return Object.fromEntries(
    options.map((option) => [option.id, option.min ?? 0])
  ) as Record<string, number>;
}

export default function ChoiceWeightingBlockView({
  block,
  previewSessionNonce = 0,
  onComplete,
}: ChoiceWeightingBlockViewProps) {
  const options: WeightedOption[] = Array.isArray(block.options) ? block.options : [];
  const prompt = block.prompt ?? block.content ?? "";
  const totalPoints = block.totalPoints ?? 10;
  const lockExactTotal = block.lockExactTotal ?? true;

  const [allocation, setAllocation] = useState<Record<string, number>>(() =>
    buildInitialAllocation(options)
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAllocation(buildInitialAllocation(options));
    setSubmitted(false);
  }, [previewSessionNonce]);

  const totalAssigned = useMemo(() => {
    return Object.values(allocation).reduce((sum, value) => sum + value, 0);
  }, [allocation]);

  const pointsRemaining = totalPoints - totalAssigned;
  const canSubmit = lockExactTotal ? pointsRemaining === 0 : pointsRemaining >= 0;

  function updateOption(optionId: string, nextValue: number) {
    if (submitted) return;

    const option = options.find((item) => item.id === optionId);
    if (!option) return;

    const min = option.min ?? 0;
    const max = option.max ?? totalPoints;
    const clamped = Math.max(min, Math.min(max, nextValue));

    setAllocation((current) => ({
      ...current,
      [optionId]: clamped,
    }));
  }

  function finish() {
    if (submitted) return;
    if (!canSubmit || options.length === 0) return;

    const patch: VariablePatch = {
      ...(block.resultVariable ? { [block.resultVariable]: allocation } : {}),
    };

    if (block.variablePrefix) {
      for (const [key, value] of Object.entries(allocation)) {
        patch[`${block.variablePrefix}${key}`] = value;
      }
    }

    const continueNodeId =
      typeof block.continueNodeId === "string" && block.continueNodeId.trim()
        ? block.continueNodeId.trim()
        : undefined;

    onComplete({
      type: "choiceWeighting",
      completed: true,
      allocation,
      totalAssigned,
      pointsRemaining,
      nextNodeId: continueNodeId,
      variablePatch: patch,
    });

    setSubmitted(true);
  }

  return (
    <div className="storyplay-block choice-weighting-block minigame-play">
      {block.title && <h3 className="minigame-play-heading">{block.title}</h3>}
      {prompt && <p className="minigame-play-prompt">{prompt}</p>}

      <p className="minigame-play-status">
        Points remaining: <strong>{pointsRemaining}</strong>
        {lockExactTotal && <span className="muted"> (exact total required)</span>}
      </p>

      {options.length === 0 ? (
        <div className="muted">No weighting options configured for this block yet.</div>
      ) : (
        <div className="minigame-play-slider-list">
          {options.map((option) => {
            const value = allocation[option.id] ?? 0;
            const min = option.min ?? 0;
            const max = option.max ?? totalPoints;

            return (
              <div key={option.id || option.label} className="minigame-play-slider-row">
                <div className="minigame-play-slider-row__head">
                  <label className="form-label" htmlFor={option.id}>
                    {option.label || "Untitled option"}
                  </label>
                  <span className="minigame-play-slider-row__value">{value}</span>
                </div>
                <input
                  id={option.id}
                  type="range"
                  className="minigame-play-range"
                  min={min}
                  max={max}
                  value={value}
                  disabled={submitted}
                  onChange={(event) =>
                    updateOption(option.id, Number(event.target.value))
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="minigame-play-actions">
        <button
          type="button"
          className="minigame-play-submit"
          disabled={submitted || !canSubmit || options.length === 0}
          onClick={finish}
        >
          {submitted ? "Confirmed" : block.submitLabel ?? "Confirm Allocation"}
        </button>
      </div>
    </div>
  );
}