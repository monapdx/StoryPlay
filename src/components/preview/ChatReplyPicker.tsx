import { renderStoryText } from "../../utils/storyReferences";
import type { StoryCharacter } from "../../types/storyCore";

/** Minimal choice fields rendered by the reply picker buttons. */
interface ChatReplyPickerChoice {
  id?: string;
  label?: unknown;
}

interface ChatReplyPickerProps<T extends ChatReplyPickerChoice = ChatReplyPickerChoice> {
  choices: T[];
  characters?: StoryCharacter[];
  disabled?: boolean;
  onSelect: (choice: T) => void;
}

export default function ChatReplyPicker<
  T extends ChatReplyPickerChoice = ChatReplyPickerChoice,
>({
  choices,
  characters = [],
  disabled = false,
  onSelect,
}: ChatReplyPickerProps<T>) {
  if (choices.length === 0) return null;

  const storyState = { characters };
  const twoUp = choices.length === 2;

  return (
    <div className="chat-reply-panel chat-reply-panel--active">
      <p className="chat-reply-prompt">Choose your reply</p>
      <div
        className={[
          "chat-reply-list",
          twoUp ? "chat-reply-list--two-up" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {choices.map((choice, index) => (
          <button
            key={`${choice.id || choice.label}-${index}`}
            type="button"
            className="chat-reply-button"
            onClick={() => onSelect(choice)}
            disabled={disabled}
          >
            {renderStoryText(choice.label, storyState) || "Reply"}
          </button>
        ))}
      </div>
    </div>
  );
}
