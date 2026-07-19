/**
 * Bridge between story node `data` (editor / React Flow) and the mini-game editor payload shape.
 */

import type {
  MiniGameEditorChoiceWeightingConfig,
  MiniGameEditorChoiceWeightingDraft,
  MiniGameEditorDraft,
  MiniGameEditorPersuasionChoice,
  MiniGameEditorPersuasionConfig,
  MiniGameEditorPersuasionDraft,
  MiniGameEditorTraitOption,
  MiniGameEditorTraitPickerConfig,
  MiniGameEditorTraitPickerDraft,
  MiniGameEditorChoiceWeightingOption,
} from "../hooks/useMiniGameEditorState";
import type {
  MiniGameBlockType,
  StoryPlayMiniGameBlock,
  TraitOption,
  WeightedOption,
} from "../types/minigames";
import type { StoryNodeData } from "../types/story";
import type { JsonValue } from "../types/generated/storyplayExportV1";
import type { VariablePatch } from "../types/storyBlocks";

/**
 * Loose node shape accepted at the boundary (incomplete/legacy data tolerated).
 * Not a full StoryNode — only `data` is read.
 */
export type MiniGameSourceNode = {
  data?: StoryNodeData | null;
} | null;

/** Config bag read when mapping a saved draft back onto node data. */
type MiniGameEditorConfigSource = Partial<
  MiniGameEditorChoiceWeightingConfig &
    MiniGameEditorPersuasionConfig &
    MiniGameEditorTraitPickerConfig
>;

/**
 * Loose editor payload / draft input for draft→node mapping.
 * Prefer MiniGameEditorDraft from save; unknown/legacy objects still accepted.
 */
export type MiniGameEditorPayloadSource = {
  type?: unknown;
  title?: unknown;
  prompt?: unknown;
  config?: MiniGameEditorConfigSource;
};

export function canonicalMiniGameBlockType(
  node: unknown
): MiniGameBlockType | null {
  const source = node as MiniGameSourceNode | undefined;
  if (!source?.data) return null;
  const raw = source.data.blockType;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "traitPicker" || t === "persuasion" || t === "choiceWeighting") {
    return t;
  }
  return null;
}

export function isSupportedMiniGameBlock(node: unknown): boolean {
  return canonicalMiniGameBlockType(node) != null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function toVariablePatch(value: unknown): VariablePatch | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(([, item]) => isJsonValue(item));
  return Object.fromEntries(entries) as VariablePatch;
}

/**
 * Adapt permissive persisted node data to the stricter play-view contracts.
 * This replaces unsafe casts at the preview boundary while preserving v1 defaults.
 */
export function buildRuntimeMiniGameBlock(
  nodeId: string,
  data: StoryNodeData
): StoryPlayMiniGameBlock | null {
  const title = typeof data.title === "string" ? data.title : undefined;
  const prompt =
    typeof data.prompt === "string"
      ? data.prompt
      : typeof data.content === "string"
        ? data.content
        : undefined;
  const submitLabel =
    typeof data.submitLabel === "string" ? data.submitLabel : undefined;
  const options = Array.isArray(data.options) ? data.options : [];

  switch (data.blockType) {
    case "traitPicker": {
      const traitOptions: TraitOption[] = options
        .filter(isRecord)
        .map((option, index) => ({
          id:
            typeof option.id === "string" && option.id
              ? option.id
              : `trait-${index + 1}`,
          label: typeof option.label === "string" ? option.label : "",
          ...(typeof option.description === "string"
            ? { description: option.description }
            : {}),
          ...(toVariablePatch(option.effects)
            ? { effects: toVariablePatch(option.effects) }
            : {}),
        }));

      return {
        id: nodeId,
        type: "traitPicker",
        title,
        prompt,
        submitLabel,
        minSelections: data.minSelections ?? 0,
        maxSelections: data.maxSelections ?? 2,
        traitListVariable: data.traitListVariable,
        continueNodeId: data.continueNodeId,
        options: traitOptions,
      };
    }

    case "persuasion":
      return {
        id: nodeId,
        type: "persuasion",
        title,
        prompt,
        submitLabel,
        autoAdvance: data.autoAdvance,
        targetName: data.targetName,
        startScore: data.startScore ?? 50,
        minScore: data.minScore ?? 0,
        maxScore: data.maxScore ?? 100,
        threshold: data.threshold ?? 75,
        maxTurns: data.maxTurns ?? 3,
        visibleMeter: data.visibleMeter ?? true,
        scoreVariable: data.scoreVariable,
        successVariable: data.successVariable,
        successNodeId: data.successNodeId,
        failureNodeId: data.failureNodeId,
        choices: (data.choices || []).map((choice, index) => ({
          id: choice.id || `line-${index + 1}`,
          text: choice.text || choice.label || "",
          delta: choice.delta ?? 0,
          once: choice.once,
          response: choice.response,
        })),
      };

    case "choiceWeighting": {
      const weightedOptions: WeightedOption[] = options
        .filter(isRecord)
        .map((option, index) => ({
          id:
            typeof option.id === "string" && option.id
              ? option.id
              : `option-${index + 1}`,
          label: typeof option.label === "string" ? option.label : "",
          ...(typeof option.min === "number" ? { min: option.min } : {}),
          ...(typeof option.max === "number" ? { max: option.max } : {}),
        }));

      return {
        id: nodeId,
        type: "choiceWeighting",
        title,
        prompt,
        submitLabel,
        totalPoints: data.totalPoints ?? 10,
        variablePrefix: data.variablePrefix,
        resultVariable: data.resultVariable,
        lockExactTotal: data.lockExactTotal ?? true,
        continueNodeId: data.continueNodeId,
        options: weightedOptions,
      };
    }

    default:
      return null;
  }
}

