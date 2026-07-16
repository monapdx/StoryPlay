import type {
  MiniGameEditorDraft,
  UseMiniGameEditorStateResult,
} from "../../hooks/useMiniGameEditorState";
import MiniGamePreview from "./MiniGamePreview";

interface MiniGameEditorPreviewProps {
  editor: UseMiniGameEditorStateResult & { draft: MiniGameEditorDraft };
}

export default function MiniGameEditorPreview({
  editor,
}: MiniGameEditorPreviewProps) {
  return (
    <div className="minigame-preview-pane">
      <MiniGamePreview editor={editor} />
    </div>
  );
}
