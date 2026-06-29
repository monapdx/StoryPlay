import { STORY_REFERENCE_TOKEN_REGEX } from "./storyReferences";

/** @typedef {{ label: string, description: string, icon: string }} PlayerVariableDisplay */

const KNOWN_DISPLAY = /** @type {Record<string, PlayerVariableDisplay>} */ ({
  reputation: {
    label: "Reputation",
    description: "How the guild sees you",
    icon: "✦",
  },
  coins: {
    label: "Coin purse",
    description: "Silver you can spend",
    icon: "🪙",
  },
  gold: {
    label: "Gold",
    description: "Coins in your pocket",
    icon: "🪙",
  },
  health: {
    label: "Health",
    description: "Your current vitality",
    icon: "❤️",
  },
  hasKey: {
    label: "Rusty key",
    description: "A key from the desk",
    icon: "🔑",
  },
  pitchScore: {
    label: "Pitch momentum",
    description: "How the conversation is going",
    icon: "📈",
  },
  wonPitch: {
    label: "Guild verdict",
    description: "Whether you passed the pitch",
    icon: "⚖️",
  },
  buildFocus: {
    label: "Training focus",
    description: "Angles you emphasized at signup",
    icon: "🎯",
  },
  prepAllocation: {
    label: "Preparation plan",
    description: "How you split tonight's training",
    icon: "📋",
  },
  prep_combat: {
    label: "Combat drills",
    description: "Hours spent on steel and footwork",
    icon: "⚔️",
  },
  prep_social: {
    label: "Social recon",
    description: "Time reading the room",
    icon: "🗣️",
  },
  prep_lore: {
    label: "Lore & maps",
    description: "Study of routes and histories",
    icon: "📜",
  },
});

const PREP_SUFFIX_LABELS = {
  combat: "Combat drills",
  social: "Social recon",
  lore: "Lore & maps",
};

/**
 * @param {string} key
 */
