import { renderStoryText } from "../../utils/storyReferences";

/**
 * Renders a chat bubble body with an optional bold speaker label before the message.
 */
export default function ChatBubbleContent({
  speaker,
  message,
  storyState = {},
}) {
  const resolvedMessage = renderStoryText(message, storyState)?.trim() || "…";
  const resolvedSpeaker =
    speaker === "You"
      ? speaker
      : renderStoryText(speaker, storyState)?.trim() || "";

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
