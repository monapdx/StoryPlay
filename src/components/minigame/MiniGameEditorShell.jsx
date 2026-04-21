import React from "react";
import MiniGameEditorHeader from "./MiniGameEditorHeader";
import MiniGameToolbar from "./MiniGameToolbar";
import MiniGameEditorSidebar from "./MiniGameEditorSidebar";
import MiniGameEditorInspector from "./MiniGameEditorInspector";
import MiniGameEditorPreview from "./MiniGameEditorPreview";

export default function MiniGameEditorShell({ editor, nodes }) {
  // 🔒 HARD GUARD
  if (!editor || !editor.draft || !editor.draft.config) {
    return null;
  }

  return (
    <div className="minigame-shell">
      <MiniGameEditorHeader editor={editor} />
      <MiniGameToolbar editor={editor} />

      <div className="minigame-shell__body">
        <aside className="minigame-shell__left">
          <MiniGameEditorSidebar editor={editor} />
        </aside>

        <main className="minigame-shell__center">
          <MiniGameEditorInspector editor={editor} nodes={nodes} />
        </main>

        <aside className="minigame-shell__right">
          <MiniGameEditorPreview editor={editor} />
        </aside>
      </div>
    </div>
  );
}