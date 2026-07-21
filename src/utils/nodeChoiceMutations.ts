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
import { resolveEdgeRef } from "./nodeGraphLinks";

const LINK_FIELD_BY_KIND: Record<string, keyof StoryNode["data"]> = {
  continue: "continueNodeId",
  success: "successNodeId",
  failure: "failureNodeId",
  timeout: "timeoutTargetNodeId",
};

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

    nextChoices[index] = {
      ...currentChoice,
      [field]: value,
    };

    return {
      ...node,
      data: {
        ...node.data,
        choices: nextChoices,
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
 * Add a go-to choice on `sourceId` pointing at `targetId`. Skips creation if a
 * choice on the source already targets that node. Only the source node is
 * mutated — connecting A→B never adds a choice to B.
 */
export function connectNodesInList(
  nodes: StoryNode[],
  sourceId: string,
  targetId: string
): StoryNode[] {
  if (!sourceId || !targetId || sourceId === targetId) return nodes;

  const targetNode = nodes.find((node) => node.id === targetId);
  const targetTitle = targetNode?.data?.title || "Next Block";

  return nodes.map((node) => {
    if (node.id !== sourceId) return node;

    const existingChoices = node.data?.choices || [];
    const alreadyExists = existingChoices.some(
      (choice) => choice.targetNodeId === targetId
    );
    if (alreadyExists) return node;

    const nextChoice: StoryChoice = {
      id: createChoiceId(),
      label: `Go to ${targetTitle}`,
      targetNodeId: targetId,
      conditions: [],
      effects: [],
    };

    return {
      ...node,
      data: {
        ...node.data,
        choices: [...existingChoices, nextChoice],
      },
    };
  });
}

/**
 * Remove the exact link identified by `edgeId`. For choice edges this removes
 * only the owning choice (matched by its stable id), so deleting one of several
 * edges that share a source/target pair leaves the other choices intact. For
 * mini-game/timed links it clears the specific link field on the source node.
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
      const nextChoices = ref.choiceId
        ? existingChoices.filter((choice) => choice.id !== ref.choiceId)
        : existingChoices.filter(
            (choice) => choice.targetNodeId !== ref.targetNodeId
          );

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
