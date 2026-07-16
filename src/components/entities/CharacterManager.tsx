import type { ChangeEvent } from "react";
import type { UseStoryStateResult } from "../../hooks/useStoryState";
import type { StoryCharacter, StoryNode } from "../../types/story";
import {
  countCharacterReferences,
  type CharacterReferenceScanNode,
} from "../../utils/storyReferences";

export interface CharacterManagerProps {
  characters: StoryCharacter[];
  nodes: StoryNode[];
  onAddCharacter: UseStoryStateResult["addCharacter"];
  onUpdateCharacter: UseStoryStateResult["updateCharacter"];
  onDeleteCharacter: UseStoryStateResult["deleteCharacter"];
}

export default function CharacterManager({
  characters,
  nodes,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
}: CharacterManagerProps) {
  function handleDelete(character: StoryCharacter) {
    const refs = countCharacterReferences(
      character.id,
      nodes as CharacterReferenceScanNode[]
    );
    const message =
      refs > 0
        ? `"${character.name}" is used in ${refs} reference${refs === 1 ? "" : "s"} across your story. Delete anyway? Missing references will show as [Missing character].`
        : `Delete character "${character.name}"?`;

    if (!window.confirm(message)) return;
    onDeleteCharacter(character.id);
  }

  return (
    <div className="character-manager">
      <div className="character-manager__head">
        <h2 className="section-title">Characters</h2>
        <button
          type="button"
          className="onboarding-tour__next"
          onClick={onAddCharacter}
        >
          + New character
        </button>
      </div>

      {characters.length === 0 ? (
        <p className="sidebar-hint">No characters yet.</p>
      ) : (
        <ul className="character-list">
          {characters.map((character) => {
            const refs = countCharacterReferences(
              character.id,
              nodes as CharacterReferenceScanNode[]
            );

            return (
              <li key={character.id} className="character-card">
                <div className="character-card__grid">
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor={`char-name-${character.id}`}
                    >
                      Name
                    </label>
                    <input
                      id={`char-name-${character.id}`}
                      className="form-input"
                      value={character.name}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        onUpdateCharacter(character.id, {
                          name: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ID</label>
                    <input
                      className="form-input"
                      value={character.id}
                      readOnly
                    />
                  </div>

                  <div className="form-group character-card__notes">
                    <label
                      className="form-label"
                      htmlFor={`char-desc-${character.id}`}
                    >
                      Notes
                    </label>
                    <textarea
                      id={`char-desc-${character.id}`}
                      className="form-textarea character-card__textarea"
                      value={character.description || ""}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        onUpdateCharacter(character.id, {
                          description: event.target.value,
                        })
                      }
                      placeholder="Optional description for your reference"
                    />
                  </div>
                </div>

                <div className="character-card__footer">
                  <span className="character-card__refs muted">
                    {refs === 0
                      ? "Not referenced yet"
                      : `${refs} reference${refs === 1 ? "" : "s"} in story`}
                  </span>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(character)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
