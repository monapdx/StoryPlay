import { renderStoryText } from "../../utils/storyReferences";
import type { StoryCharacter, StoryVariables } from "../../types/storyCore";

/**
 * Render context passed into chat bubble text resolution.
 * Matches the storyState shape documented on renderStoryText / getStoryRenderContext.
 */
interface StoryRenderState {
  characters?: StoryCharacter[];
  variables?: StoryVariables;
}

interface ChatBubbleContentProps {
  speaker?: string | null;
  message?: string | null;
  storyState?: StoryRenderState;
}

/**
 * Renders a chat bubble body with an optional bold speaker label before the message.
 */
export default function ChatBubbleContent({
  speaker,
  message,
  storyState = {},
}: ChatBubbleContentProps) {
  // renderStoryText JSDoc says string; runtime accepts null/non-string.
  const resolvedMessage =
    renderStoryText(message as string, storyState)?.trim() || "…";
  const resolvedSpeaker =
    speaker === "You"
      ? speaker
      : renderStoryText(speaker as string, storyState)?.trim() || "";

  if (!resolvedSpeaker) {
    return <span className="chat-bubble__message">{resolvedMessage}</span>;
  }

  return (
    <>
      <span className="chat-bubble__speaker">{resolvedSpeaker}:</span>{" "}
      <span className="chat-bubble__message">{resolvedMessage}</span>
    </>
  );
}
