import VariableEditor from "./VariableEditor";

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
            title="Browse starter example stories"
          >
            Example stories
          </button>
        </div>

        <div className="variables-screen-topbar-actions">
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onImport}
            title="Import a previously exported StoryPlay project (.json)"
          >
            Import Project
          </button>
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onExport}
            title="Download story as StoryPlay export JSON (v1)"
          >
            Export Game
          </button>
          <button
            type="button"
            className="variables-screen-action-btn"
            onClick={onOpenMiniGameEditor}
            disabled={!canOpenMiniGameEditor}
            title={miniGameEditorTitle}
          >
            Open Mini-Game Editor
          </button>
        </div>
      </div>

      <header className="variables-screen-hero">
        <h1 className="variables-screen-title">Variables workspace</h1>
        <p className="variables-screen-subtitle">
          {count} defined {count === 1 ? "variable" : "variables"} · shared across the graph,
          conditions, effects, and play preview
        </p>
      </header>

      <div className="variables-screen-body custom-scrollbar">
        <aside className="variables-screen-aside" aria-label="How variables work">
          <div className="variables-screen-panel">
            <h2 className="variables-screen-panel-title">What lives here</h2>
            <p>
              These are <strong>story-wide</strong> values (numbers, strings, or booleans).
              They are not stored on individual blocks—every node reads the same map.
            </p>
          </div>
          <div className="variables-screen-panel">
            <h2 className="variables-screen-panel-title">Where they are used</h2>
            <ul className="variables-screen-list">
              <li>
                <strong>Choices</strong> — conditions can hide or show a choice based on current values.
              </li>
              <li>
                <strong>Effects</strong> — picking a choice can add, set, subtract, or toggle variables.
              </li>
              <li>
                <strong>Preview</strong> — play mode starts from these defaults, then applies effects as you play.
                Set <strong>player-facing names</strong> on each variable so stats read naturally in preview and play mode.
              </li>
              <li>
                <strong>Export</strong> — use <strong>Export Game</strong> in the bar above; the same{" "}
                <code>variables</code> object is included in StoryPlay JSON exports.
              </li>
            </ul>
          </div>
          <div className="variables-screen-panel variables-screen-panel-tip">
            <h2 className="variables-screen-panel-title">Tip</h2>
            <p>
              Name variables clearly (<code>hasKey</code>, <code>gold</code>) so conditions stay readable in the
              sidebar. <strong>Open Mini-Game Editor</strong> is only available when a supported mini-game block is
              selected on the canvas—return to the editor to pick one.
            </p>
          </div>
        </aside>

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
