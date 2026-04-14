export type VariableValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>;

export type VariablePatch = Record<string, VariableValue>;

export interface BaseStoryBlock {
  id: string;
  title?: string;
  prompt?: string;
  autoAdvance?: boolean;
  submitLabel?: string;
}

export interface BaseBlockResult {
  completed: boolean;
  nextNodeId?: string;
  variablePatch?: VariablePatch;
}