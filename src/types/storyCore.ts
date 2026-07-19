/**
 * Minimal shared contracts for Wave 1 typed utilities.
 * Not a full story schema — only shapes already defined by JSDoc / runtime usage.
 */
import type { JsonValue } from "./generated/storyplayExportV1";

export interface StoryCharacter {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
}

/** Operators handled by evaluateCondition; unknown operators fall through to true. */
export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

export interface Condition {
  variable: string;
  operator: ConditionOperator | (string & {});
  value?: string | number | boolean | null;
}

/** Actions handled by applyEffect; unknown actions leave variables unchanged. */
export type EffectAction = "set" | "add" | "subtract" | "toggle";

export interface Effect {
  variable: string;
  action: EffectAction | (string & {});
  value?: JsonValue;
}

/**
 * Play/runtime variable bag used by condition/effect evaluation.
 * Values are intentionally wide — story schema normalization lives elsewhere.
 */
export type StoryVariables = Record<string, unknown>;

/**
 * Author-defined player-facing labels for a story variable.
 * Matches the existing JSDoc / editor variableMeta shape.
 */
export interface VariablePlayerMeta {
  playerLabel?: string;
  playerDescription?: string;
  icon?: string;
}

export type VariableMetaMap = Record<string, VariablePlayerMeta>;

/**
 * Empty project shape from createBlankStory — not a full Story model.
 */
export interface BlankStoryProject {
  nodes: unknown[];
  variables: StoryVariables;
  variableMeta: VariableMetaMap;
  characters: StoryCharacter[];
}
