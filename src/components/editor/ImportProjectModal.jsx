/**
 * Confirmation modal shown after a StoryPlay export file is parsed and validated.
 */
export default function ImportProjectModal({
  open,
  preview,
  onCancel,
  onConfirm,
}) {
  if (!open || !preview) return null;

  const { summary, errors, warnings } = preview;
  const canImport = errors.length === 0 && preview.story != null;

  return (
    <div
      className="starter-template-modal import-project-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-project-title"
      onClick={onCancel}
    >
      <div
        className="starter-template-modal__panel import-project-modal__panel custom-scrollbar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="starter-template-modal__head">
          <div>
            <p className="starter-template-modal__eyebrow">Import project</p>
            <h2 id="import-project-title" className="starter-template-modal__title">
              Review import
            </h2>
            <p className="starter-template-modal__lead import-project-modal__warning">
              Replaces your current project.
            </p>
          </div>
          <button
            type="button"
            className="toolbar-button starter-template-modal__close"
            onClick={onCancel}
            aria-label="Cancel import"
          >
            Cancel
          </button>
        </div>

        {summary && (
          <dl className="import-project-modal__summary">
            <div>
              <dt>Nodes</dt>
              <dd>{summary.nodeCount}</dd>
            </div>
            <div>
              <dt>Variables</dt>
              <dd>{summary.variableCount}</dd>
            </div>
            <div>
              <dt>Characters</dt>
              <dd>{summary.characterCount}</dd>
            </div>
            <div>
              <dt>Format version</dt>
              <dd>{summary.formatVersion}</dd>
            </div>
            {summary.exportedAt && (
              <div className="import-project-modal__summary-wide">
                <dt>Exported at</dt>
                <dd>{summary.exportedAt}</dd>
              </div>
            )}
          </dl>
        )}

        {errors.length > 0 && (
          <div className="import-project-modal__messages import-project-modal__messages--error">
            <p className="import-project-modal__messages-title">Cannot import</p>
            <ul>
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="import-project-modal__messages import-project-modal__messages--warning">
            <p className="import-project-modal__messages-title">Warnings</p>
            <ul>
              {warnings.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="import-project-modal__actions">
          <button type="button" className="toolbar-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="header-button"
            disabled={!canImport}
            onClick={onConfirm}
            title={
              canImport
                ? "Replace the current project with this file"
                : "Fix validation errors before importing"
            }
          >
            Replace current project
          </button>
        </div>
      </div>
    </div>
  );
}
