function makeNodeId() {
  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function makeChoiceId() {
  return `choice_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChoice(choice = {}) {
  return {
    id: choice?.id || makeChoiceId(),
    label: choice?.label || "New Choice",
    targetNodeId: choice?.targetNodeId || "",
    conditions: Array.isArray(choice?.conditions) ? choice.conditions : [],
    effects: Array.isArray(choice?.effects) ? choice.effects : [],
  };
}

function normalizeNode(node = {}) {
  return {
    id: node?.id || makeNodeId(),
    position: {
      x: Number(node?.position?.x ?? 0),
      y: Number(node?.position?.y ?? 0),
    },
    data: {
      title: node?.data?.title || "New Block",
      content: node?.data?.content || "",
      blockType: node?.data?.blockType || "narrative",
      choices: Array.isArray(node?.data?.choices)
        ? node.data.choices.map(normalizeChoice)
        : [],
      enterEffects: Array.isArray(node?.data?.enterEffects)
        ? node.data.enterEffects
        : [],
      graphIssues: Array.isArray(node?.data?.graphIssues)
        ? node.data.graphIssues
        : [],
    },
  };
}

export function normalizeStory(rawStory = {}) {
  return {
    nodes: Array.isArray(rawStory?.nodes)
      ? rawStory.nodes.map(normalizeNode)
      : [],
    variables:
      rawStory?.variables && typeof rawStory.variables === "object"
        ? rawStory.variables
        : {},
    metadata:
      rawStory?.metadata && typeof rawStory.metadata === "object"
        ? rawStory.metadata
        : {},
  };
}