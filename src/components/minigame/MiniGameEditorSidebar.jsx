import React from "react";
import MiniGameConfigPanel from "./MiniGameConfigPanel";
import MiniGameLogicPanel from "./MiniGameLogicPanel";

/**
 * @param {{
 *   editor: import("../../hooks/useMiniGameEditorState").UseMiniGameEditorStateResult,
 *   nodes?: import("../../types/story").StoryNode[],
 * }} props
 */
export default function MiniGameEditorSidebar({ editor, nodes = [] }) {
  const draft = editor?.draft;
  const activeTab = editor?.activeTab || "config";

  if (!draft) {
    return (
      <div className="minigame-panel">
        <h3 className="section-title">Settings</h3>
        <div className="helper-box">Loading…</div>
      </div>
    );
  }

  if (activeTab === "advanced") {
    return (
      <div className="minigame-panel">
        <h3 className="section-title">Advanced JSON</h3>

        <div className="form-group">
          <label className="form-label">Raw config</label>
          <textarea
            className="form-textarea minigame-json"
            value={editor.advancedJson || ""}
            onChange={(event) => {
              editor.setAdvancedJson(event.target.value);
              if (editor.advancedJsonError) {
                editor.setAdvancedJsonError?.("");
              }
            }}
            aria-invalid={Boolean(editor.advancedJsonError)}
            aria-describedby={
              editor.advancedJsonError ? "minigame-advanced-json-error" : undefined
            }
          />
        </div>

        {editor.advancedJsonError ? (
          <p
            id="minigame-advanced-json-error"
            className="sidebar-hint"
            style={{ color: "#f87171", marginBottom: 12 }}
            role="alert"
          >
            {editor.advancedJsonError}
          </p>
        ) : null}

        <div className="minigame-inline-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={editor.applyAdvancedJson}
          >
            Apply JSON
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === "logic") {
    return (
      <div className="minigame-sidebar">
        <MiniGameLogicPanel editor={editor} />
      </div>
    );
  }

  return (
    <div className="minigame-sidebar">
      <MiniGameConfigPanel editor={editor} nodes={nodes} />
    </div>
  );
}