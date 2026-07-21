/**
 * Pure description of a canvas node's connection handles.
 *
 * Splitting this out of StoryNode keeps the rendering component thin and lets
 * tests assert handle counts / associations without mounting React Flow (whose
 * <Handle> requires a live React Flow context).
 *
 * Design rule enforced here: every node has exactly TWO outer handles — one
 * target ("input", left) and one generic continuation source ("continue",
 * right). Choice handles are NOT outer handles; they belong beside their choice
 * chip. Specialized links (success/failure/timeout) are labeled rows, never
 * anonymous outer dots.
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
}

export interface NodeSpecialHandle {
  id: SpecialHandleId;
  /** Human-readable label shown next to the handle so it is never anonymous. */
  label: string;
}

export interface NodeHandleModel {
  /** The two always-present outer handles. */
  inputHandleId: string;
  continueHandleId: string;
  /** One handle per choice (rendered beside its chip), non-persuasion blocks. */
  choiceHandles: NodeChoiceHandle[];
  /** Labeled specialized links for mini-game / timed blocks. */
  specialHandles: NodeSpecialHandle[];
}

export interface NodeHandleModelInput {
  blockType?: string | null;
  choices?: ReadonlyArray<{ id?: string } | null | undefined> | null;
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
  const isMiniGameBlock =
    blockType === "traitPicker" ||
    blockType === "persuasion" ||
    blockType === "choiceWeighting";

  // Persuasion "choices" are score lines, not branching go-to choices, so they
  // never expose a graph connection handle.
  const showChoiceHandles = blockType !== "persuasion";

  const choiceHandles: NodeChoiceHandle[] = [];
  if (showChoiceHandles) {
    for (const choice of data?.choices || []) {
      const choiceId = choice?.id;
      if (!choiceId) continue;
      choiceHandles.push({
        id: makeChoiceHandleId(choiceId),
        choiceId,
      });
    }
  }

  const specialHandles: NodeSpecialHandle[] = [];
  if (isMiniGameBlock || hasValue(data?.successNodeId)) {
    specialHandles.push({ id: "success", label: SPECIAL_HANDLE_LABELS.success });
  }
  if (isMiniGameBlock || hasValue(data?.failureNodeId)) {
    specialHandles.push({ id: "failure", label: SPECIAL_HANDLE_LABELS.failure });
  }
  if (blockType === "timed" || hasValue(data?.timeoutTargetNodeId)) {
    specialHandles.push({ id: "timeout", label: SPECIAL_HANDLE_LABELS.timeout });
  }

  return {
    inputHandleId: INPUT_HANDLE_ID,
    continueHandleId: CONTINUE_HANDLE_ID,
    choiceHandles,
    specialHandles,
  };
}