/**
 * Build an editor draft-shaped payload from a story node.
 * Options/choices are passed through as stored on the node (may be incomplete);
 * useMiniGameEditorState normalizes them after open.
 */
export function buildMiniGameFromSelectedNode(
  selectedNode: unknown
): MiniGameEditorDraft | null {
  if (!selectedNode) return null;

  const blockType = canonicalMiniGameBlockType(selectedNode);
  if (!blockType) return null;

  const source = selectedNode as MiniGameSourceNode;
  const data = source?.data || {};

  switch (blockType) {
    case "traitPicker": {
      const draft: MiniGameEditorTraitPickerDraft = {
        title: data.title || "Trait Picker",
        type: "traitPicker",
        prompt: data.content || "",
        config: {
          options: (data.options || []) as MiniGameEditorTraitOption[],
          minSelections: data.minSelections ?? 0,
          maxSelections: data.maxSelections ?? 2,
          traitListVariable: data.traitListVariable || "",
          continueNodeId: data.continueNodeId || "",
        },
      };
      return draft;
    }

    case "persuasion": {
      const draft: MiniGameEditorPersuasionDraft = {
        title: data.title || "Persuasion",
        type: "persuasion",
        prompt: data.content || "",
        config: {
          targetName: data.targetName || "",
          startScore: data.startScore ?? 50,
          minScore: data.minScore ?? 0,
          maxScore: data.maxScore ?? 100,
          threshold: data.threshold ?? 75,
          maxTurns: data.maxTurns ?? 3,
          visibleMeter: data.visibleMeter ?? true,
          scoreVariable: data.scoreVariable || "",
          successVariable: data.successVariable || "",
          successNodeId: data.successNodeId || "",
          failureNodeId: data.failureNodeId || "",
          choices: (data.choices || []) as MiniGameEditorPersuasionChoice[],
        },
      };
      return draft;
    }

    case "choiceWeighting": {
      const draft: MiniGameEditorChoiceWeightingDraft = {
        title: data.title || "Choice Weighting",
        type: "choiceWeighting",
        prompt: data.content || "",
        config: {
          options: (data.options || []) as MiniGameEditorChoiceWeightingOption[],
          totalPoints: data.totalPoints ?? 10,
          variablePrefix: data.variablePrefix || "",
          resultVariable: data.resultVariable || "",
          lockExactTotal: data.lockExactTotal ?? true,
          continueNodeId: data.continueNodeId || "",
        },
      };
      return draft;
    }

    default:
      return null;
  }
}

/**
 * Maps a mini-game editor payload back onto story node `data` fields.
 * Returns a partial data patch (spread onto existing node.data); not a full node.
 */
export function miniGamePayloadToNodeData(
  updatedMiniGame: unknown
): Partial<StoryNodeData> {
  if (!updatedMiniGame || typeof updatedMiniGame !== "object") {
    return {};
  }

  const payload = updatedMiniGame as MiniGameEditorPayloadSource;
  const { type, title, prompt, config = {} } = payload;

  const patch: Partial<StoryNodeData> = {
    blockType: type as StoryNodeData["blockType"],
    title: (title || "Mini-Game") as string,
    content: (prompt || "") as string,
  };

  switch (type) {
    case "traitPicker":
      return {
        ...patch,
        options: Array.isArray(config.options) ? config.options : [],
        minSelections: config.minSelections ?? 0,
        maxSelections: config.maxSelections ?? 2,
        traitListVariable: config.traitListVariable || "",
        continueNodeId: config.continueNodeId || "",
      };

    case "persuasion":
      return {
        ...patch,
        targetName: config.targetName || "",
        startScore: config.startScore ?? 50,
        minScore: config.minScore ?? 0,
        maxScore: config.maxScore ?? 100,
        threshold: config.threshold ?? 75,
        maxTurns: config.maxTurns ?? 3,
        visibleMeter: config.visibleMeter ?? true,
        scoreVariable: config.scoreVariable || "",
        successVariable: config.successVariable || "",
        successNodeId: config.successNodeId || "",
        failureNodeId: config.failureNodeId || "",
        choices: Array.isArray(config.choices) ? config.choices : [],
      };

    case "choiceWeighting":
      return {
        ...patch,
        options: Array.isArray(config.options) ? config.options : [],
        totalPoints: config.totalPoints ?? 10,
        variablePrefix: config.variablePrefix || "",
        resultVariable: config.resultVariable || "",
        lockExactTotal: config.lockExactTotal ?? true,
        continueNodeId: config.continueNodeId || "",
      };

    default:
      return patch;
  }
}
