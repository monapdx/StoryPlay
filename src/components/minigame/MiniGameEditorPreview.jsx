import React from "react";
import MiniGamePreview from "./MiniGamePreview";

export default function MiniGameEditorPreview({ editor }) {
  return (
    <div className="minigame-preview-pane">
      <MiniGamePreview editor={editor} />
    </div>
  );
}