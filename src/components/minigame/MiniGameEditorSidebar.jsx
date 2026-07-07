import React from "react";
import MiniGameConfigPanel from "./MiniGameConfigPanel";
import MiniGameLogicPanel from "./MiniGameLogicPanel";

export default function MiniGameEditorSidebar({ editor, nodes = [] }) {
  const draft = editor?.draft;
  const activeTab = editor?.activeTab || "config";

  if (!draft) {
    return (
      <div className="minigame-panel">
        <h3 className="section-title">Mini-Game Settings</h3>
        <div className="helper-box">Loading mini-game editor…</div>
      </div>
    );
  }

  if (activeTab === "advanced") {
    return (
      <div className="minigame-panel">
        <h3 className="section-title">Advanced JSON</h3>

        <div className="form-group">
          <label className="form-label">Raw mini-game config</label>
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

        <div className="helper-box">
          Advanced mode is useful for power editing, but the structured tabs are safer.
        </div>
      </div>
    );
  }

  return (
    <div className="minigame-sidebar">
      <MiniGameConfigPanel editor={editor} nodes={nodes} />

      {activeTab === "logic" && <MiniGameLogicPanel editor={editor} />}
    </div>
  );
}