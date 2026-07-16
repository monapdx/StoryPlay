import { useEffect } from "react";
import useMiniGameEditorState, {
  type MiniGameEditorDraft,
  type UseMiniGameEditorStateParams,
  type UseMiniGameEditorStateResult,
} from "../../hooks/useMiniGameEditorState";
import type { StoryNode } from "../../types/story";
import MiniGameEditorShell from "./MiniGameEditorShell";

/**
 * Public editor props. `game` is an editor payload (from buildMiniGameFromSelectedNode)
 * or other normalize-accepted input — not a flat StoryPlayMiniGameBlock.
 * `onSave` receives a MiniGameEditorDraft (title/type/prompt/config), not a runtime block.
 */
export type MiniGameEditorProps = UseMiniGameEditorStateParams & {
  nodes?: StoryNode[];
};

function shouldIgnoreUndoKeyTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as HTMLElement;
  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (element.isContentEditable) return true;
  return false;
}

export default function MiniGameEditor({
  open,
  game,
  nodes = [],
  onClose,
  onSave,
}: MiniGameEditorProps) {
  const editor = useMiniGameEditorState({
    open,
    game,
    onClose,
    onSave,
  });

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
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

  const editorWithDraft: UseMiniGameEditorStateResult & {
    draft: MiniGameEditorDraft;
  } = {
    ...editor,
    draft: editor.draft,
  };

  return <MiniGameEditorShell editor={editorWithDraft} nodes={nodes} />;
}
