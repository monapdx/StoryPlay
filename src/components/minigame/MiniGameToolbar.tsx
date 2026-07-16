import UndoRedoButtons from "../editor/UndoRedoButtons";
import type { UseMiniGameEditorStateResult } from "../../hooks/useMiniGameEditorState";

interface MiniGameToolbarProps {
  editor: Pick<
    UseMiniGameEditorStateResult,
    | "activeTab"
    | "setActiveTab"
    | "validation"
    | "isDirty"
    | "handleBack"
    | "handleDiscard"
    | "handleSave"
    | "undo"
    | "redo"
    | "canUndo"
    | "canRedo"
  >;
}

export default function MiniGameToolbar({ editor }: MiniGameToolbarProps) {
  const { activeTab, setActiveTab, validation, isDirty } = editor;

  const statusMessage = !validation.isValid
    ? "Incomplete"
    : isDirty
      ? "Unsaved"
      : "Saved";

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

        <UndoRedoButtons
          onUndo={editor.undo}
          onRedo={editor.redo}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          className="minigame-toolbar__undo-redo"
          buttonClassName="minigame-btn"
        />
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
