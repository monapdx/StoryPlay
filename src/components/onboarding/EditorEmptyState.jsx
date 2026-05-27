export default function EditorEmptyState({
  onAddNode,
  onOpenTutorial,
  onOpenTemplates,
}) {
  return (
    <div className="editor-empty-state" aria-live="polite">
      <div className="editor-empty-state__card">
        <p className="editor-empty-state__eyebrow">New story</p>
        <h2 className="editor-empty-state__title">Start your first scene</h2>
        <p className="editor-empty-state__lead">
          Your canvas is empty on purpose. Add a block, write what happens, then branch with
          choices.
        </p>

        <ul className="editor-empty-state__tips">
          <li>Add a node to create a scene</li>
          <li>Create a choice to branch the story</li>
          <li>Open the tutorial for a quick tour</li>
          <li>Load an example story to see what’s possible</li>
        </ul>

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
