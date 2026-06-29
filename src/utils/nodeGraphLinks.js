import { getChoiceKind, CHOICE_KIND } from "./choiceKinds";

/**
 * @typedef {{
 *   targetNodeId: string,
 *   label: string,
 *   kind: "choice" | "continue" | "success" | "failure" | "timeout"
 * }} NodeGraphLink
 */

const MINI_GAME_BLOCK_TYPES = new Set([
  "traitPicker",
  "persuasion",
  "choiceWeighting",
]);

/**
 * @param {object | null | undefined} node
 * @returns {NodeGraphLink[]}
 */
export function getNodeOutgoingLinks(node) {
  const links = [];
  const data = node?.data || {};
  const blockType = data.blockType || "narrative";

  (data.choices || []).forEach((choice, index) => {
    if (blockType === "persuasion") return;

    const targetNodeId = choice?.targetNodeId;
    if (!targetNodeId) return;

    links.push({
      targetNodeId,
      label: choice.label || choice.text || `Choice ${index + 1}`,
      kind: "choice",
    });
  });

  const continueNodeId = String(data.continueNodeId || "").trim();
  if (continueNodeId) {
    links.push({
      targetNodeId: continueNodeId,
      label: "Continue",
      kind: "continue",
    });
  }

  const successNodeId = String(data.successNodeId || "").trim();
  if (successNodeId) {
    links.push({
      targetNodeId: successNodeId,
      label: "Success",
      kind: "success",
    });
  }

  const failureNodeId = String(data.failureNodeId || "").trim();
  if (failureNodeId) {
    links.push({
      targetNodeId: failureNodeId,
      label: "Failure",
      kind: "failure",
    });
  }

  const timeoutTargetNodeId = String(data.timeoutTargetNodeId || "").trim();
  if (timeoutTargetNodeId) {
    links.push({
      targetNodeId: timeoutTargetNodeId,
      label: "Timeout",
      kind: "timeout",
    });
  }

  return links;
}

/**
 * @param {object | null | undefined} node
 * @returns {boolean}
 */
export function nodeHasOutgoingLinks(node) {
  const blockType = node?.data?.blockType || "narrative";
  if (blockType === "ending") return true;
  return getNodeOutgoingLinks(node).length > 0;
}

/**
 * @param {object | null | undefined} node
 * @returns {boolean}
 */
export function isMiniGameBlockType(node) {
  const blockType = node?.data?.blockType || "narrative";
  return MINI_GAME_BLOCK_TYPES.has(blockType);
}

/**
 * Branching choices that require a targetNodeId in diagnostics.
 * Persuasion lines and mini-game option rows are excluded.
 *
 * @param {object} choice
 * @param {string} blockType
 */
export function isBranchingGoToChoice(choice, blockType = "narrative") {
  if (blockType === "persuasion" || isMiniGameBlockType({ data: { blockType } })) {
    return false;
  }
  return getChoiceKind(choice, blockType) === CHOICE_KIND.GO_TO;
}

/**
 * Build React Flow edges from story nodes, including mini-game block links.
 *
 * @param {unknown[]} nodes
 * @param {(text: string, context: object) => string} [renderLabel]
 * @param {object} [renderContext]
 * @returns {object[]}
 */
export function buildStoryEdgesFromNodes(
  nodes,
  renderLabel = (text) => text || "",
  renderContext = {}
) {
  const edges = [];

  for (const node of nodes || []) {
    const links = getNodeOutgoingLinks(node);

    links.forEach((link, index) => {
      edges.push({
        id: `${node.id}__${link.targetNodeId}__${link.kind}__${index}`,
        source: node.id,
        target: link.targetNodeId,
        type: "storyEdge",
        data: {
          label: renderLabel(link.label, renderContext),
          linkKind: link.kind,
        },
      });
    });
  }

  return edges;
}
