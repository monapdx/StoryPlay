import type { JsonValue } from "./generated/storyplayExportV1";

export type VariableValue = JsonValue;

export type VariablePatch = Record<string, VariableValue>;

export interface BaseStoryBlock {
  id: string;
  title?: string;
  prompt?: string;
  content?: string;
  autoAdvance?: boolean;
  submitLabel?: string;
}

export interface BaseBlockResult {
  completed: boolean;
  nextNodeId?: string;
  variablePatch?: VariablePatch;
}