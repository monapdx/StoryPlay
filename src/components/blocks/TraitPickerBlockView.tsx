import React, { useMemo, useState } from "react";
import type {
  TraitPickerBlock,
  TraitPickerBlockResult,
  TraitOption,
} from "../../types/minigames";
import type { VariablePatch } from "../../types/storyBlocks";

interface PersuasionBlockViewProps {
  block: TraitPickerBlock;
  onComplete: (result: TraitPickerBlockResult) => void;
}

export default function TraitPickerBlockView({
  block,
  onComplete,
}: PersuasionBlockViewProps) {
  const [selectedTraitIds, setSelectedTraitIds] = useState<string[]>([]);

  const minSelections = block.minSelections ?? 0;
  const maxSelections = block.maxSelections ?? 1;
  const options: TraitOption[] = Array.isArray(block.options) ? block.options : [];

  const prompt = block.prompt ?? block.content ?? "";

  const selectedTraits = useMemo(() => {
    return options.filter((option) => selectedTraitIds.includes(option.id));
  }, [options, selectedTraitIds]);

  const canSubmit =
    selectedTraitIds.length >= minSelections &&
    selectedTraitIds.length <= maxSelections;

  function toggleTrait(traitId: string) {
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
  }

  return (
    <div className="storyplay-block trait-picker-block">
      {block.title && <h3>{block.title}</h3>}
      {prompt && <p>{prompt}</p>}

      <p>
        Selected: {selectedTraitIds.length} / {maxSelections}
      </p>

      {options.length === 0 ? (
        <div className="muted">No traits configured for this block yet.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {options.map((option) => {
            const selected = selectedTraitIds.includes(option.id);

            return (
              <button
                key={option.id || option.label}
                type="button"
                onClick={() => toggleTrait(option.id)}
                aria-pressed={selected}
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRadius: "10px",
                  border: selected ? "2px solid #333" : "1px solid #ccc",
                  background: selected ? "#f3f3f3" : "#fff",
                  cursor: "pointer",
                }}
              >
                <strong>{option.label || "Untitled trait"}</strong>
                {option.description && (
                  <div style={{ marginTop: "6px", fontSize: "0.95rem" }}>
                    {option.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <button type="button" disabled={!canSubmit || options.length === 0} onClick={finish}>
          {block.submitLabel ?? "Confirm Traits"}
        </button>
      </div>
    </div>
  );
}