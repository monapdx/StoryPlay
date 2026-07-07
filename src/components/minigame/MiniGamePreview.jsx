import React, { useEffect, useMemo, useState } from "react";

export default function MiniGamePreview({ editor }) {
  const { draft, previewState } = editor;
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);

  useEffect(() => {
    setSelectedIds([]);
    setSelectedChoiceId(null);
  }, [draft]);

  const selectedScore = useMemo(() => {
    if (draft.type !== "choiceWeighting") return 0;

    return (draft.config.options || [])
      .filter((option) => selectedIds.includes(option.id))
      .reduce((sum, option) => sum + Number(option.value || 0), 0);
  }, [draft, selectedIds]);

  function toggleChoiceWeightingOption(optionId) {
    setSelectedIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    );
  }

  function toggleTraitOption(optionId) {
    const maxSelections = Number(draft.config.maxSelections || 0);

    setSelectedIds((current) => {
      if (current.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }

      if (maxSelections > 0 && current.length >= maxSelections) {
        return current;
      }

      return [...current, optionId];
    });
  }

  function runPreview() {
    if (draft.type === "choiceWeighting") {
      editor.runPreview({ selectedIds });
      return;
    }

    if (draft.type === "persuasion") {
      editor.runPreview({ selectedChoiceId });
      return;
    }

    if (draft.type === "traitPicker") {
      editor.runPreview({ selectedIds });
    }
  }

  function resetPreview() {
    setSelectedIds([]);
    setSelectedChoiceId(null);
    editor.runPreview(
      draft.type === "persuasion"
        ? { selectedChoiceId: null }
        : { selectedIds: [] }
    );
  }

  return (
    <div className="minigame-panel">
      <h3 className="section-title">Live Preview</h3>

      <div className="preview-block">
        <div className="preview-title">{draft.title || "Untitled Mini-Game"}</div>
        <div className="preview-content">
          {draft.prompt || "Your mini-game prompt preview will appear here."}
        </div>

        {draft.type === "choiceWeighting" && (
          <>
            <div className="minigame-preview-list">
              {(draft.config.options || []).map((option) => {
                const checked = selectedIds.includes(option.id);

                return (
                  <label
                    key={option.id}
                    className={`minigame-preview-choice ${checked ? "is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChoiceWeightingOption(option.id)}
                    />
                    <span>{option.label || "Untitled option"}</span>
                    <strong>{Number(option.value || 0)}</strong>
                  </label>
                );
              })}
            </div>

            <p className="sidebar-hint">
              Score: {selectedScore} / {Number(draft.config.totalPoints || 0)}
            </p>
          </>
        )}

        {draft.type === "persuasion" && (
          <div className="minigame-preview-list">
            {(draft.config.choices || []).map((choice) => {
              const selected = selectedChoiceId === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`preview-choice-button ${selected ? "is-selected" : ""}`}
                  onClick={() => setSelectedChoiceId(choice.id)}
                >
                  <span>{choice.text || "Untitled choice"}</span>
                  <span className="preview-choice-target">
                    Delta: {Number(choice.delta || 0) >= 0 ? "+" : ""}
                    {Number(choice.delta || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {draft.type === "traitPicker" && (
          <>
            <div className="minigame-preview-list">
              {(draft.config.options || []).map((option) => {
                const checked = selectedIds.includes(option.id);

                return (
                  <label
                    key={option.id}
                    className={`minigame-preview-choice ${checked ? "is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTraitOption(option.id)}
                    />
                    <span>{option.label || "Untitled trait"}</span>
                    <strong>{option.value || "—"}</strong>
                  </label>
                );
              })}
            </div>

            <p className="sidebar-hint">
              Selected: {selectedIds.length} / {Number(draft.config.maxSelections || 0)}
            </p>
          </>
        )}

        <div className="minigame-inline-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={runPreview}
          >
            Run Test
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={resetPreview}
          >
            Reset
          </button>
        </div>

        {previewState && (
          <div className="minigame-result">
            {previewState.type === "choiceWeighting" && (
              <>
                <div>
                  Status: <strong>{previewState.status}</strong>
                </div>
                <div>
                  Score: <strong>{previewState.score}</strong>
                </div>
              </>
            )}

            {previewState.type === "persuasion" && (
              <>
                <div>
                  Before: <strong>{previewState.scoreBefore}</strong>
                </div>
                <div>
                  After: <strong>{previewState.scoreAfter}</strong>
                </div>
                <div>
                  Success: <strong>{previewState.success ? "Yes" : "No"}</strong>
                </div>
                {previewState.response && (
                  <p className="sidebar-hint">{previewState.response}</p>
                )}
              </>
            )}

            {previewState.type === "traitPicker" && (
              <>
                <div>
                  Selected count: <strong>{previewState.count}</strong>
                </div>
                <div>
                  Values:{" "}
                  <strong>
                    {previewState.selectedValues?.length
                      ? previewState.selectedValues.join(", ")
                      : "None"}
                  </strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}