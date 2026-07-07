import React, { useEffect } from "react";
import useMiniGameEditorState from "../../hooks/useMiniGameEditorState";
import MiniGameEditorShell from "./MiniGameEditorShell";

function shouldIgnoreUndoKeyTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export default function MiniGameEditor({
  open,
  game,
  nodes = [],
  onClose,
  onSave,
}) {
  const editor = useMiniGameEditorState({
    open,
    game,
    onClose,
    onSave,
  });

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (shouldIgnoreUndoKeyTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        editor.undo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        editor.redo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, editor.undo, editor.redo]);

  if (!open || !game || !editor.draft) {
    return null;
  }

  return (
    <MiniGameEditorShell
      editor={editor}
      nodes={nodes}
    />
  );
}