import type { StoryChoice, StoryNode } from "../types/story";
import { STORY_NODE_TYPE } from "../types/story";

/**
 * Generate a stable, unique id for a choice. Uses crypto.randomUUID when
 * available and falls back to a random string for older runtimes.
 */
export function createChoiceId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to non-crypto id */
  }
  return `choice_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/**
 * Ensure every choice has a stable `id` without touching its other data
 * (label, conditions, effects, targetNodeId, chat/persuasion fields, etc.).
 * Existing ids are preserved; only missing/blank ids are filled in.
 */
export function ensureChoiceIds(choices: unknown): StoryChoice[] {
  if (!Array.isArray(choices)) return [];

  return choices.map((choice) => {
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
      return { id: createChoiceId() } as StoryChoice;
    }

    const existing = choice as Record<string, unknown>;
    if (typeof existing.id === "string" && existing.id.trim()) {
      return existing as unknown as StoryChoice;
    }

    return { ...existing, id: createChoiceId() } as unknown as StoryChoice;
  });
}

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
    } else {
      // Assign stable ids to any legacy choices missing one, leaving all
      // other choice data (label, conditions, effects, targets) untouched.
      data.choices = ensureChoiceIds(data.choices);
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
    id: createChoiceId(),
    label: "New choice",
    targetNodeId: "",
  };
}
