import React from "react";
import useMiniGameEditorState, {
  createDefaultMiniGame,
} from "../../hooks/useMiniGameEditorState";
import MiniGameEditorShell from "./MiniGameEditorShell";

export default function MiniGameEditor({
  open,
  game,
  nodes = [],
  onClose,
  onSave,
}) {
  const safeGame =
    game && typeof game === "object"
      ? {
          ...createDefaultMiniGame(game.type || "choiceWeighting"),
          ...game,
          config: {
            ...(createDefaultMiniGame(game.type || "choiceWeighting").config),
            ...(game.config || {}),
          },
        }
      : createDefaultMiniGame("choiceWeighting");

  const editor = useMiniGameEditorState({
    open,
    game: safeGame,
    onClose,
    onSave,
  });

  if (!open) return null;
  if (!editor?.draft) return null;
  if (!editor?.draft?.config) return null;

  return (
    <MiniGameEditorShell
      editor={editor}
      nodes={nodes}
    />
  );
}