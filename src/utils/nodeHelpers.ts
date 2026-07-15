import type { StoryChoice, StoryNode } from "../types/story";
import { STORY_NODE_TYPE } from "../types/story";

export function createNewNode(index = 0): StoryNode {
  const id = crypto.randomUUID();

  return normalizeStoryNode({
    id,
    type: STORY_NODE_TYPE,
    position: {
      x: 180 + (index % 3) * 220,
      y: 140 + (index % 4) * 120,
    },
    data: {
      title: "New Block",
      content: "Write your story text here.",
      blockType: "narrative",
      choices: [],
    },
  });
}

export const DEFAULT_STORY_NODE_TYPE = STORY_NODE_TYPE;

/**
 * Fill safe React Flow node defaults for editor, export, and import round-trip.
 */
export function normalizeStoryNode(node: unknown): StoryNode {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return {
      id: "node_invalid",
      type: DEFAULT_STORY_NODE_TYPE,
      position: { x: 0, y: 0 },
      data: {
        title: "Untitled",
        content: "",
        blockType: "narrative",
        choices: [],
      },
    };
  }

  const next = { ...(node as Record<string, unknown>) };

  if (typeof next.type !== "string" || !next.type.trim()) {
    next.type = DEFAULT_STORY_NODE_TYPE;
  }

  if (
    !next.position ||
    typeof next.position !== "object" ||
    Array.isArray(next.position)
  ) {
    next.position = { x: 0, y: 0 };
  } else {
    const position = next.position as Record<string, unknown>;
    next.position = {
      x: typeof position.x === "number" ? position.x : 0,
      y: typeof position.y === "number" ? position.y : 0,
    };
  }

  if (!next.data || typeof next.data !== "object" || Array.isArray(next.data)) {
    next.data = {
      title: "Untitled",
      content: "",
      blockType: "narrative",
      choices: [],
      enterEffects: [],
    };
  } else {
    const data = { ...(next.data as Record<string, unknown>) };
    if (!Array.isArray(data.choices)) {
      data.choices = [];
    }
    if (!Array.isArray(data.enterEffects)) {
      data.enterEffects = [];
    }
    next.data = data;
  }

  return next as unknown as StoryNode;
}

export function normalizeStoryNodes(nodes: unknown): StoryNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => normalizeStoryNode(node));
}

export function createNewChoice(): StoryChoice {
  return {
    id: crypto.randomUUID(),
    label: "New choice",
    targetNodeId: "",
  };
}
