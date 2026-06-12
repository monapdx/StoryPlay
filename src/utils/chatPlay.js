import { renderStoryText } from "./storyReferences";

/**
 * Split "Speaker: message" into parts. Outgoing lines use the fixed speaker "You".
 *
 * @param {string} line
 * @param {boolean} isYou
 * @returns {{ speaker: string | null, message: string }}
 */
export function splitChatLine(line, isYou = false) {
  if (isYou) {
    return {
      speaker: "You",
      message: line.replace(/^You:\s*/, "").trim(),
    };
  }

  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) {
    return { speaker: null, message: line.trim() };
  }

  const speaker = line.slice(0, colonIndex).trim();
  const message = line.slice(colonIndex + 1).trim();

  return {
    speaker: speaker || null,
    message,
  };
}

/**
 * Parse chat block content into ordered message lines.
 * Lines starting with "You:" are outgoing; all others are incoming.
 * Incoming lines use the first colon to separate speaker name from message.
 *
 * @param {string} content
 * @param {object} [storyState]
 * @returns {{ id: string, side: "incoming" | "outgoing", speaker: string | null, message: string }[]}
 */
export function parseChatLines(content = "", storyState = {}) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const isYou = line.startsWith("You:");
      const { speaker, message } = splitChatLine(line, isYou);

      return {
        id: `${index}-${speaker || "msg"}-${message}`,
        side: isYou ? "outgoing" : "incoming",
        speaker: speaker ? renderStoryText(speaker, storyState) : null,
        message: renderStoryText(message, storyState),
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

/**
 * Animate chat lines appearing one-by-one (typing indicator between reveals).
 *
 * @returns {() => void} cleanup — clears scheduled timers
 */
export function runChatLineRevealSequence({
  lines = [],
  onReveal,
  onTyping,
  onDone,
  timers = [],
}) {
  if (!lines.length) {
    onTyping?.(false);
    onDone?.();
    return () => {};
  }

  const timerIds = [];
  let cumulativeDelay = 450;

  lines.forEach((line, index) => {
    const typingStartId = window.setTimeout(() => {
      onTyping?.(true);
    }, cumulativeDelay);
    timerIds.push(typingStartId);

    const revealDelay =
      700 + Math.min(1200, Math.max(250, (line.message?.length || 0) * 22));

    const revealId = window.setTimeout(() => {
      onReveal?.(line, index);
      onTyping?.(index < lines.length - 1);
    }, cumulativeDelay + revealDelay);

    timerIds.push(revealId);
    cumulativeDelay += revealDelay + 260;
  });

  const finishId = window.setTimeout(() => {
    onTyping?.(false);
    onDone?.();
  }, cumulativeDelay);

  timerIds.push(finishId);
  timers.push(...timerIds);

  return () => {
    timerIds.forEach((timerId) => window.clearTimeout(timerId));
  };
}
