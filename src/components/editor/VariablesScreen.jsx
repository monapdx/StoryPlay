import VariableEditor from "./VariableEditor";
import { setDocsHash } from "../../utils/hashRoute";

/**
 * Edge-to-edge workspace for global story variables (same object as editor / preview / export).
 * Includes demo switcher, export, and mini-game entry so the main app header can be hidden here.
 */
export default function VariablesScreen({
  variables,
  setVariables,
  variableMeta,
  setVariableMeta,
  onBack,
  activeTemplateLabel = "Blank project",
  onOpenTemplates,
  onExport,
  onImport,
  onOpenMiniGameEditor,
  canOpenMiniGameEditor,
  miniGameEditorTitle,
}) {
  const count = Object.keys(variables || {}).length;

  return (
    <div className="variables-screen variables-screen--edgeless">
      <div className="variables-screen-topbar">
        <div className="variables-screen-topbar-start">
          <button
            type="button"
            className="toolbar-button variables-screen-back"
            onClick={onBack}
          >
            ← Back to editor
          </button>
          <span className="variables-screen-brand" aria-hidden="true">
            StoryPlay
          </span>
        </div>

        <div className="variables-screen-topbar-demo">
          <span className="variables-screen-demo-label">Project</span>
          <span className="variables-screen-demo-value">{activeTemplateLabel}</span>
          <button
            type="button"
            className="variables-screen-action-btn"
            data-onboarding="templates"
            onClick={onOpenTemplates}
            title="Browse starter templates"
          >
            Templates
          </button>
        </div>

        <div className="variables-screen-topbar-actions">
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={() => setDocsHash()}
            title="Open StoryPlay documentation"
          >
            Documentation
          </button>
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onImport}
            title="Import a previously exported StoryPlay project (.json)"
          >
            Import
          </button>
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onExport}
            title="Download story as StoryPlay export JSON (v1)"
          >
            Export
          </button>
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onOpenMiniGameEditor}
            disabled={!canOpenMiniGameEditor}
            title={miniGameEditorTitle}
          >
            Mini-Games
          </button>
        </div>
      </div>

      <header className="variables-screen-hero">
        <h1 className="variables-screen-title">Variables</h1>
        <p className="variables-screen-subtitle">
          {count} {count === 1 ? "variable" : "variables"}
        </p>
      </header>

      <div className="variables-screen-body variables-screen-body--single custom-scrollbar">
        <section
          className="variables-screen-main"
          aria-label="Variable list and editor"
        >
          <VariableEditor
            variables={variables}
            setVariables={setVariables}
            variableMeta={variableMeta}
            setVariableMeta={setVariableMeta}
            showHeading={false}
          />
        </section>
      </div>
    </div>
  );
}
