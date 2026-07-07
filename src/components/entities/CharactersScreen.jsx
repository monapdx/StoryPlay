import CharacterManager from "./CharacterManager";

export default function CharactersScreen({
  characters,
  nodes,
  onBack,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onOpenTemplates,
  activeTemplateLabel,
}) {
  return (
    <div className="variables-screen variables-screen--edgeless characters-screen">
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
            onClick={onOpenTemplates}
          >
            Example stories
          </button>
        </div>
      </div>

      <header className="variables-screen-hero">
        <h1 className="variables-screen-title">Characters</h1>
        <p className="variables-screen-subtitle">
          Reusable story entities · {characters.length}{" "}
          {characters.length === 1 ? "character" : "characters"}
        </p>
      </header>

      <div className="variables-screen-body variables-screen-body--single custom-scrollbar">
        <div className="variables-screen-main">
          <CharacterManager
            characters={characters}
            nodes={nodes}
            onAddCharacter={onAddCharacter}
            onUpdateCharacter={onUpdateCharacter}
            onDeleteCharacter={onDeleteCharacter}
          />
        </div>
      </div>
    </div>
  );
}
