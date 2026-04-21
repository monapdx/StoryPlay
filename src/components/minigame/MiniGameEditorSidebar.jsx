import React from "react";
import MiniGameConfigPanel from "./MiniGameConfigPanel";
import MiniGameLogicPanel from "./MiniGameLogicPanel";

export default function MiniGameEditorSidebar({ editor }) {
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
            onChange={(event) => editor.setAdvancedJson(event.target.value)}
          />
        </div>

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
      <MiniGameConfigPanel editor={editor} />

      {activeTab === "logic" && <MiniGameLogicPanel editor={editor} />}
    </div>
  );
}