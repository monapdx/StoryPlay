/**
 * Helpers for bulk choice creation and destination-node generation.
 * Mutates story state via useStoryState; edges stay derived from targetNodeId.
 */

export const CHOICE_PATH_MIN = 1;
export const CHOICE_PATH_MAX = 20;

const FAN_OUT_H_SPACING = 280;
const FAN_OUT_V_OFFSET = 200;
const COLLISION_MIN_DIST = 140;
const COLLISION_NUDGE_Y = 160;

/**
 * @param {unknown} raw
 * @returns {{ ok: true, count: number } | { ok: false, message: string }}
 */
export function parseChoiceCount(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return {
      ok: false,
      message: `Enter a whole number from ${CHOICE_PATH_MIN} to ${CHOICE_PATH_MAX}.`,
    };
  }

  if (typeof raw === "string" && !/^\s*-?\d+\s*$/.test(raw)) {
    return {
      ok: false,
      message: `Enter a whole number from ${CHOICE_PATH_MIN} to ${CHOICE_PATH_MAX}.`,
    };
  }

  const count = typeof raw === "number" ? raw : Number(String(raw).trim());

  if (!Number.isFinite(count) || !Number.isInteger(count)) {
    return {
      ok: false,
      message: `Enter a whole number from ${CHOICE_PATH_MIN} to ${CHOICE_PATH_MAX}.`,
    };
  }

  if (count < CHOICE_PATH_MIN || count > CHOICE_PATH_MAX) {
    return {
      ok: false,
      message: `Enter a whole number from ${CHOICE_PATH_MIN} to ${CHOICE_PATH_MAX}.`,
    };
  }

  return { ok: true, count };
}

export function isChoiceUnconnected(choice) {
  return !choice?.targetNodeId;
}

/**
 * Continue numbering from labels like "Choice 3", otherwise from current length.
 * @param {object[]} choices
 */
export function getNextChoiceLabelStart(choices = []) {
  let maxLabeled = 0;

  for (const choice of choices) {
    const match = String(choice?.label || "").match(/^Choice\s+(\d+)$/i);
    if (match) {
      maxLabeled = Math.max(maxLabeled, Number(match[1]));
    }
  }

  if (maxLabeled > 0) {
    return maxLabeled + 1;
  }

  return choices.length + 1;
}

export function createBlankGoToChoice(label) {
  return {
    label,
    choiceKind: "goTo",
    playerMessage: "",
    npcResponse: "",
    targetNodeId: "",
    conditions: [],
    effects: [],
  };
}

export function createNarrativeDestinationNode({ id, title, position }) {
  return {
    id,
    type: "storyNode",
    position: {
      x: position?.x ?? 0,
      y: position?.y ?? 0,
    },
    data: {
      title: title || "New Block",
      content: "Write your story text here.",
      blockType: "narrative",
      choices: [],
      enterEffects: [],
      graphIssues: [],
    },
  };
}

/**
 * Even fan-out centered under the source node.
 * @param {{ x?: number, y?: number }} sourcePosition
 * @param {number} count
 */
export function fanOutPositions(sourcePosition, count) {
  const sourceX = Number(sourcePosition?.x) || 0;
  const sourceY = Number(sourcePosition?.y) || 0;
  const safeCount = Math.max(0, count);

  if (safeCount === 0) return [];

  const positions = [];
  for (let index = 0; index < safeCount; index += 1) {
    const offset = index - (safeCount - 1) / 2;
    positions.push({
      x: sourceX + offset * FAN_OUT_H_SPACING,
      y: sourceY + FAN_OUT_V_OFFSET,
    });
  }

  return positions;
}

/**
 * Light collision nudge so destinations don't stack on nearby nodes.
 * @param {{ x: number, y: number }} desired
 * @param {{ x?: number, y?: number }[]} occupied
 */
export function resolveOpenPosition(desired, occupied = []) {
  let position = { x: desired.x, y: desired.y };

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const collides = occupied.some((point) => {
      const dx = (point?.x || 0) - position.x;
      const dy = (point?.y || 0) - position.y;
      return Math.hypot(dx, dy) < COLLISION_MIN_DIST;
    });

    if (!collides) {
      return position;
    }

    position = {
      x: position.x,
      y: position.y + COLLISION_NUDGE_Y,
    };
  }

  return position;
}
