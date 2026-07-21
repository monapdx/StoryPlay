/**
 * Pure description of a canvas node's connection handles.
 *
 * Splitting this out of StoryNode keeps the rendering component thin and lets
 * tests assert handle visibility / associations without mounting React Flow
 * (whose <Handle> requires a live React Flow context).
 *
 * Visibility rules (see the connector spec):
 *  - Every non-terminal node always has one target ("input", left) handle.
 *  - A generic continuation ("continue") source appears ONLY when the block
 *    represents a linear step — i.e. a narrative/chat/timed block with no
 *    choices, or a mini-game whose supported output is a single continuation
 *    (traitPicker / choiceWeighting).
 *  - A branching block surfaces one choice handle per choice and NO generic
 *    continuation handle, so a node branches through its visible choices.
 *  - Ending blocks expose no source handles at all.
 *  - Specialized links (success / failure / timeout) are labeled rows, never
 *    anonymous outer dots, shown only for the block types that support them.
 *  - If a branching block ALSO carries a continueNodeId, that is a data
 *    conflict: the continuation handle is still surfaced (labeled "Default")
 *    so the existing edge stays editable, and `hasContinuationConflict` flags
 *    it for a graph diagnostic. Existing data is never silently dropped.
 */

import {
  CONTINUE_HANDLE_ID,
  INPUT_HANDLE_ID,
  makeChoiceHandleId,
} from "./nodeGraphLinks";

export type SpecialHandleId = "success" | "failure" | "timeout";

export interface NodeChoiceHandle {
  /** React Flow handle id, e.g. "choice:<id>". */
  id: string;
  /** The owning choice's stable id. */
  choiceId: string;
  /** Choice label, used for the connector tooltip. */
  label: string;
}

export interface NodeSpecialHandle {
  id: SpecialHandleId;
  /** Human-readable label shown next to the handle so it is never anonymous. */
  label: string;
}

export interface NodeContinueHandle {
  id: string;
  /** "Continue" for a linear step, "Default" when it is a fallback path. */
  label: string;
  /** True when the node also has branching choices (a data conflict). */
  isConflict: boolean;
}

export interface NodeHandleModel {
  /** Always present (except this is still emitted; callers render it). */
  inputHandleId: string;
  /** The generic continuation source, or null when the node branches. */
  continueHandle: NodeContinueHandle | null;
  /** One handle per choice (rendered beside its chip). */
  choiceHandles: NodeChoiceHandle[];
  /** Labeled specialized links for mini-game / timed blocks. */
  specialHandles: NodeSpecialHandle[];
  /** True when the node has both branching choices and a continueNodeId. */
  hasContinuationConflict: boolean;
}

export interface NodeHandleModelInput {
  blockType?: string | null;
  choices?:
    | ReadonlyArray<{ id?: string; label?: unknown; text?: unknown } | null | undefined>
    | null;
  continueNodeId?: unknown;
  successNodeId?: unknown;
  failureNodeId?: unknown;
  timeoutTargetNodeId?: unknown;
}

const SPECIAL_HANDLE_LABELS: Record<SpecialHandleId, string> = {
  success: "Success",
  failure: "Failure",
  timeout: "Timeout",
};

function hasValue(value: unknown): boolean {
  return !!String(value ?? "").trim();
}

export function getNodeHandleModel(
  data: NodeHandleModelInput | null | undefined
): NodeHandleModel {
  const blockType = data?.blockType || "narrative";

  const isEnding = blockType === "ending";
  const isPersuasion = blockType === "persuasion";
  const isTraitOrWeighting =
    blockType === "traitPicker" || blockType === "choiceWeighting";
  // Narrative, chat, timed, and any unknown/legacy type branch through choices.
  const isBranchingType = !isEnding && !isPersuasion && !isTraitOrWeighting;

  const continueSet = hasValue(data?.continueNodeId);

  // --- Choice handles -------------------------------------------------------
  // Only branching blocks expose per-choice connectors. Persuasion "choices"
  // are score lines, and trait/weighting blocks branch via their options.
  const choiceHandles: NodeChoiceHandle[] = [];
  if (isBranchingType) {
    for (const choice of data?.choices || []) {
      const choiceId = choice?.id;
      if (!choiceId) continue;
      choiceHandles.push({
        id: makeChoiceHandleId(choiceId),
        choiceId,
        label: String(choice?.label ?? choice?.text ?? "").trim(),
      });
    }
  }
  const hasChoices = choiceHandles.length > 0;

  // --- Generic continuation handle -----------------------------------------
  let continueHandle: NodeContinueHandle | null = null;
  let hasContinuationConflict = false;

  const makeContinue = (label: string, isConflict: boolean): NodeContinueHandle => ({
    id: CONTINUE_HANDLE_ID,
    label,
    isConflict,
  });

  if (isEnding) {
    continueHandle = null;
  } else if (isBranchingType) {
    if (!hasChoices) {
      // Linear step: the continuation is the single, expected output.
      continueHandle = makeContinue("Continue", false);
    } else if (continueSet) {
      // Choices AND a default continuation coexist — surface, don't delete.
      continueHandle = makeContinue("Default", true);
      hasContinuationConflict = true;
    }
    // else: branches purely through its choices, no generic handle.
  } else if (isTraitOrWeighting) {
    // These mini-games advance through a single continuation output.
    continueHandle = makeContinue("Continue", false);
  } else if (continueSet) {
    // Persuasion / unknown mini-game with a legacy continue link: keep it
    // editable rather than orphaning the existing edge.
    continueHandle = makeContinue("Continue", false);
  }

  // --- Specialized labeled handles -----------------------------------------
  const specialHandles: NodeSpecialHandle[] = [];
  if (isPersuasion || hasValue(data?.successNodeId)) {
    specialHandles.push({ id: "success", label: SPECIAL_HANDLE_LABELS.success });
  }
  if (isPersuasion || hasValue(data?.failureNodeId)) {
    specialHandles.push({ id: "failure", label: SPECIAL_HANDLE_LABELS.failure });
  }
  if (blockType === "timed" || hasValue(data?.timeoutTargetNodeId)) {
    specialHandles.push({ id: "timeout", label: SPECIAL_HANDLE_LABELS.timeout });
  }

  return {
    inputHandleId: INPUT_HANDLE_ID,
    continueHandle,
    choiceHandles,
    specialHandles,
    hasContinuationConflict,
  };
}
