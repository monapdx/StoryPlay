import { useId, useRef } from "react";
import {
  buildCharacterNameToken,
  renderStoryText,
} from "../../utils/storyReferences";
import type { StoryCharacter } from "../../types/storyCore";

interface ReferenceTextareaProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  characters?: StoryCharacter[];
  placeholder?: string;
  className?: string;
  insertLabel?: string;
  previewLabel?: string;
}

export default function ReferenceTextarea({
  id,
  value,
  onChange,
  characters = [],
  placeholder,
  className = "form-textarea",
  insertLabel = "Insert character",
  previewLabel = "Preview",
}: ReferenceTextareaProps) {
  const characterSelectId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertCharacterReference(characterId: string) {
    if (!characterId || !textareaRef.current) return;

    const token = buildCharacterNameToken(characterId);
    const field = textareaRef.current;
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      field.focus();
      const cursor = start + token.length;
      field.setSelectionRange(cursor, cursor);
    });
  }

  const renderContext = { characters };
  const preview = renderStoryText(value || "", renderContext);
  const showPreview = Boolean(value?.includes?.("{{"));

  return (
    <div className="reference-textarea">
      <textarea
        id={id}
        ref={textareaRef}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />

      {characters.length > 0 && (
        <div className="reference-textarea__toolbar">
          <label
            className="reference-textarea__insert-label"
            htmlFor={characterSelectId}
          >
            {insertLabel}
          </label>
          <select
            id={characterSelectId}
            className="form-select reference-textarea__select"
            defaultValue=""
            onChange={(event) => {
              const characterId = event.target.value;
              if (!characterId) return;
              insertCharacterReference(characterId);
              event.target.value = "";
            }}
          >
            <option value="">Choose character…</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name || "Unnamed"}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPreview && (
        <div className="reference-textarea__preview">
          <span className="reference-textarea__preview-label">
            {previewLabel}
          </span>
          <p className="reference-textarea__preview-text">{preview || "—"}</p>
        </div>
      )}
    </div>
  );
}
