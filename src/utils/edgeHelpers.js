export function buildEdgesFromNodes(nodes) {
  const edges = [];

  nodes.forEach((node) => {
    const choices = node?.data?.choices || [];

    choices.forEach((choice) => {
      if (!choice.targetNodeId) return;

      edges.push({
        id: `edge-${node.id}-${choice.id}-${choice.targetNodeId}`,
        source: node.id,
        target: choice.targetNodeId,
        label: choice.label || "Choice",
      });
    });
  });

  return edges;
}