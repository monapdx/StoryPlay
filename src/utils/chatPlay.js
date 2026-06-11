import { renderStoryText } from "./storyReferences";

/**
 * Parse chat block content into ordered message lines.
 * Lines starting with "You:" are outgoing; all others are incoming.
 *
 * @param {string} content
 * @param {object} [storyState]
 * @returns {{ id: string, side: "incoming" | "outgoing", text: string }[]}
 */
export function parseChatLines(content = "", storyState = {}) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const isYou = line.startsWith("You:");
      const text = isYou ? line.replace(/^You:\s*/, "") : line;

      return {
        id: `${index}-${text}`,
        side: isYou ? "outgoing" : "incoming",
        text: renderStoryText(text, storyState),
      };
    });
}

/**
 * Incoming lines to auto-play before showing reply choices.
 *
 * When the block has player choices, we stop the scripted animation before
 * the first "You:" line so the player picks their response from Choices.
 * If there is no "You:" line, only the first incoming line plays so the
 * player is not stuck watching a long passive script.
 *
 * @param {{ side: string }[]} chatLines
 * @param {boolean} hasReplyChoices
 */
export function getChatPrefaceLines(chatLines = [], hasReplyChoices = false) {
  if (!hasReplyChoices) return chatLines;

  const preface = [];
  for (const line of chatLines) {
    if (line.side === "outgoing") break;
    preface.push(line);
  }

  if (preface.length === 0) return [];

  const hasOutgoingLine = chatLines.some((line) => line.side === "outgoing");
  if (!hasOutgoingLine && preface.length > 1) {
    return [preface[0]];
  }

  return preface;
}
