import React from "react";

export default function MiniGameConfigPanel({ editor, nodes = [] }) {
  const { draft } = editor;

  return (
    <div className="minigame-panel">
      <datalist id="minigame-config-node-ids">
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node?.data?.title || node.id}
          </option>
        ))}
      </datalist>

      <h3 className="section-title">Mini-Game Settings</h3>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          type="text"
          value={draft.title || ""}
          onChange={(event) => editor.updateDraft({ title: event.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Prompt</label>
        <textarea
          className="form-textarea"
          value={draft.prompt || ""}
          onChange={(event) => editor.updateDraft({ prompt: event.target.value })}
        />
      </div>

      {draft.type === "choiceWeighting" && (
        <>
          <div className="form-group">
            <label className="form-label">Total Points</label>
            <input
              className="form-input"
              type="number"
              value={draft.config.totalPoints ?? 10}
              onChange={(event) =>
                editor.updateConfig({
                  totalPoints: Number(event.target.value || 0),
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variable Prefix</label>
            <input
              className="form-input"
              type="text"
              value={draft.config.variablePrefix || ""}
              onChange={(event) =>
                editor.updateConfig({ variablePrefix: event.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Result Variable</label>
            <input
              className="form-input"
              type="text"
              value={draft.config.resultVariable || ""}
              onChange={(event) =>
                editor.updateConfig({ resultVariable: event.target.value })
              }
            />
          </div>

          <label className="minigame-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(draft.config.lockExactTotal)}
              onChange={(event) =>
                editor.updateConfig({ lockExactTotal: event.target.checked })
              }
            />
            <span>Require exact total</span>
          </label>

          <div className="form-group">
            <label className="form-label">Optional: auto-advance node ID</label>
            <input
              className="form-input"
              type="text"
              list="minigame-config-node-ids"
              value={draft.config.continueNodeId || ""}
              onChange={(event) =>
                editor.updateConfig({ continueNodeId: event.target.value })
              }
              placeholder="Leave blank to use branching choices on this block instead"
            />
            <div className="helper-box" style={{ marginTop: 8 }}>
              If set, preview jumps here after confirm. Otherwise use <strong>choices</strong> on this
              block for the next beat.
            </div>
          </div>

          <div className="helper-box">
            Assigned total: <strong>{editor.totalAssigned}</strong>
          </div>
        </>
      )}

      {draft.type === "persuasion" && (
        <>
          <div className="form-group">
            <label className="form-label">Target Name</label>
            <input
              className="form-input"
              type="text"
              value={draft.config.targetName || ""}
              onChange={(event) =>
                editor.updateConfig({ targetName: event.target.value })
              }
            />
          </div>

          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Start Score</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.startScore ?? 50}
                onChange={(event) =>
                  editor.updateConfig({ startScore: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Threshold</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.threshold ?? 75}
                onChange={(event) =>
                  editor.updateConfig({ threshold: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Score</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.minScore ?? 0}
                onChange={(event) =>
                  editor.updateConfig({ minScore: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Score</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.maxScore ?? 100}
                onChange={(event) =>
                  editor.updateConfig({ maxScore: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Turns</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.maxTurns ?? 3}
                onChange={(event) =>
                  editor.updateConfig({ maxTurns: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Score Variable</label>
              <input
                className="form-input"
                type="text"
                value={draft.config.scoreVariable || ""}
                onChange={(event) =>
                  editor.updateConfig({ scoreVariable: event.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Success Variable</label>
              <input
                className="form-input"
                type="text"
                value={draft.config.successVariable || ""}
                onChange={(event) =>
                  editor.updateConfig({ successVariable: event.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Success Node ID</label>
              <input
                className="form-input"
                type="text"
                value={draft.config.successNodeId || ""}
                onChange={(event) =>
                  editor.updateConfig({ successNodeId: event.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Failure Node ID</label>
              <input
                className="form-input"
                type="text"
                value={draft.config.failureNodeId || ""}
                onChange={(event) =>
                  editor.updateConfig({ failureNodeId: event.target.value })
                }
              />
            </div>
          </div>

          <label className="minigame-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(draft.config.visibleMeter)}
              onChange={(event) =>
                editor.updateConfig({ visibleMeter: event.target.checked })
              }
            />
            <span>Show visible meter</span>
          </label>
        </>
      )}

      {draft.type === "traitPicker" && (
        <>
          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Min Selections</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.minSelections ?? 0}
                onChange={(event) =>
                  editor.updateConfig({
                    minSelections: Number(event.target.value || 0),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Selections</label>
              <input
                className="form-input"
                type="number"
                value={draft.config.maxSelections ?? 2}
                onChange={(event) =>
                  editor.updateConfig({
                    maxSelections: Number(event.target.value || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Trait list variable (inventory)</label>
            <input
              className="form-input"
              type="text"
              value={draft.config.traitListVariable || ""}
              onChange={(event) =>
                editor.updateConfig({ traitListVariable: event.target.value })
              }
              placeholder="e.g. buildFocus — stores selected trait ids (array)"
            />
            <div className="helper-box" style={{ marginTop: 8 }}>
              On confirm, StoryPlay writes the <strong>selected trait ids</strong> here (like an
              inventory list). Use per-trait <strong>effects</strong> in the item inspector for extra
              variable bumps (stats, tags, etc.).
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Optional: auto-advance node ID</label>
            <input
              className="form-input"
              type="text"
              list="minigame-config-node-ids"
              value={draft.config.continueNodeId || ""}
              onChange={(event) =>
                editor.updateConfig({ continueNodeId: event.target.value })
              }
              placeholder="Leave blank to use branching choices on this block instead"
            />
            <div className="helper-box" style={{ marginTop: 8 }}>
              If set, preview jumps here immediately after confirm. If empty, add{" "}
              <strong>choices</strong> on this block in the sidebar for “where next” (often gated by
              variables set above).
            </div>
          </div>
        </>
      )}
    </div>
  );
}