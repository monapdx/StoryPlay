/**
 * Pure, node-id-based choice mutations for the story graph.
 *
 * Every function takes the target node id explicitly and returns a new nodes
 * array. Nothing here reads a "selected node" — mutations always apply to the
 * node whose id was passed in. This removes the stale-selection hazard where an
 * async selection update could send a choice to the previously selected node.
 */

import type { StoryChoice, StoryNode } from "../types/story";
import { createChoiceId } from "./nodeHelpers";
import { CHOICE_HANDLE_PREFIX, resolveEdgeRef } from "./nodeGraphLinks";

/** Direct/graph transition fields set by non-choice connectors. */
export type NodeLinkField =
  | "continueNodeId"
  | "successNodeId"
  | "failureNodeId"
  | "timeoutTargetNodeId";

const LINK_FIELD_BY_KIND: Record<string, NodeLinkField> = {
  continue: "continueNodeId",
  success: "successNodeId",
  failure: "failureNodeId",
  timeout: "timeoutTargetNodeId",
};

/** Minimal React Flow connection shape (kept dependency-light for pure utils). */
export interface GraphConnectionInput {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Align choiceKind with the node's block type.
 * Chat blocks always use chat replies; other blocks always use go-to.
 */
export function normalizeChoiceKindForBlockType(
  choice: StoryChoice,
  blockType: string = "narrative"
): StoryChoice {
  const nextKind = blockType === "chat" ? "chatReply" : "goTo";
  if (choice.choiceKind === nextKind) return choice;
  return { ...choice, choiceKind: nextKind };
}

/** Build a fresh blank choice for a node, matching its block type. */
export function makeAddedChoice(blockType: string = "narrative"): StoryChoice {
  const isChatBlock = blockType === "chat";
  return {
    id: createChoiceId(),
    label: isChatBlock ? "New reply" : "New Choice",
    choiceKind: isChatBlock ? "chatReply" : "goTo",
    playerMessage: "",
    npcResponse: "",
    targetNodeId: "",
    conditions: [],
    effects: [],
  };
}

/** Append a new blank choice to the node with `nodeId`. */
export function addChoiceToNodeInList(
  nodes: StoryNode[],
  nodeId: string
): StoryNode[] {
  if (!nodeId) return nodes;

  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const existingChoices = node.data?.choices || [];
    const blockType = node.data?.blockType || "narrative";

    return {
      ...node,
      data: {
        ...node.data,
        choices: [...existingChoices, makeAddedChoice(blockType)],
      },
    };
  });
}

/** Update a single field on choice `index` of the node with `nodeId`. */
export function updateChoiceOnNodeInList(
  nodes: StoryNode[],
  nodeId: string,
  index: number,
  field: string,
  value: unknown
): StoryNode[] {
  if (!nodeId) return nodes;

  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const nextChoices = [...(node.data?.choices || [])];
    const currentChoice = nextChoices[index];
    if (!currentChoice) return node;

    const blockType = node.data?.blockType || "narrative";
    nextChoices[index] = normalizeChoiceKindForBlockType(
      {
        ...currentChoice,
        [field]: value,
      },
      blockType
    );

    return {
      ...node,
      data: {
        ...node.data,
        choices: nextChoices,
      },
    };
  });
}

/**
 * When a node becomes a chat (or leaves chat), rewrite every choice's kind so
 * the editor and preview stay aligned without a Choice Type selector.
 */
export function applyBlockTypeToNodeChoices(
  nodes: StoryNode[],
  nodeId: string,
  blockType: string
): StoryNode[] {
  if (!nodeId) return nodes;

  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const existingChoices = node.data?.choices || [];
    const nextChoices = existingChoices.map((choice) =>
      normalizeChoiceKindForBlockType(choice, blockType)
    );

    const choicesChanged = nextChoices.some(
      (choice, index) => choice !== existingChoices[index]
    );

    return {
      ...node,
      data: {
        ...node.data,
        blockType,
        choices: choicesChanged ? nextChoices : existingChoices,
      },
    };
  });
}

/** Remove choice `index` from the node with `nodeId`. */
export function removeChoiceFromNodeInList(
  nodes: StoryNode[],
  nodeId: string,
  index: number
): StoryNode[] {
  if (!nodeId) return nodes;

  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const nextChoices = [...(node.data?.choices || [])];
    if (index < 0 || index >= nextChoices.length) return node;
    nextChoices.splice(index, 1);

    return {
      ...node,
      data: {
        ...node.data,
        choices: nextChoices,
      },
    };
  });
}

/**
 * Generic node connector: set the source node's direct/default transition
 * (`continueNodeId`). This does NOT create a player-visible choice — an edge and
 * a choice are different entities. Nothing on the source's `choices` is touched,
 * and neither node's title/content changes.
 */
