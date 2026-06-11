import { renderStoryText } from "../../utils/storyReferences";

export default function ChatReplyPicker({
  choices,
  characters = [],
  selectedReplyIndex,
  onSelect,
}) {
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
            key={`${choice.targetNodeId}-${index}`}
            type="button"
            className="chat-reply-button"
            onClick={() => onSelect(choice, index)}
            disabled={selectedReplyIndex !== null}
          >
            {renderStoryText(choice.label, storyState) || "Reply"}
          </button>
        ))}
      </div>
    </div>
  );
}
