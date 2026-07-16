import type {
  MiniGameEditorDraft,
  UseMiniGameEditorStateResult,
} from "../../hooks/useMiniGameEditorState";
import type { StoryNode } from "../../types/story";
import MiniGameEditorHeader from "./MiniGameEditorHeader";
import MiniGameToolbar from "./MiniGameToolbar";
import MiniGameEditorSidebar from "./MiniGameEditorSidebar";
import MiniGameEditorInspector from "./MiniGameEditorInspector";
import MiniGameEditorPreview from "./MiniGameEditorPreview";

/**
 * Shell is only mounted when MiniGameEditor has a non-null draft.
 * Nodes stay StoryNode[] at the boundary; sidebar/inspector remain JS.
 */
interface MiniGameEditorShellProps {
  editor: UseMiniGameEditorStateResult & { draft: MiniGameEditorDraft };
  nodes: StoryNode[];
}

export default function MiniGameEditorShell({
  editor,
  nodes,
}: MiniGameEditorShellProps) {
  return (
    <div className="minigame-shell">
      <MiniGameEditorHeader editor={editor} />
      <MiniGameToolbar editor={editor} />

      <div className="minigame-shell__body">
        <aside className="minigame-shell__left">
          <MiniGameEditorSidebar editor={editor} nodes={nodes} />
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
