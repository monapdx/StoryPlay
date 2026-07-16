import React from "react";

function getItemLabel(draft, item, index) {
  if (!item) return `Item ${index + 1}`;

  if (draft.type === "persuasion") {
    return item.text || `Choice ${index + 1}`;
  }

  if (draft.type === "traitPicker") {
    return item.label || `Trait ${index + 1}`;
  }

  return item.label || `Option ${index + 1}`;
}

/**
 * @param {{
 *   editor: import("../../hooks/useMiniGameEditorState").UseMiniGameEditorStateResult,
 *   nodes?: import("../../types/story").StoryNode[],
 * }} props
 */
export default function MiniGameEditorInspector({ editor, nodes = [] }) {
  const { draft, items, selectedItem, selectedItemId } = editor;

  return (
    <div className="minigame-inspector">
      <div className="minigame-panel">
        <div className="minigame-panel-header">
          <h3 className="section-title">Items</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={editor.addItem}
          >
            + Add
          </button>
        </div>

        <div className="minigame-option-list">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`minigame-option-card ${
                item.id === selectedItemId ? "is-selected" : ""
              }`}
              onClick={() => editor.setSelectedItemId(item.id)}
            >
              <div className="minigame-option-card__top">
                <strong>{getItemLabel(draft, item, index)}</strong>

                {draft.type === "choiceWeighting" && (
                  <span>{Number(item.value || 0)} pts</span>
                )}

                {draft.type === "persuasion" && (
                  <span>{Number(item.delta || 0) >= 0 ? "+" : ""}{Number(item.delta || 0)}</span>
                )}
              </div>

              {draft.type === "traitPicker" && item.value && (
                <div className="minigame-option-card__bottom">{item.value}</div>
              )}

              {draft.type === "persuasion" && item.response && (
                <div className="minigame-option-card__bottom">{item.response}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="minigame-panel">
        <h3 className="section-title">Selected Item</h3>

        {!selectedItem ? (
          <p className="sidebar-hint">Select an item.</p>
        ) : (
          <>
            {draft.type === "choiceWeighting" && (
              <>
                <div className="form-group">
                  <label className="form-label">Label</label>
                  <input
                    className="form-input"
                    type="text"
                    value={selectedItem.label || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Point Value</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selectedItem.value ?? 0}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        value: Number(event.target.value || 0),
                      })
                    }
                  />
                </div>

                <label className="minigame-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedItem.correct)}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        correct: event.target.checked,
                      })
                    }
                  />
                  <span>Mark as correct</span>
                </label>
              </>
            )}

            {draft.type === "persuasion" && (
              <>
                <div className="form-group">
                  <label className="form-label">Choice Text</label>
                  <input
                    className="form-input"
                    type="text"
                    value={selectedItem.text || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        text: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Score Delta</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selectedItem.delta ?? 0}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        delta: Number(event.target.value || 0),
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Response</label>
                  <textarea
                    className="form-textarea"
                    value={selectedItem.response || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        response: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="minigame-grid two-up">
                  <div className="form-group">
                    <label className="form-label">Success Node ID</label>
                    <input
                      className="form-input"
                      type="text"
                      list="storyplay-node-ids"
                      value={selectedItem.successNodeId || ""}
                      onChange={(event) =>
                        editor.updateItem(selectedItem.id, {
                          successNodeId: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Failure Node ID</label>
                    <input
                      className="form-input"
                      type="text"
                      list="storyplay-node-ids"
                      value={selectedItem.failureNodeId || ""}
                      onChange={(event) =>
                        editor.updateItem(selectedItem.id, {
                          failureNodeId: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <datalist id="storyplay-node-ids">
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node?.data?.title || node.id}
                    </option>
                  ))}
                </datalist>
              </>
            )}

            {draft.type === "traitPicker" && (
              <>
                <div className="form-group">
                  <label className="form-label">Label</label>
                  <input
                    className="form-input"
                    type="text"
                    value={selectedItem.label || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input
                    className="form-input"
                    type="text"
                    value={selectedItem.value || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        value: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={selectedItem.description || ""}
                    onChange={(event) =>
                      editor.updateItem(selectedItem.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            <div className="minigame-inline-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => editor.moveItem(selectedItem.id, "up")}
              >
                Move Up
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => editor.moveItem(selectedItem.id, "down")}
              >
                Move Down
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => editor.removeItem(selectedItem.id)}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}