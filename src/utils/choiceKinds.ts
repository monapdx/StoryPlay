import type { ChoiceKind } from "../types/choiceKinds";

export type { ChoiceKind };

export const CHOICE_KIND = {
  CHAT_REPLY: "chatReply",
  GO_TO: "goTo",
} as const satisfies Record<string, ChoiceKind>;

/** Minimal fields used to resolve choice kind — not the full choice model. */
export interface ChoiceKindSource {
  choiceKind?: string | null;
  npcResponse?: string | null;
}

/**
 * Resolve how a choice behaves during play.
 *
 * Non-chat blocks always use go-to choices.
 * Chat blocks treat every choice as a chat reply unless it is explicitly marked
 * `goTo` (legacy instant exits). Empty npcResponse no longer flips a chat choice
 * into a normal go-to — that was the main source of awkward chat authoring.
 */
export function getChoiceKind(
  choice?: ChoiceKindSource | null,
  blockType: string = "narrative"
): ChoiceKind {
  if (blockType !== "chat") {
    return CHOICE_KIND.GO_TO;
  }

  if (choice?.choiceKind === CHOICE_KIND.GO_TO) {
    return CHOICE_KIND.GO_TO;
  }

  return CHOICE_KIND.CHAT_REPLY;
}

export function isChatReplyChoice(
  choice?: ChoiceKindSource | null,
  blockType: string = "narrative"
): boolean {
  return getChoiceKind(choice, blockType) === CHOICE_KIND.CHAT_REPLY;
}

export function isGoToChoice(
  choice?: ChoiceKindSource | null,
  blockType: string = "narrative"
): boolean {
  return getChoiceKind(choice, blockType) === CHOICE_KIND.GO_TO;
}
