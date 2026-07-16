import type { MiniGameBlockType } from "../types/minigames";
import { getChoiceKind, CHOICE_KIND, type ChoiceKindSource } from "./choiceKinds";

export type NodeGraphLinkKind =
  | "choice"
  | "continue"
  | "success"
  | "failure"
  | "timeout";

export interface NodeGraphLink {
  targetNodeId: string;
  label: string;
  kind: NodeGraphLinkKind;
}

/** Minimal choice fields read when collecting outgoing links. */
interface NodeGraphChoiceSource {
  targetNodeId?: unknown;
  label?: unknown;
  text?: unknown;
}

/** Minimal node shape read for outgoing graph links / edge building. */
export interface NodeGraphLinkSource {
  id?: string;
  data?: {
    blockType?: string | null;
    choices?: ReadonlyArray<NodeGraphChoiceSource | null | undefined> | null;
    continueNodeId?: unknown;
    successNodeId?: unknown;
    failureNodeId?: unknown;
    timeoutTargetNodeId?: unknown;
  } | null;
}

export interface StoryGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "storyEdge";
  data: {
    label: string;
    linkKind: NodeGraphLinkKind;
  };
}

const MINI_GAME_BLOCK_TYPES: ReadonlySet<string> = new Set<MiniGameBlockType>([
  "traitPicker",
  "persuasion",
  "choiceWeighting",
]);

export function getNodeOutgoingLinks(
  node: NodeGraphLinkSource | null | undefined
): NodeGraphLink[] {
  const links: NodeGraphLink[] = [];
  const data = node?.data || {};
  const blockType = data.blockType || "narrative";

  (data.choices || []).forEach((choice, index) => {
    if (blockType === "persuasion") return;

    const targetNodeId = choice?.targetNodeId;
    if (!targetNodeId) return;

    links.push({
      // Truthy legacy ids / labels are kept as-is (historically not always strings).
      targetNodeId: targetNodeId as string,
      label: (choice.label || choice.text || `Choice ${index + 1}`) as string,
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

export function nodeHasOutgoingLinks(
  node: NodeGraphLinkSource | null | undefined
): boolean {
  const blockType = node?.data?.blockType || "narrative";
  if (blockType === "ending") return true;
  return getNodeOutgoingLinks(node).length > 0;
}

export function isMiniGameBlockType(
  node: NodeGraphLinkSource | null | undefined
): boolean {
  const blockType = node?.data?.blockType || "narrative";
  return MINI_GAME_BLOCK_TYPES.has(blockType);
}

/**
 * Branching choices that require a targetNodeId in diagnostics.
 * Persuasion lines and mini-game option rows are excluded.
 */
export function isBranchingGoToChoice(
  choice?: ChoiceKindSource | null,
  blockType: string = "narrative"
): boolean {
  if (
    blockType === "persuasion" ||
    isMiniGameBlockType({ data: { blockType } })
  ) {
    return false;
  }
  return getChoiceKind(choice, blockType) === CHOICE_KIND.GO_TO;
}

/**
 * Build React Flow edges from story nodes, including mini-game block links.
 */
export function buildStoryEdgesFromNodes(
  nodes: ReadonlyArray<NodeGraphLinkSource> | null | undefined,
  renderLabel: (text: string, context: object) => string = (text) => text || "",
  renderContext: object = {}
): StoryGraphEdge[] {
  const edges: StoryGraphEdge[] = [];

  for (const node of nodes || []) {
    const links = getNodeOutgoingLinks(node);

    links.forEach((link, index) => {
      edges.push({
        id: `${node.id}__${link.targetNodeId}__${link.kind}__${index}`,
        // Missing ids stay undefined at runtime (same as the JS implementation).
        source: node.id as string,
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
