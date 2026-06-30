import React from "react";

export default function MiniGameToolbar({ editor }) {
  const { activeTab, setActiveTab, validation, isDirty } = editor;

  const statusMessage = !validation.isValid
    ? "Draft incomplete — you can still save"
    : isDirty
      ? "Unsaved changes"
      : "All changes saved";

  return (
    <div className="minigame-toolbar">
      <div className="minigame-toolbar__left">
        <button
          type="button"
          className="minigame-btn"
          onClick={editor.handleBack}
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
        <div className="minigame-toolbar__status">{statusMessage}</div>
        <button
          type="button"
          className="minigame-btn"
          onClick={editor.handleDiscard}
        >
          Cancel
        </button>
        <button
          type="button"
          className="minigame-btn minigame-btn--primary"
          onClick={editor.handleSave}
          disabled={!isDirty}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}