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
import type { MiniGameBlockType } from "../types/minigames";
import type { StoryNodeData } from "../types/story";

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
