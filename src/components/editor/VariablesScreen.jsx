import VariableEditor from "./VariableEditor";

/**
 * Edge-to-edge workspace for global story variables (same object as editor / preview / export).
 * Includes demo switcher, export, and mini-game entry so the main app header can be hidden here.
 */
export default function VariablesScreen({
  variables,
  setVariables,
  onBack,
  demoStories = [],
  activeDemoStoryId,
  onDemoStoryChange,
  onExport,
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

        <div
          className="variables-screen-topbar-demo"
          title="Loads a built-in demo into the editor and preview. If you changed the graph or variables, you will be asked to confirm before switching."
        >
          <label
            htmlFor="variables-screen-demo-select"
            className="variables-screen-demo-label"
          >
            Demo story
          </label>
          <select
            id="variables-screen-demo-select"
            className="form-select variables-screen-demo-select"
            value={activeDemoStoryId}
            onChange={onDemoStoryChange}
          >
            {demoStories.map((entry) => (
              <option key={entry.id} value={entry.id} title={entry.blurb}>
                [{entry.tier}] {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="variables-screen-topbar-actions">
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

      <div className="variables-screen-body">
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
            showHeading={false}
          />
        </section>
      </div>
    </div>
  );
}
