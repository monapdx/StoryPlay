import { getChoiceKind, CHOICE_KIND } from "./choiceKinds";
import {
  getNodeOutgoingLinks,
  isBranchingGoToChoice,
  nodeHasOutgoingLinks,
} from "./nodeGraphLinks";

export function analyzeStoryGraph(nodes = [], variables = {}) {
  const issues = [];

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
  const visited = new Set();

  function recordIncoming(targetNodeId) {
    if (!targetNodeId || !nodeMap.has(targetNodeId)) return;
    incomingCounts.set(
      targetNodeId,
      (incomingCounts.get(targetNodeId) || 0) + 1
    );
  }

  function dfs(nodeId) {
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
      const choiceLabel = choice.label || choice.text || "Untitled choice";

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

export function groupIssuesByNode(issues = []) {
  const map = {};

  for (const issue of issues) {
    if (!issue.nodeId) continue;
    if (!map[issue.nodeId]) {
      map[issue.nodeId] = [];
    }
    map[issue.nodeId].push(issue);
  }

  return map;
}
