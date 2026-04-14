import type { BaseStoryBlock, BaseBlockResult, VariablePatch } from "./storyBlocks";

export type MiniGameBlockType =
  | "traitPicker"
  | "persuasion"
  | "choiceWeighting";

export interface TraitOption {
  id: string;
  label: string;
  description?: string;
  effects?: VariablePatch;
}

export interface TraitPickerBlock extends BaseStoryBlock {
  type: "traitPicker";
  minSelections?: number;
  maxSelections: number;
  traitListVariable?: string;
  options: TraitOption[];
}

export interface TraitPickerBlockResult extends BaseBlockResult {
  type: "traitPicker";
  selectedTraitIds: string[];
  selectedTraits: TraitOption[];
}

export interface PersuasionChoice {
  id: string;
  text: string;
  delta: number;
  once?: boolean;
  response?: string;
}

export interface PersuasionBlock extends BaseStoryBlock {
  type: "persuasion";
  targetName?: string;
  startScore: number;
  minScore?: number;
  maxScore?: number;
  threshold: number;
  maxTurns?: number;
  visibleMeter?: boolean;
  scoreVariable?: string;
  successVariable?: string;
  choices: PersuasionChoice[];
  successNodeId?: string;
  failureNodeId?: string;
}

export interface PersuasionBlockResult extends BaseBlockResult {
  type: "persuasion";
  finalScore: number;
  passed: boolean;
  turnsUsed: number;
  selectedChoiceIds: string[];
}

export interface WeightedOption {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export interface ChoiceWeightingBlock extends BaseStoryBlock {
  type: "choiceWeighting";
  totalPoints: number;
  options: WeightedOption[];
  variablePrefix?: string;
  resultVariable?: string;
  lockExactTotal?: boolean;
}

export interface ChoiceWeightingBlockResult extends BaseBlockResult {
  type: "choiceWeighting";
  allocation: Record<string, number>;
  totalAssigned: number;
  pointsRemaining: number;
}

export type StoryPlayMiniGameBlock =
  | TraitPickerBlock
  | PersuasionBlock
  | ChoiceWeightingBlock;

export type StoryPlayMiniGameResult =
  | TraitPickerBlockResult
  | PersuasionBlockResult
  | ChoiceWeightingBlockResult;