import React from "react";
import useMiniGameEditorState from "../../hooks/useMiniGameEditorState";
import MiniGameEditorShell from "./MiniGameEditorShell";

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