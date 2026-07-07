/**
 * Shared undo/redo control for editor toolbars.
 */
export default function UndoRedoButtons({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className = "",
  buttonClassName = "header-button",
}) {
  return (
    <div
      className={["undo-redo-buttons", className].filter(Boolean).join(" ")}
      role="group"
      aria-label="Undo and redo"
    >
      <button
        type="button"
        className={buttonClassName}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last change (Ctrl+Z)"
        aria-label="Undo"
      >
        Undo
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        Redo
      </button>
    </div>
  );
}
