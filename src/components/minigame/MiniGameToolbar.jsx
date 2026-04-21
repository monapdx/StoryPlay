import React from "react";

export default function MiniGameToolbar({ editor }) {
  const { activeTab, setActiveTab, validation } = editor;

  return (
    <div className="minigame-toolbar">
      <div className="minigame-toolbar__left">
        <button
          type="button"
          className="minigame-btn"
          onClick={editor.handleClose}
        >
          Back to Story
        </button>
      </div>

      <div className="minigame-toolbar__center">
        <button
          type="button"
          className={`minigame-tab ${activeTab === "config" ? "is-active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          Config
        </button>
        <button
          type="button"
          className={`minigame-tab ${activeTab === "logic" ? "is-active" : ""}`}
          onClick={() => setActiveTab("logic")}
        >
          Logic
        </button>
        <button
          type="button"
          className={`minigame-tab ${activeTab === "advanced" ? "is-active" : ""}`}
          onClick={() => setActiveTab("advanced")}
        >
          Advanced
        </button>
      </div>

      <div className="minigame-toolbar__right">
        <div className="minigame-toolbar__status">
          {!validation.isValid ? "Needs fixes before save" : "Ready to save"}
        </div>
        <button
          type="button"
          className="minigame-btn"
          onClick={editor.handleClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="minigame-btn minigame-btn--primary"
          onClick={editor.handleSave}
          disabled={!validation.isValid}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}