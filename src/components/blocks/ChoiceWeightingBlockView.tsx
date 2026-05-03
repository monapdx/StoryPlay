import React, { useMemo, useState } from "react";
import type {
  ChoiceWeightingBlock,
  ChoiceWeightingBlockResult,
  WeightedOption,
} from "../../types/minigames";
import type { VariablePatch } from "../../types/storyBlocks";

interface ChoiceWeightingBlockViewProps {
  block: ChoiceWeightingBlock;
  onComplete: (result: ChoiceWeightingBlockResult) => void;
}

function buildInitialAllocation(options: WeightedOption[]) {
  return Object.fromEntries(
    options.map((option) => [option.id, option.min ?? 0])
  ) as Record<string, number>;
}

export default function ChoiceWeightingBlockView({
  block,
  onComplete,
}: ChoiceWeightingBlockViewProps) {
  const options: WeightedOption[] = Array.isArray(block.options) ? block.options : [];
  const prompt = block.prompt ?? block.content ?? "";
  const totalPoints = block.totalPoints ?? 10;
  const lockExactTotal = block.lockExactTotal ?? true;

  const [allocation, setAllocation] = useState<Record<string, number>>(() =>
    buildInitialAllocation(options)
  );

  const totalAssigned = useMemo(() => {
    return Object.values(allocation).reduce((sum, value) => sum + value, 0);
  }, [allocation]);

  const pointsRemaining = totalPoints - totalAssigned;
  const canSubmit = lockExactTotal ? pointsRemaining === 0 : pointsRemaining >= 0;

  function updateOption(optionId: string, nextValue: number) {
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
  }

  return (
    <div className="storyplay-block choice-weighting-block">
      {block.title && <h3>{block.title}</h3>}
      {prompt && <p>{prompt}</p>}

      <p>
        Points remaining: <strong>{pointsRemaining}</strong>
      </p>

      {options.length === 0 ? (
        <div className="muted">No weighting options configured for this block yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {options.map((option) => {
            const value = allocation[option.id] ?? 0;
            const min = option.min ?? 0;
            const max = option.max ?? totalPoints;

            return (
              <div key={option.id || option.label}>
                <label htmlFor={option.id}>
                  {option.label || "Untitled option"}: {value}
                </label>
                <br />
                <input
                  id={option.id}
                  type="range"
                  min={min}
                  max={max}
                  value={value}
                  onChange={(event) =>
                    updateOption(option.id, Number(event.target.value))
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <button
          type="button"
          disabled={!canSubmit || options.length === 0}
          onClick={finish}
        >
          {block.submitLabel ?? "Confirm Allocation"}
        </button>
      </div>
    </div>
  );
}