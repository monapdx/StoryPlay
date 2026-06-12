/**
 * Renders a chat bubble body with an optional bold speaker label before the message.
 */
export default function ChatBubbleContent({ speaker, message }) {
  const body = message?.trim() ? message : "…";

  if (!speaker?.trim()) {
    return <span className="chat-bubble__message">{body}</span>;
  }

  return (
    <>
      <span className="chat-bubble__speaker">{speaker.trim()}:</span>{" "}
      <span className="chat-bubble__message">{body}</span>
    </>
  );
}
