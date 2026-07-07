import React from "react";

export default function MiniGameEditorHeader({ editor }) {
  const { draft } = editor;

  return (
    <div className="minigame-header">
      <div>
        <h2 className="minigame-header__title">
          {draft.title || "Untitled Mini-Game"}
        </h2>
        <div className="minigame-header__meta">
          <span className="minigame-chip">{draft.type}</span>
        </div>
      </div>
    </div>
  );
}