/**
 * Minimal shared contracts for Wave 1 typed utilities.
 * Not a full story schema — only shapes already defined by JSDoc / runtime usage.
 */

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
  value?: unknown;
}

/** Actions handled by applyEffect; unknown actions leave variables unchanged. */
export type EffectAction = "set" | "add" | "subtract" | "toggle";

export interface Effect {
  variable: string;
  action: EffectAction | (string & {});
  value?: unknown;
}

/**
 * Play/runtime variable bag used by condition/effect evaluation.
 * Values are intentionally wide — story schema normalization lives elsewhere.
 */
export type StoryVariables = Record<string, unknown>;

/**
 * Empty project shape from createBlankStory — not a full Story model.
 */
export interface BlankStoryProject {
  nodes: unknown[];
  variables: StoryVariables;
  variableMeta: Record<string, unknown>;
  characters: StoryCharacter[];
}
