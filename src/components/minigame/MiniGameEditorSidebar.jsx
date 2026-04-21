export default function MiniGameEditorSidebar({ editor }) {
  const draft = editor?.draft;
  const config = draft?.config || {};

  if (!draft) {
    return null;
  }

  return (
    <div className="minigame-panel">
      <h3 className="section-title">Mini-Game Settings</h3>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          type="text"
          value={draft.title || ""}
          onChange={(e) =>
            editor.updateDraft({ title: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">Prompt</label>
        <textarea
          className="form-textarea"
          value={draft.prompt || ""}
          onChange={(e) =>
            editor.updateDraft({ prompt: e.target.value })
          }
        />
      </div>

      {draft.type === "traitPicker" && (
        <>
          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Min Selections</label>
              <input
                className="form-input"
                type="number"
                value={config.minSelections ?? 0}
                onChange={(e) =>
                  editor.updateConfig({
                    minSelections: Number(e.target.value || 0),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Selections</label>
              <input
                className="form-input"
                type="number"
                value={config.maxSelections ?? 2}
                onChange={(e) =>
                  editor.updateConfig({
                    maxSelections: Number(e.target.value || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Trait List Variable</label>
            <input
              className="form-input"
              type="text"
              value={config.traitListVariable || ""}
              onChange={(e) =>
                editor.updateConfig({
                  traitListVariable: e.target.value,
                })
              }
            />
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
              value={config.targetName || ""}
              onChange={(e) =>
                editor.updateConfig({
                  targetName: e.target.value,
                })
              }
            />
          </div>

          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Start Score</label>
              <input
                className="form-input"
                type="number"
                value={config.startScore ?? 50}
                onChange={(e) =>
                  editor.updateConfig({
                    startScore: Number(e.target.value || 0),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Threshold</label>
              <input
                className="form-input"
                type="number"
                value={config.threshold ?? 75}
                onChange={(e) =>
                  editor.updateConfig({
                    threshold: Number(e.target.value || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Min Score</label>
              <input
                className="form-input"
                type="number"
                value={config.minScore ?? 0}
                onChange={(e) =>
                  editor.updateConfig({
                    minScore: Number(e.target.value || 0),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Score</label>
              <input
                className="form-input"
                type="number"
                value={config.maxScore ?? 100}
                onChange={(e) =>
                  editor.updateConfig({
                    maxScore: Number(e.target.value || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="minigame-grid two-up">
            <div className="form-group">
              <label className="form-label">Max Turns</label>
              <input
                className="form-input"
                type="number"
                value={config.maxTurns ?? 3}
                onChange={(e) =>
                  editor.updateConfig({
                    maxTurns: Number(e.target.value || 0),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Visible Meter</label>
              <select
                className="form-select"
                value={config.visibleMeter ? "true" : "false"}
                onChange={(e) =>
                  editor.updateConfig({
                    visibleMeter: e.target.value === "true",
                  })
                }
              >
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Score Variable</label>
            <input
              className="form-input"
              type="text"
              value={config.scoreVariable || ""}
              onChange={(e) =>
                editor.updateConfig({
                  scoreVariable: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Success Variable</label>
            <input
              className="form-input"
              type="text"
              value={config.successVariable || ""}
              onChange={(e) =>
                editor.updateConfig({
                  successVariable: e.target.value,
                })
              }
            />
          </div>
        </>
      )}

      {draft.type === "choiceWeighting" && (
        <>
          <div className="form-group">
            <label className="form-label">Total Points</label>
            <input
              className="form-input"
              type="number"
              value={config.totalPoints ?? 10}
              onChange={(e) =>
                editor.updateConfig({
                  totalPoints: Number(e.target.value || 0),
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variable Prefix</label>
            <input
              className="form-input"
              type="text"
              value={config.variablePrefix || ""}
              onChange={(e) =>
                editor.updateConfig({
                  variablePrefix: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Result Variable</label>
            <input
              className="form-input"
              type="text"
              value={config.resultVariable || ""}
              onChange={(e) =>
                editor.updateConfig({
                  resultVariable: e.target.value,
                })
              }
            />
          </div>

          <label className="minigame-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(config.lockExactTotal)}
              onChange={(e) =>
                editor.updateConfig({
                  lockExactTotal: e.target.checked,
                })
              }
            />
            <span>Require exact total</span>
          </label>
        </>
      )}
    </div>
  );
}