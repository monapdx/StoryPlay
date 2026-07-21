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
  /** Stable, unique React Flow edge id for this outgoing link. */
  edgeId: string;
  /** React Flow source-handle id the edge should attach to / was dragged from. */
  sourceHandle: string;
  /** Present for `choice` links: the source choice's stable id. */
  choiceId?: string;
}

/** Minimal choice fields read when collecting outgoing links. */
interface NodeGraphChoiceSource {
  id?: unknown;
  targetNodeId?: unknown;
  label?: unknown;
  text?: unknown;
}

/** React Flow handle ids. Node connectors rely on these for routing. */
export const INPUT_HANDLE_ID = "input";
export const CONTINUE_HANDLE_ID = "continue";
export const CHOICE_HANDLE_PREFIX = "choice:";

/** Source-handle id for a specific choice (drag from this = edit that choice). */
export function makeChoiceHandleId(choiceId: string): string {
  return `${CHOICE_HANDLE_PREFIX}${choiceId}`;
}

/**
 * Stable edge id for a choice link, tied to the specific choice (not its array
 * index) so reordering/removing other choices never reassigns this edge.
 */
export function makeChoiceEdgeId(
  sourceNodeId: string,
  choiceId: string
): string {
  return `choice_${sourceNodeId}_${choiceId}`;
}

/**
 * Stable edge id for a non-choice node link. Includes the link kind so
 * continuation edges stay distinguishable from choice edges (and from each
 * other) even when several point at the same target.
 */
export function makeLinkEdgeId(
  kind: Exclude<NodeGraphLinkKind, "choice">,
  sourceNodeId: string,
  targetNodeId: string
): string {
  return `${kind}_${sourceNodeId}_${targetNodeId}`;
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
  sourceHandle: string;
  targetHandle: string;
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
  const sourceNodeId = (node?.id as string) ?? "";

  (data.choices || []).forEach((choice, index) => {
    if (blockType === "persuasion") return;

    const targetNodeId = choice?.targetNodeId;
    if (!targetNodeId) return;

    // Prefer the choice's stable id; fall back to a deterministic id for
    // un-normalized inputs so edges stay unique even without persisted ids.
    const choiceId =
      typeof choice?.id === "string" && choice.id.trim()
        ? choice.id
        : `${sourceNodeId}#c${index}`;

    links.push({
      // Truthy legacy ids / labels are kept as-is (historically not always strings).
      targetNodeId: targetNodeId as string,
      label: (choice.label || choice.text || `Choice ${index + 1}`) as string,
      kind: "choice",
      choiceId,
      edgeId: makeChoiceEdgeId(sourceNodeId, choiceId),
      sourceHandle: makeChoiceHandleId(choiceId),
    });
  });

  const continueNodeId = String(data.continueNodeId || "").trim();
  if (continueNodeId) {
    links.push({
      targetNodeId: continueNodeId,
      label: "Continue",
      kind: "continue",
      edgeId: makeLinkEdgeId("continue", sourceNodeId, continueNodeId),
      sourceHandle: CONTINUE_HANDLE_ID,
    });
  }

  const successNodeId = String(data.successNodeId || "").trim();
  if (successNodeId) {
    links.push({
      targetNodeId: successNodeId,
      label: "Success",
      kind: "success",
      edgeId: makeLinkEdgeId("success", sourceNodeId, successNodeId),
      sourceHandle: "success",
    });
  }

  const failureNodeId = String(data.failureNodeId || "").trim();
  if (failureNodeId) {
    links.push({
      targetNodeId: failureNodeId,
      label: "Failure",
      kind: "failure",
      edgeId: makeLinkEdgeId("failure", sourceNodeId, failureNodeId),
      sourceHandle: "failure",
    });
  }

  const timeoutTargetNodeId = String(data.timeoutTargetNodeId || "").trim();
  if (timeoutTargetNodeId) {
    links.push({
      targetNodeId: timeoutTargetNodeId,
      label: "Timeout",
      kind: "timeout",
      edgeId: makeLinkEdgeId("timeout", sourceNodeId, timeoutTargetNodeId),
      sourceHandle: "timeout",
    });
  }

  return links;
}

/**
 * Resolve an edge id back to its owning node + link so deletion targets the
 * exact source choice/link, rather than every choice sharing a targetNodeId.
 */
export interface ResolvedEdgeRef {
  sourceNodeId: string;
  kind: NodeGraphLinkKind;
  targetNodeId: string;
  choiceId?: string;
}

export function resolveEdgeRef(
  nodes: ReadonlyArray<NodeGraphLinkSource> | null | undefined,
  edgeId: string | null | undefined
): ResolvedEdgeRef | null {
  if (!edgeId) return null;

  for (const node of nodes || []) {
    const links = getNodeOutgoingLinks(node);
    for (const link of links) {
      if (link.edgeId === edgeId) {
        return {
          sourceNodeId: (node?.id as string) ?? "",
          kind: link.kind,
          targetNodeId: link.targetNodeId,
          choiceId: link.choiceId,
        };
      }
    }
  }

  return null;
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

    links.forEach((link) => {
      edges.push({
        // Stable id tied to the specific choice/link, unique even when
        // multiple choices from one source point at the same target.
        id: link.edgeId,
        // Missing ids stay undefined at runtime (same as the JS implementation).
        source: node.id as string,
        target: link.targetNodeId,
        // Attach to the specific source handle so choice edges and the generic
        // continuation edge stay visually and structurally distinct.
        sourceHandle: link.sourceHandle,
        targetHandle: INPUT_HANDLE_ID,
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
