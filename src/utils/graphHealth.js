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

  function dfs(nodeId) {
    if (!nodeId || visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const choices = node.data?.choices || [];
    for (const choice of choices) {
      if (choice.targetNodeId && nodeMap.has(choice.targetNodeId)) {
        dfs(choice.targetNodeId);
      }
    }
  }

  for (const node of nodes) {
    const choices = node.data?.choices || [];

    for (const choice of choices) {
      if (!choice.targetNodeId) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          message: `Choice "${choice.label || "Untitled choice"}" has no target.`,
        });
      } else if (!nodeMap.has(choice.targetNodeId)) {
        issues.push({
          severity: "error",
          nodeId: node.id,
          message: `Choice "${choice.label || "Untitled choice"}" points to a missing node.`,
        });
      } else {
        incomingCounts.set(
          choice.targetNodeId,
          (incomingCounts.get(choice.targetNodeId) || 0) + 1
        );
      }

      for (const condition of choice.conditions || []) {
        if (condition.variable && !definedVariables.has(condition.variable)) {
          issues.push({
            severity: "warning",
            nodeId: node.id,
            message: `Choice "${choice.label || "Untitled choice"}" uses undefined variable "${condition.variable}" in a condition.`,
          });
        }
      }

      for (const effect of choice.effects || []) {
        if (effect.variable && !definedVariables.has(effect.variable)) {
          issues.push({
            severity: "warning",
            nodeId: node.id,
            message: `Choice "${choice.label || "Untitled choice"}" uses undefined variable "${effect.variable}" in an effect.`,
          });
        }
      }
    }

    for (const effect of node.data?.enterEffects || []) {
      if (effect.variable && !definedVariables.has(effect.variable)) {
        issues.push({
          severity: "warning",
          nodeId: node.id,
          message: `Node "${node.data?.title || node.id}" uses undefined variable "${effect.variable}" in enterEffects.`,
        });
      }
    }

    const isEnding = node.data?.blockType === "ending";
    if (!isEnding && choices.length === 0) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        message: `Node "${node.data?.title || node.id}" has no outgoing choices.`,
      });
    }
  }

  dfs(startNode.id);

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
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
        message: `Node "${node.data?.title || node.id}" has no incoming choices.`,
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