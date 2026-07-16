import type { StoryNodeData } from "../types/story";
import type {
  StoryVariables,
  VariableMetaMap,
  VariablePlayerMeta,
} from "../types/storyCore";
import { STORY_REFERENCE_TOKEN_REGEX } from "./storyReferences";

export interface PlayerVariableDisplay {
  label: string;
  description: string;
  icon: string;
}

export interface VisiblePlayerStat {
  key: string;
  value: unknown;
  display: PlayerVariableDisplay;
}

export interface GetVisiblePlayerStatsParams {
  playVariables?: StoryVariables;
  initialVariables?: StoryVariables;
  revealedKeys?: string[];
  activeNodeExposure?: string[];
  nodes?: ReadonlyArray<PlayerStatNodeSource | null | undefined>;
  variableMeta?: VariableMetaMap;
}

/**
 * Minimal node shape for player-stat exposure / display lookup.
 * Compatible with StoryNode; data and option rows stay loose for legacy graphs.
 */
export interface PlayerStatNodeSource {
  data?: StoryNodeData | null;
}

const KNOWN_DISPLAY: Record<string, PlayerVariableDisplay> = {
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
};

const PREP_SUFFIX_LABELS: Record<string, string> = {
  combat: "Combat drills",
  social: "Social recon",
  lore: "Lore & maps",
};

/** Option row fields read from `data.options` (typed as unknown[] on StoryNodeData). */
interface PlayerStatOptionSource {
  id?: unknown;
  label?: unknown;
  description?: unknown;
}

function humanizeVariableKey(key: unknown): string {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isEmptyPlayerStatValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  if (typeof value === "boolean") return value === false;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function lookupDisplayFromNodes(
  nodes: ReadonlyArray<PlayerStatNodeSource | null | undefined> | null | undefined,
  variableKey: string
): PlayerVariableDisplay | null {
  for (const node of nodes || []) {
    const data = node?.data || {};
    const prefix = data.variablePrefix;

    if (data.blockType === "choiceWeighting" && prefix) {
      for (const rawOption of data.options || []) {
        const option = rawOption as PlayerStatOptionSource;
        const optionKey = `${prefix}${option.id}`;
        if (optionKey === variableKey) {
          return {
            label: (option.label ||
              humanizeVariableKey(option.id)) as string,
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

export function getPlayerVariableDisplay(
  key: string,
  nodes: ReadonlyArray<PlayerStatNodeSource | null | undefined> = [],
  variableMeta: VariableMetaMap = {}
): PlayerVariableDisplay {
  const authored: VariablePlayerMeta | undefined = variableMeta?.[key];
  if (authored?.playerLabel) {
    return {
      label: authored.playerLabel,
      description: authored.playerDescription || "Story progress",
      icon: authored.icon || "◆",
    };
  }

  const known = KNOWN_DISPLAY[key];
  if (known) {
    return known;
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
 */
export function getNodeVariableExposure(
  node: PlayerStatNodeSource | null | undefined
): string[] {
  const keys = new Set<string>();
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

  for (const rawOption of data.options || []) {
    const option = rawOption as PlayerStatOptionSource | null | undefined;
    collectVariableTokensFromText(option?.label, keys);
    collectVariableTokensFromText(option?.description, keys);
  }

  if (data.traitListVariable) keys.add(data.traitListVariable);
  if (data.scoreVariable) keys.add(data.scoreVariable);
  if (data.successVariable) keys.add(data.successVariable);
  if (data.resultVariable) keys.add(data.resultVariable);

  if (data.blockType === "choiceWeighting" && data.variablePrefix) {
    for (const rawOption of data.options || []) {
      const option = rawOption as PlayerStatOptionSource | null | undefined;
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

function collectVariableTokensFromText(text: unknown, keys: Set<string>) {
  if (typeof text !== "string" || !text.includes("{{")) return;

  const regex = new RegExp(STORY_REFERENCE_TOKEN_REGEX.source, "g");
  let match: RegExpExecArray | null;
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

export function getInitiallyRevealedVariableKeys(
  initialVariables: StoryVariables = {}
): string[] {
  return Object.entries(initialVariables)
    .filter(([, value]) => !isEmptyPlayerStatValue(value))
    .map(([key]) => key);
}

export function getVisiblePlayerStats({
  playVariables = {},
  initialVariables = {},
  revealedKeys = [],
  activeNodeExposure = [],
  nodes = [],
  variableMeta = {},
}: GetVisiblePlayerStatsParams): VisiblePlayerStat[] {
  const revealed = new Set(revealedKeys);
  const activeExposure = new Set(activeNodeExposure);
  const keys = new Set([
    ...Object.keys(initialVariables || {}),
    ...Object.keys(playVariables || {}),
  ]);

  const visible: VisiblePlayerStat[] = [];

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

export function formatPlayerStatValue(
  key: string,
  value: unknown,
  nodes: ReadonlyArray<PlayerStatNodeSource | null | undefined> = [],
  variableMeta: VariableMetaMap = {}
): string {
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
    const entries = Object.entries(value).filter(
      ([, amount]) => Number(amount) > 0
    );
    if (entries.length === 0) return "—";

    return entries
      .map(([part, amount]) => {
        const fullKey = key === "prepAllocation" ? `prep_${part}` : part;
        const label = getPlayerVariableDisplay(fullKey, nodes, variableMeta)
          .label;
        return `${label}: ${amount}`;
      })
      .join(" · ");
  }

  if (typeof value === "number") return String(value);
  return String(value ?? "—");
}
