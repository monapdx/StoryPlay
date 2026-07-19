import type { StoryVariables } from "../types/storyCore";
import { getChoiceKind, CHOICE_KIND } from "./choiceKinds";
import {
  getNodeOutgoingLinks,
  isBranchingGoToChoice,
  nodeHasOutgoingLinks,
} from "./nodeGraphLinks";
import { STORY_REFERENCE_TOKEN_REGEX } from "./storyReferences";

export type GraphIssueSeverity = "error" | "warning" | "success";

export interface GraphHealthIssue {
  severity: GraphIssueSeverity;
  message: string;
  nodeId?: string;
  code?: string;
}

/** Minimal choice fields inspected by graph diagnostics. */
interface GraphHealthChoice {
  label?: unknown;
  text?: unknown;
  /** Compatible with ChoiceKindSource; runtime still tolerates other values. */
  npcResponse?: string | null;
  targetNodeId?: unknown;
  choiceKind?: string | null;
  conditions?: Array<{ variable?: string }> | null;
  effects?: Array<{ variable?: string }> | null;
  playerMessage?: unknown;
  response?: unknown;
}

/** Minimal node shape accepted by analyzeStoryGraph (legacy/incomplete tolerant). */
export interface GraphHealthNode {
  id: string;
  data?: {
    blockType?: string | null;
    title?: unknown;
    isStart?: unknown;
    choices?: GraphHealthChoice[] | null;
    continueNodeId?: unknown;
    successNodeId?: unknown;
    failureNodeId?: unknown;
    timeoutTargetNodeId?: unknown;
    timeoutEffects?: Array<{ variable?: string }> | null;
    enterEffects?: Array<{ variable?: string }> | null;
    content?: unknown;
    prompt?: unknown;
    minSelections?: unknown;
    maxSelections?: unknown;
    minScore?: unknown;
    maxScore?: unknown;
    startScore?: unknown;
    threshold?: unknown;
    maxTurns?: unknown;
    totalPoints?: unknown;
    lockExactTotal?: unknown;
    traitListVariable?: unknown;
    scoreVariable?: unknown;
    successVariable?: unknown;
    resultVariable?: unknown;
    options?: Array<{
      id?: unknown;
      label?: unknown;
      description?: unknown;
      min?: unknown;
      max?: unknown;
      effects?: unknown;
    }> | null;
  } | null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function collectNodeText(data: NonNullable<GraphHealthNode["data"]>): unknown[] {
  const text: unknown[] = [data.title, data.content, data.prompt];
  for (const choice of data.choices || []) {
    text.push(
      choice.label,
      choice.text,
      choice.playerMessage,
      choice.npcResponse,
      choice.response
    );
  }
  for (const option of data.options || []) {
    text.push(option.label, option.description);
  }
  return text;
}

function findReferenceIssues(
  value: unknown,
  definedVariables: Set<string>
): Array<{ code: string; message: string }> {
  if (typeof value !== "string" || !value.includes("{{")) return [];

  const validToken = new RegExp(STORY_REFERENCE_TOKEN_REGEX.source, "g");
  const anchoredToken = new RegExp(`^(?:${STORY_REFERENCE_TOKEN_REGEX.source})$`);
  const tokenCandidates = value.match(/\{\{[\s\S]*?\}\}/g) || [];
  const issues: Array<{ code: string; message: string }> = [];

  if (
    tokenCandidates.some((token) => !anchoredToken.test(token)) ||
    value.replace(validToken, "").includes("{{")
  ) {
    issues.push({
      code: "malformed-reference",
      message: "contains a malformed {{type:id.field}} reference.",
    });
  }

  let match = validToken.exec(value);
  while (match) {
    const [, type, id] = match;
    if (type === "variable" && !definedVariables.has(id)) {
      issues.push({
        code: "undefined-variable-reference",
        message: `references undefined variable "${id}".`,
      });
    }
    match = validToken.exec(value);
  }

  return issues;
}

export function analyzeStoryGraph(
  nodes: GraphHealthNode[] = [],
  variables: StoryVariables | null | undefined = {}
): GraphHealthIssue[] {
  const issues: GraphHealthIssue[] = [];

  if (!nodes.length) {
    issues.push({
      severity: "error",
      message: "No nodes in story graph.",
    });
    return issues;
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const startNode =
    nodes.find((node) => node.data?.isStart) || nodes[0] || null;

  if (!startNode) {
    issues.push({
      severity: "error",
      message: "No start node found.",
    });
    return issues;
  }

  const definedVariables = new Set(Object.keys(variables || {}));
  const incomingCounts = new Map(nodes.map((node) => [node.id, 0]));
  const visited = new Set<string>();

  function recordIncoming(targetNodeId: string) {
    if (!targetNodeId || !nodeMap.has(targetNodeId)) return;
    incomingCounts.set(
      targetNodeId,
      (incomingCounts.get(targetNodeId) || 0) + 1
    );
  }

  function dfs(nodeId: string) {
    if (!nodeId || visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    for (const link of getNodeOutgoingLinks(node)) {
      if (nodeMap.has(link.targetNodeId)) {
        dfs(link.targetNodeId);
      }
    }
  }

  for (const node of nodes) {
    const choices = node.data?.choices || [];
    const blockType = node.data?.blockType || "narrative";
    const outgoingLinks = getNodeOutgoingLinks(node);

    for (const link of outgoingLinks) {
      if (!nodeMap.has(link.targetNodeId)) {
        issues.push({
          severity: "error",
          nodeId: node.id,
          code: "missing-node",
          message: `Node "${node.data?.title || node.id}" link "${link.label}" points to a missing node.`,
        });
      } else {
        recordIncoming(link.targetNodeId);
      }
    }

    for (const choice of choices) {
      const choiceKind = getChoiceKind(choice, blockType);
      const choiceLabel = (choice.label ||
        choice.text ||
        "Untitled choice") as string;

      if (choiceKind === CHOICE_KIND.CHAT_REPLY) {
        if (!String(choice.npcResponse || "").trim()) {
          issues.push({
            severity: "warning",
            nodeId: node.id,
            code: "missing-chat-response",
            message: `Chat reply "${choiceLabel}" has no character response.`,
          });
        }
      }

      if (isBranchingGoToChoice(choice, blockType) && !choice.targetNodeId) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "missing-target",
          message: `Choice "${choiceLabel}" has no target.`,
        });
      }

      for (const condition of choice.conditions || []) {
        if (condition.variable && !definedVariables.has(condition.variable)) {
          issues.push({
            severity: "warning",
            nodeId: node.id,
            code: "undefined-variable-condition",
            message: `Choice "${choice.label || choice.text || "Untitled choice"}" uses undefined variable "${condition.variable}" in a condition.`,
          });
        }
      }

      for (const effect of choice.effects || []) {
        if (effect.variable && !definedVariables.has(effect.variable)) {
          issues.push({
            severity: "warning",
            nodeId: node.id,
            code: "undefined-variable-effect",
            message: `Choice "${choice.label || choice.text || "Untitled choice"}" uses undefined variable "${effect.variable}" in an effect.`,
          });
        }
      }
    }

    for (const effect of node.data?.enterEffects || []) {
      if (effect.variable && !definedVariables.has(effect.variable)) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "undefined-variable-enter-effect",
          message: `Node "${node.data?.title || node.id}" uses undefined variable "${effect.variable}" in enterEffects.`,
        });
      }
    }

    for (const effect of node.data?.timeoutEffects || []) {
      if (effect.variable && !definedVariables.has(effect.variable)) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "undefined-variable-timeout-effect",
          message: `Node "${node.data?.title || node.id}" uses undefined variable "${effect.variable}" in timeoutEffects.`,
        });
      }
    }

    for (const field of [
      "traitListVariable",
      "scoreVariable",
      "successVariable",
      "resultVariable",
    ] as const) {
      const variable = node.data?.[field];
      if (
        typeof variable === "string" &&
        variable &&
        !definedVariables.has(variable)
      ) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "undefined-variable-output",
          message: `Node "${node.data?.title || node.id}" writes to undefined variable "${variable}" via ${field}.`,
        });
      }
    }

    for (const option of node.data?.options || []) {
      if (
        option.effects &&
        typeof option.effects === "object" &&
        !Array.isArray(option.effects)
      ) {
        for (const variable of Object.keys(option.effects)) {
          if (!definedVariables.has(variable)) {
            issues.push({
              severity: "warning",
              nodeId: node.id,
              code: "undefined-variable-option-effect",
              message: `Option "${String(option.label || option.id || "Untitled option")}" writes to undefined variable "${variable}".`,
            });
          }
        }
      }
    }

    if (blockType === "traitPicker") {
      const min = asFiniteNumber(node.data?.minSelections) ?? 0;
      const max = asFiniteNumber(node.data?.maxSelections) ?? 2;
      const optionCount = node.data?.options?.length ?? 0;
      if (min < 0 || max < 0 || min > max || max > optionCount) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "invalid-selection-limits",
          message: `Trait picker "${node.data?.title || node.id}" has invalid selection limits (${min}–${max} for ${optionCount} options).`,
        });
      }
    }

    if (blockType === "persuasion") {
      const min = asFiniteNumber(node.data?.minScore) ?? 0;
      const max = asFiniteNumber(node.data?.maxScore) ?? 100;
      const start = asFiniteNumber(node.data?.startScore) ?? 50;
      const threshold = asFiniteNumber(node.data?.threshold) ?? 75;
      const maxTurns = asFiniteNumber(node.data?.maxTurns) ?? 3;
      if (
        min > max ||
        start < min ||
        start > max ||
        threshold < min ||
        threshold > max ||
        maxTurns <= 0
      ) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "impossible-score-range",
          message: `Persuasion block "${node.data?.title || node.id}" has inconsistent score bounds, threshold, start score, or turn limit.`,
        });
      }
    }

    if (blockType === "choiceWeighting") {
      const total = asFiniteNumber(node.data?.totalPoints) ?? 10;
      const options = node.data?.options || [];
      let minimumRequired = 0;
      let maximumAllowed = 0;
      let hasUnboundedMaximum = false;
      let invalidOptionRange = false;

      for (const option of options) {
        const min = asFiniteNumber(option.min) ?? 0;
        const max = asFiniteNumber(option.max);
        minimumRequired += min;
        if (max == null) hasUnboundedMaximum = true;
        else maximumAllowed += max;
        if (min < 0 || (max != null && (max < 0 || min > max))) {
          invalidOptionRange = true;
        }
      }

      if (
        total < 0 ||
        invalidOptionRange ||
        minimumRequired > total ||
        (node.data?.lockExactTotal === true &&
          !hasUnboundedMaximum &&
          maximumAllowed < total)
      ) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: "impossible-weighting-range",
          message: `Choice weighting block "${node.data?.title || node.id}" has an infeasible point budget or option range.`,
        });
      }
    }

    for (const value of node.data ? collectNodeText(node.data) : []) {
      for (const referenceIssue of findReferenceIssues(
        value,
        definedVariables
      )) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          code: referenceIssue.code,
          message: `Node "${node.data?.title || node.id}" ${referenceIssue.message}`,
        });
      }
    }

    if (!nodeHasOutgoingLinks(node)) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        code: "no-exits",
        message: `Node "${node.data?.title || node.id}" has no outgoing connections.`,
      });
    }
  }

  dfs(startNode.id);

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        code: "unreachable",
        message: `Node "${node.data?.title || node.id}" is unreachable from the start node.`,
      });
    }
  }

  for (const node of nodes) {
    if (node.id === startNode.id) continue;

    const incoming = incomingCounts.get(node.id) || 0;
    if (incoming === 0) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        code: "no-incoming",
        message: `Node "${node.data?.title || node.id}" has no incoming connections.`,
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "success",
      message: "No graph health issues found.",
    });
  }

  return issues;
}

export function groupIssuesByNode(
  issues: GraphHealthIssue[] = []
): Record<string, GraphHealthIssue[]> {
  const map: Record<string, GraphHealthIssue[]> = {};

  for (const issue of issues) {
    if (!issue.nodeId) continue;
    if (!map[issue.nodeId]) {
      map[issue.nodeId] = [];
    }
    map[issue.nodeId].push(issue);
  }

  return map;
}
