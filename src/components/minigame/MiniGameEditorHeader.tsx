/**
 * Fields MiniGameEditorHeader reads from the editor hook return value.
 * Full useMiniGameEditorState typing is deferred until the hook is converted.
 */
interface MiniGameEditorHeaderSource {
  draft: {
    title?: string | null;
    type?: string | null;
  };
}

interface MiniGameEditorHeaderProps {
  editor: MiniGameEditorHeaderSource;
}

export default function MiniGameEditorHeader({
  editor,
}: MiniGameEditorHeaderProps) {
  const { draft } = editor;

  return (
    <div className="minigame-header">
      <div>
        <h2 className="minigame-header__title">
          {draft.title || "Untitled Mini-Game"}
        </h2>
        <div className="minigame-header__meta">
          <span className="minigame-chip">{draft.type}</span>
        </div>
      </div>
    </div>
  );
}
