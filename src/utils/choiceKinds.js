export const CHOICE_KIND = {
  CHAT_REPLY: "chatReply",
  GO_TO: "goTo",
};

/**
 * Resolve how a choice behaves during play.
 * Non-chat blocks always use go-to choices.
 */
export function getChoiceKind(choice, blockType = "narrative") {
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

export function isChatReplyChoice(choice, blockType = "narrative") {
  return getChoiceKind(choice, blockType) === CHOICE_KIND.CHAT_REPLY;
}

export function isGoToChoice(choice, blockType = "narrative") {
  return getChoiceKind(choice, blockType) === CHOICE_KIND.GO_TO;
}
