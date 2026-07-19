import React, { useEffect, useMemo, useState } from "react";
import type {
  TraitPickerBlock,
  TraitPickerBlockResult,
  TraitOption,
} from "../../types/minigames";
import type { VariablePatch } from "../../types/storyBlocks";

interface TraitPickerBlockViewProps {
  block: TraitPickerBlock;
  /** Bumps when preview Start/Reset runs so the picker clears between sessions. */
  previewSessionNonce?: number;
  onComplete: (result: TraitPickerBlockResult) => void;
}

export default function TraitPickerBlockView({
  block,
  previewSessionNonce = 0,
  onComplete,
}: TraitPickerBlockViewProps) {
  const [selectedTraitIds, setSelectedTraitIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelectedTraitIds([]);
    setSubmitted(false);
  }, [previewSessionNonce]);

  const minSelections = block.minSelections ?? 0;
  const maxSelections = block.maxSelections ?? 2;
  const options: TraitOption[] = Array.isArray(block.options) ? block.options : [];

  const prompt = block.prompt ?? block.content ?? "";

  const selectedTraits = useMemo(() => {
    return options.filter((option) => selectedTraitIds.includes(option.id));
  }, [options, selectedTraitIds]);

  const canSubmit =
    selectedTraitIds.length >= minSelections &&
    selectedTraitIds.length <= maxSelections;

  function toggleTrait(traitId: string) {
    if (submitted) return;

    setSelectedTraitIds((current) => {
      if (current.includes(traitId)) {
        return current.filter((id) => id !== traitId);
      }

      if (current.length >= maxSelections) {
        return current;
      }

      return [...current, traitId];
    });
  }

  function finish() {
    if (submitted) return;
    if (!canSubmit || options.length === 0) return;

    const effectsPatch: VariablePatch = {};

    for (const trait of selectedTraits) {
      if (!trait.effects) continue;

      for (const [key, value] of Object.entries(trait.effects)) {
        const existing = effectsPatch[key];

        if (typeof value === "number" && typeof existing === "number") {
          effectsPatch[key] = existing + value;
        } else {
          effectsPatch[key] = value;
        }
      }
    }

    const continueNodeId =
      typeof block.continueNodeId === "string" && block.continueNodeId.trim()
        ? block.continueNodeId.trim()
        : undefined;

    onComplete({
      type: "traitPicker",
      completed: true,
      selectedTraitIds,
      selectedTraits,
      nextNodeId: continueNodeId,
      variablePatch: {
        ...(block.traitListVariable
          ? { [block.traitListVariable]: selectedTraitIds }
          : {}),
        ...effectsPatch,
      },
    });

    setSubmitted(true);
  }

  return (
    <div className="storyplay-block trait-picker-block minigame-play">
      {block.title && <h3 className="minigame-play-heading">{block.title}</h3>}
      {prompt && <p className="minigame-play-prompt">{prompt}</p>}

      <p className="minigame-play-status">
        Selected: <strong>{selectedTraitIds.length}</strong> / {maxSelections}
        {minSelections > 0 && (
          <>
            {" "}
            (minimum <strong>{minSelections}</strong>)
          </>
        )}
      </p>

      {options.length === 0 ? (
        <div className="muted">No traits configured for this block yet.</div>
      ) : (
        <div className="minigame-play-grid">
          {options.map((option) => {
            const selected = selectedTraitIds.includes(option.id);

            return (
              <button
                key={option.id || option.label}
                type="button"
                className="minigame-play-card"
                onClick={() => toggleTrait(option.id)}
                disabled={submitted}
                aria-pressed={selected}
              >
                <span className="minigame-play-card__label">
                  {option.label || "Untitled trait"}
                </span>
                {option.description && (
                  <span className="minigame-play-card__desc">{option.description}</span>
                )}
              </button>
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
          {submitted ? "Confirmed" : block.submitLabel ?? "Confirm Traits"}
        </button>
      </div>
    </div>
  );
}