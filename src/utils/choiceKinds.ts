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
 * Non-chat blocks always use go-to choices.
 */
export function getChoiceKind(
  choice?: ChoiceKindSource | null,
  blockType: string = "narrative"
): ChoiceKind {
  if (choice?.choiceKind === CHOICE_KIND.CHAT_REPLY) {
    return CHOICE_KIND.CHAT_REPLY;
  }
  if (choice?.choiceKind === CHOICE_KIND.GO_TO) {
    return CHOICE_KIND.GO_TO;
  }

  if (blockType !== "chat") {
    return CHOICE_KIND.GO_TO;
  }

  if (String(choice?.npcResponse || "").trim()) {
    return CHOICE_KIND.CHAT_REPLY;
  }

  return CHOICE_KIND.GO_TO;
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