function humanizeVariableKey(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * @param {unknown} value
 */
export function isEmptyPlayerStatValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  if (typeof value === "boolean") return value === false;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * @param {unknown[]} nodes
 * @param {string} variableKey
 * @returns {PlayerVariableDisplay | null}
 */
function lookupDisplayFromNodes(nodes, variableKey) {
  for (const node of nodes || []) {
    const data = node?.data || {};
    const prefix = data.variablePrefix;

    if (data.blockType === "choiceWeighting" && prefix) {
      for (const option of data.options || []) {
        const optionKey = `${prefix}${option.id}`;
        if (optionKey === variableKey) {
          return {
            label: option.label || humanizeVariableKey(option.id),
            description: "Preparation you assigned",
            icon: "📊",
          };
        }
      }
    }

    if (data.blockType === "traitPicker" && data.traitListVariable === variableKey) {
      return {
        label: data.title || humanizeVariableKey(variableKey),
        description: "Traits you chose to emphasize",
        icon: "🎯",
      };
    }
  }

  if (variableKey.startsWith("prep_")) {
    const suffix = variableKey.slice("prep_".length);
    const label = PREP_SUFFIX_LABELS[suffix];
    if (label) {
      return {
        label,
        description: "Preparation you assigned",
        icon: "📊",
      };
    }
  }

  return null;
}

/**
 * @param {string} key
 * @param {unknown[]} [nodes]
 * @param {Record<string, import("./storyVariables").VariablePlayerMeta>} [variableMeta]
 * @returns {PlayerVariableDisplay}
 */
export function getPlayerVariableDisplay(key, nodes = [], variableMeta = {}) {
  const authored = variableMeta?.[key];
  if (authored?.playerLabel) {
    return {
      label: authored.playerLabel,
      description: authored.playerDescription || "Story progress",
      icon: authored.icon || "◆",
    };
  }

  if (KNOWN_DISPLAY[key]) {
    return KNOWN_DISPLAY[key];
  }

  const fromNodes = lookupDisplayFromNodes(nodes, key);
  if (fromNodes) return fromNodes;

  return {
    label: humanizeVariableKey(key),
    description: "Story progress",
    icon: "◆",
  };
}

/**
 * Collect variable keys referenced in a node's authoring data.
 * @param {object | null | undefined} node
 * @returns {string[]}
 */
export function getNodeVariableExposure(node) {
  const keys = new Set();
  const data = node?.data || {};

  const textFields = [
    data.title,
    data.content,
    data.prompt,
    data.targetName,
  ];

  for (const text of textFields) {
    collectVariableTokensFromText(text, keys);
  }

  for (const effect of data.enterEffects || []) {
    if (effect?.variable) keys.add(effect.variable);
  }

  for (const choice of data.choices || []) {
    for (const condition of choice?.conditions || []) {
      if (condition?.variable) keys.add(condition.variable);
    }
    for (const effect of choice?.effects || []) {
      if (effect?.variable) keys.add(effect.variable);
    }
    collectVariableTokensFromText(choice?.label, keys);
    collectVariableTokensFromText(choice?.playerMessage, keys);
    collectVariableTokensFromText(choice?.npcResponse, keys);
    collectVariableTokensFromText(choice?.response, keys);
  }

  for (const option of data.options || []) {
    collectVariableTokensFromText(option?.label, keys);
    collectVariableTokensFromText(option?.description, keys);
  }

  if (data.traitListVariable) keys.add(data.traitListVariable);
  if (data.scoreVariable) keys.add(data.scoreVariable);
  if (data.successVariable) keys.add(data.successVariable);
  if (data.resultVariable) keys.add(data.resultVariable);

  if (data.blockType === "choiceWeighting" && data.variablePrefix) {
    for (const option of data.options || []) {
      if (option?.id) keys.add(`${data.variablePrefix}${option.id}`);
    }
  }

  if (data.blockType === "timed" && data.timeoutTargetNodeId) {
  }

  for (const effect of data.timeoutEffects || []) {
    if (effect?.variable) keys.add(effect.variable);
  }

  return [...keys];
}

/**
 * @param {unknown} text
 * @param {Set<string>} keys
 */
function collectVariableTokensFromText(text, keys) {
  if (typeof text !== "string" || !text.includes("{{")) return;

  const regex = new RegExp(STORY_REFERENCE_TOKEN_REGEX.source, "g");
  let match;
  while ((match = regex.exec(text)) !== null) {
    const type = match[1];
    const id = match[2];
    if (type === "variable" && id) keys.add(id);
    if (type === "player" && match[3] === "name") {
      keys.add("playerName");
      keys.add("player_name");
    }
  }
}

/**
 * @param {Record<string, unknown>} initialVariables
 * @returns {string[]}
 */
export function getInitiallyRevealedVariableKeys(initialVariables = {}) {
  return Object.entries(initialVariables)
    .filter(([, value]) => !isEmptyPlayerStatValue(value))
    .map(([key]) => key);
}

/**
 * @param {object} params
 * @param {Record<string, unknown>} params.playVariables
 * @param {Record<string, unknown>} params.initialVariables
 * @param {string[]} params.revealedKeys
 * @param {string[]} [params.activeNodeExposure]
 * @param {unknown[]} [params.nodes]
 * @param {Record<string, import("./storyVariables").VariablePlayerMeta>} [params.variableMeta]
 * @returns {Array<{ key: string, value: unknown, display: PlayerVariableDisplay }>}
 */
export function getVisiblePlayerStats({
  playVariables = {},
  initialVariables = {},
  revealedKeys = [],
  activeNodeExposure = [],
  nodes = [],
  variableMeta = {},
}) {
  const revealed = new Set(revealedKeys);
  const activeExposure = new Set(activeNodeExposure);
  const keys = new Set([
    ...Object.keys(initialVariables || {}),
    ...Object.keys(playVariables || {}),
  ]);

  const visible = [];

  for (const key of keys) {
    const value = Object.prototype.hasOwnProperty.call(playVariables, key)
      ? playVariables[key]
      : initialVariables[key];

    const revealedByStory = revealed.has(key);
    const hasValue = !isEmptyPlayerStatValue(value);
    const activeInScene = activeExposure.has(key);

    if (!hasValue && !(revealedByStory && activeInScene)) continue;

    visible.push({
      key,
      value,
      display: getPlayerVariableDisplay(key, nodes, variableMeta),
    });
  }

  return visible.sort((a, b) => a.display.label.localeCompare(b.display.label));
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {unknown[]} [nodes]
 * @param {Record<string, import("./storyVariables").VariablePlayerMeta>} [variableMeta]
 */
export function formatPlayerStatValue(key, value, nodes = [], variableMeta = {}) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => humanizeVariableKey(String(item)))
      .join(", ");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, amount]) => Number(amount) > 0);
    if (entries.length === 0) return "—";

    return entries
      .map(([part, amount]) => {
        const fullKey = key === "prepAllocation" ? `prep_${part}` : part;
        const label = getPlayerVariableDisplay(fullKey, nodes, variableMeta).label;
        return `${label}: ${amount}`;
      })
      .join(" · ");
  }

  if (typeof value === "number") return String(value);
  return String(value ?? "—");
}
