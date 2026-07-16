/**
 * Minimal in-app story graph types.
 *
 * Reuses Condition / Effect / characters / variables from storyCore,
 * ChoiceKind from choiceKinds, and mini-game block type literals from minigames.
 * Intentionally incomplete vs every demo literal — older files may omit
 * characters / variableMeta; normalize / import fills those in.
 *
 * @see schemas/storyplay-export.v1.schema.json
 */

import type { ChoiceKind } from "./choiceKinds";
import type { MiniGameBlockType } from "./minigames";
import type {
  Condition,
  Effect,
  StoryCharacter,
  StoryVariables,
  VariableMetaMap,
} from "./storyCore";

export type {
  ChoiceKind,
  Condition,
  Effect,
  StoryCharacter,
  StoryVariables,
  VariableMetaMap,
};

/** Canvas / React Flow node type used by the editor. */
export const STORY_NODE_TYPE = "storyNode" as const;

export type StoryNodeType = typeof STORY_NODE_TYPE | (string & {});

/**
 * Discriminator for preview/runtime behavior.
 * Unknown strings are tolerated for forward compatibility.
 */
export type StoryBlockType =
  | "narrative"
  | "chat"
  | "timed"
  | "ending"
  | MiniGameBlockType
  | (string & {});

export interface StoryNodePosition {
  x: number;
  y: number;
}

/** Reserved node `behavior` payload; no dedicated renderer module today. */
export interface StoryNodeBehavior {
  kind?: string;
  config?: Record<string, unknown>;
}

/**
 * Branching choice (narrative/chat/timed/ending) or persuasion line item.
 * Runtime uses the same `data.choices` array for both shapes.
 */
export interface StoryChoice {
  id?: string;
  label?: string;
  choiceKind?: ChoiceKind | (string & {});
  /** Chat reply: player bubble text; falls back to label when empty. */
  playerMessage?: string;
  /** Chat reply: NPC lines after the player speaks. */
  npcResponse?: string;
  targetNodeId?: string;
  conditions?: Condition[];
  effects?: Effect[];
  /** Persuasion line: button text. */
  text?: string;
  /** Persuasion line: score delta. */
  delta?: number;
  once?: boolean;
  response?: string;
  /** Optional per-line overrides (block-level ids are authoritative at runtime). */
  successNodeId?: string;
  failureNodeId?: string;
}

/**
 * Block payload on a React Flow story node.
 * Optional fields cover timed + mini-game blocks and editor diagnostics.
 */
export interface StoryNodeData {
  title?: string;
  content?: string;
  blockType?: StoryBlockType;
  choices?: StoryChoice[];
  /** Present after normalizeStoryNode; runtime may not apply yet. */
  enterEffects?: Effect[];
  /** Editor-only diagnostics; clean exports strip this. */
  graphIssues?: unknown[];
  /** Editor-only flag for the guided-tour scaffold node. */
  isOnboardingScaffold?: boolean;
  isStart?: boolean;
  behavior?: StoryNodeBehavior;

  // timed
  timerSeconds?: number;
  timeoutTargetNodeId?: string;
  timeoutEffects?: Effect[];

  // mini-game graph links / shared
  continueNodeId?: string;
  successNodeId?: string;
  failureNodeId?: string;
  options?: unknown[];
  prompt?: string;
  submitLabel?: string;
  autoAdvance?: boolean;

  // traitPicker
  minSelections?: number;
  maxSelections?: number;
  traitListVariable?: string;

  // persuasion
  targetName?: string;
  startScore?: number;
  minScore?: number;
  maxScore?: number;
  threshold?: number;
  maxTurns?: number;
  visibleMeter?: boolean;
  scoreVariable?: string;
  successVariable?: string;

  // choiceWeighting
  totalPoints?: number;
  variablePrefix?: string;
  resultVariable?: string;
  lockExactTotal?: boolean;
}

/**
 * React Flow–compatible story node.
 * Import validation requires id + data; type/position are filled by normalize.
 */
export interface StoryNode {
  id: string;
  type?: StoryNodeType;
  position?: StoryNodePosition;
  data: StoryNodeData;
}

/**
 * In-app story document (editor, import, export story payload).
 * `characters` / `variableMeta` may be absent on older literals; normalize fills them.
 */
export interface Story {
  variables: StoryVariables;
  nodes: StoryNode[];
  characters?: StoryCharacter[];
  variableMeta?: VariableMetaMap;
}

/**
 * Story after import/editor normalization — characters + variableMeta always present.
 */
export interface NormalizedStory {
  variables: StoryVariables;
  nodes: StoryNode[];
  characters: StoryCharacter[];
  variableMeta: VariableMetaMap;
}

/** Optional author-facing export envelope metadata (does not drive runtime). */
export interface StoryPlayExportMeta {
  title?: string;
  author?: string;
  description?: string;
  startNodeId?: string;
}

/**
 * StoryPlay v1 export / import document envelope.
 * @see schemas/storyplay-export.v1.schema.json
 */
export interface StoryPlayExportDocument {
  formatVersion: number;
  exportedAt?: string;
  meta?: StoryPlayExportMeta;
  story: Story;
}

export interface StoryPlayImportSummary {
  formatVersion: number;
  nodeCount: number;
  variableCount: number;
  characterCount: number;
  exportedAt: string | null;
}

export interface StoryPlayValidationResult {
  errors: string[];
  warnings: string[];
}
