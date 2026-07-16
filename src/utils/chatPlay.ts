import {
  renderStoryText,
  type StoryRenderStateInput,
} from "./storyReferences";

/** Minimal chat-reply choice fields used for the player bubble label. */
interface ChatReplyChoiceSource {
  playerMessage?: unknown;
  label?: unknown;
}

export interface ChatLine {
  id: string;
  side: "incoming" | "outgoing";
  speaker: string | null;
  message: string;
}

export interface ChatLineRevealSequenceArgs<
  T extends { message?: string | null } = ChatLine,
> {
  lines?: readonly T[];
  onReveal?: (line: T, index: number) => void;
  onTyping?: (isTyping: boolean) => void;
  onDone?: () => void;
  timers?: number[];
}

/**
 * Text shown in the player's outgoing chat bubble for a chat-reply choice.
 * Falls back to the reply button label when no dedicated player message is set.
 */
export function getChatReplyPlayerText(
  choice?: ChatReplyChoiceSource | null,
  storyState: StoryRenderStateInput = {}
): string {
  const raw = String(choice?.playerMessage || choice?.label || "").trim();
  return renderStoryText(raw, storyState) || "Reply";
}

/**
 * Index of the colon that separates "Speaker" from "message", ignoring colons inside
 * {{reference:tokens}} (e.g. {{character:char_abc.name}}).
 */
export function findSpeakerMessageColonIndex(line: string): number {
  let inReferenceToken = false;

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "{" && line[index + 1] === "{") {
      inReferenceToken = true;
      index += 1;
      continue;
    }

    if (inReferenceToken && line[index] === "}" && line[index + 1] === "}") {
      inReferenceToken = false;
      index += 1;
      continue;
    }

    if (!inReferenceToken && line[index] === ":") {
      return index;
    }
  }

  return -1;
}

/**
 * Split "Speaker: message" into parts. Outgoing lines use the fixed speaker "You".
 */
export function splitChatLine(
  line: string,
  isYou = false
): { speaker: string | null; message: string } {
  if (isYou) {
    return {
      speaker: "You",
      message: line.replace(/^You:\s*/, "").trim(),
    };
  }

  const colonIndex = findSpeakerMessageColonIndex(line);
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
 */
export function parseChatLines(content = ""): ChatLine[] {
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
        speaker: speaker || null,
        message,
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
 */
export function getChatPrefaceLines<T extends { side: string }>(
  chatLines: T[] = [] as T[],
  hasReplyChoices = false
): T[] {
  if (!hasReplyChoices) return chatLines;

  const preface: T[] = [];
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
 * @returns cleanup — clears scheduled timers
 */
export function runChatLineRevealSequence<
  T extends { message?: string | null },
>({
  lines = [],
  onReveal,
  onTyping,
  onDone,
  timers = [],
}: ChatLineRevealSequenceArgs<T>): () => void {
  if (!lines.length) {
    onTyping?.(false);
    onDone?.();
    return () => {};
  }

  const timerIds: number[] = [];
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
