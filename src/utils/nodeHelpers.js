export function createNewNode(index = 0) {
  const id = crypto.randomUUID();

  return normalizeStoryNode({
    id,
    type: "storyNode",
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

export const DEFAULT_STORY_NODE_TYPE = "storyNode";

/**
 * Fill safe React Flow node defaults for editor, export, and import round-trip.
 * @param {unknown} node
 * @returns {object}
 */
export function normalizeStoryNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return {
      id: "node_invalid",
      type: DEFAULT_STORY_NODE_TYPE,
      position: { x: 0, y: 0 },
      data: { title: "Untitled", content: "", blockType: "narrative", choices: [] },
    };
  }

  const next = { ...node };

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
    next.position = {
      x: typeof next.position.x === "number" ? next.position.x : 0,
      y: typeof next.position.y === "number" ? next.position.y : 0,
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
    next.data = { ...next.data };
    if (!Array.isArray(next.data.choices)) {
      next.data.choices = [];
    }
    if (!Array.isArray(next.data.enterEffects)) {
      next.data.enterEffects = [];
    }
  }

  return next;
}

/**
 * @param {unknown[]} nodes
 * @returns {object[]}
 */
export function normalizeStoryNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => normalizeStoryNode(node));
}

export function createNewChoice() {
  return {
    id: crypto.randomUUID(),
    label: "New choice",
    targetNodeId: "",
  };
}