import MiniGamePreview from "./MiniGamePreview";

/**
 * Editor bag forwarded into MiniGamePreview (still JS).
 * Kept structural/minimal until useMiniGameEditorState is typed.
 */
interface MiniGameEditorPreviewProps {
  editor: {
    draft: unknown;
  };
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