export function connectDefaultTransitionInList(
  nodes: StoryNode[],
  sourceId: string,
  targetId: string
): StoryNode[] {
  if (!sourceId || !targetId || sourceId === targetId) return nodes;

  return nodes.map((node) => {
    if (node.id !== sourceId) return node;
    if (node.data?.continueNodeId === targetId) return node;

    return {
      ...node,
      data: {
        ...node.data,
        continueNodeId: targetId,
      },
    };
  });
}

/**
 * Choice-specific connector: point an already-existing choice at a destination.
 * Only that one choice's `targetNodeId` changes — no new choice is created and
 * sibling choices are left untouched.
 */
export function connectExistingChoiceInList(
  nodes: StoryNode[],
  sourceId: string,
  choiceId: string,
  targetId: string
): StoryNode[] {
  if (!sourceId || !choiceId || !targetId) return nodes;

  return nodes.map((node) => {
    if (node.id !== sourceId) return node;

    const existingChoices = node.data?.choices || [];
    let changed = false;
    const nextChoices = existingChoices.map((choice) => {
      if (choice.id !== choiceId) return choice;
      changed = true;
      return { ...choice, targetNodeId: targetId };
    });

    if (!changed) return node;

    return {
      ...node,
      data: {
        ...node.data,
        choices: nextChoices,
      },
    };
  });
}

/**
 * Specialized connector: set a single graph-link field
 * (success / failure / timeout / continue) on the source node. Never touches
 * `choices`.
 */
export function setSpecialNodeLinkInList(
  nodes: StoryNode[],
  sourceId: string,
  field: NodeLinkField,
  targetId: string
): StoryNode[] {
  if (!sourceId || !field || !targetId) return nodes;

  return nodes.map((node) => {
    if (node.id !== sourceId) return node;
    if (node.data?.[field] === targetId) return node;

    return {
      ...node,
      data: {
        ...node.data,
        [field]: targetId,
      },
    };
  });
}

/**
 * Route a React Flow connection to the correct mutation based on which source
 * handle it was dragged from. This is the single place that decides whether a
 * connector becomes a default transition, an existing-choice link, or a
 * specialized link — a generic drag never becomes a new choice.
 */
export function applyConnectionInList(
  nodes: StoryNode[],
  connection: GraphConnectionInput | null | undefined
): StoryNode[] {
  const sourceId = connection?.source || "";
  const targetId = connection?.target || "";
  const sourceHandle = connection?.sourceHandle || "";

  if (!sourceId || !targetId || sourceId === targetId) return nodes;

  if (sourceHandle.startsWith(CHOICE_HANDLE_PREFIX)) {
    const choiceId = sourceHandle.slice(CHOICE_HANDLE_PREFIX.length);
    return connectExistingChoiceInList(nodes, sourceId, choiceId, targetId);
  }

  if (sourceHandle === "success") {
    return setSpecialNodeLinkInList(nodes, sourceId, "successNodeId", targetId);
  }

  if (sourceHandle === "failure") {
    return setSpecialNodeLinkInList(nodes, sourceId, "failureNodeId", targetId);
  }

  if (sourceHandle === "timeout") {
    return setSpecialNodeLinkInList(
      nodes,
      sourceId,
      "timeoutTargetNodeId",
      targetId
    );
  }

  // Generic node handle (id "continue" or unspecified) → default transition.
  return connectDefaultTransitionInList(nodes, sourceId, targetId);
}

/**
 * Remove the exact link identified by `edgeId`. An edge and a choice are not the
 * same entity: deleting a choice edge clears only that choice's `targetNodeId`
 * (the choice stays as an unconnected player option), matched by its stable id.
 * Deleting a continuation / success / failure / timeout edge clears only that
 * single link field on the source node.
 */
export function removeEdgeFromList(
  nodes: StoryNode[],
  edgeId: string | null | undefined
): StoryNode[] {
  const ref = resolveEdgeRef(nodes, edgeId);
  if (!ref) return nodes;

  return nodes.map((node) => {
    if (node.id !== ref.sourceNodeId) return node;

    if (ref.kind === "choice") {
      const existingChoices = node.data?.choices || [];
      const nextChoices = existingChoices.map((choice) => {
        const matches = ref.choiceId
          ? choice.id === ref.choiceId
          : choice.targetNodeId === ref.targetNodeId;
        if (!matches) return choice;
        return { ...choice, targetNodeId: "" };
      });

      return {
        ...node,
        data: {
          ...node.data,
          choices: nextChoices,
        },
      };
    }

    const field = LINK_FIELD_BY_KIND[ref.kind];
    if (!field) return node;

    return {
      ...node,
      data: {
        ...node.data,
        [field]: "",
      },
    };
  });
}
