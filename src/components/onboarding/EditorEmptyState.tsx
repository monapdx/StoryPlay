interface EditorEmptyStateProps {
  onAddNode: () => void;
  onOpenTutorial: () => void;
  onOpenTemplates: () => void;
}

export default function EditorEmptyState({
  onAddNode,
  onOpenTutorial,
  onOpenTemplates,
}: EditorEmptyStateProps) {
  return (
    <div className="editor-empty-state" aria-live="polite">
      <div className="editor-empty-state__card">
        <p className="editor-empty-state__eyebrow">New story</p>
        <h2 className="editor-empty-state__title">Start your first scene</h2>
        <p className="editor-empty-state__lead">
          Add a block, connect choices, or load an example.
        </p>

        <div className="editor-empty-state__actions">
          <button type="button" className="onboarding-tour__next" onClick={onAddNode}>
            + Add your first block
          </button>
          <button type="button" className="secondary-button" onClick={onOpenTutorial}>
            Open tutorial
          </button>
          <button type="button" className="secondary-button" onClick={onOpenTemplates}>
            Load example story
          </button>
        </div>
      </div>
    </div>
  );
}
