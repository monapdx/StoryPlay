/**
 * Bridge between story node `data` (editor / React Flow) and the mini-game editor payload shape.
 */

export function canonicalMiniGameBlockType(node) {
  if (!node?.data) return null;
  const raw = node.data.blockType;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "traitPicker" || t === "persuasion" || t === "choiceWeighting") {
    return t;
  }
  return null;
}

export function isSupportedMiniGameBlock(node) {
  return canonicalMiniGameBlockType(node) != null;
}

export function buildMiniGameFromSelectedNode(selectedNode) {
  if (!selectedNode) return null;

  const blockType = canonicalMiniGameBlockType(selectedNode);
  if (!blockType) return null;

  const data = selectedNode.data || {};

  switch (blockType) {
    case "traitPicker":
      return {
        title: data.title || "Trait Picker",
        type: "traitPicker",
        prompt: data.content || "",
        config: {
          options: data.options || [],
          minSelections: data.minSelections ?? 0,
          maxSelections: data.maxSelections ?? 2,
          traitListVariable: data.traitListVariable || "",
          continueNodeId: data.continueNodeId || "",
        },
      };

    case "persuasion":
      return {
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
          choices: data.choices || [],
        },
      };

    case "choiceWeighting":
      return {
        title: data.title || "Choice Weighting",
        type: "choiceWeighting",
        prompt: data.content || "",
        config: {
          options: data.options || [],
          totalPoints: data.totalPoints ?? 10,
          variablePrefix: data.variablePrefix || "",
          resultVariable: data.resultVariable || "",
          lockExactTotal: data.lockExactTotal ?? true,
          continueNodeId: data.continueNodeId || "",
        },
      };

    default:
      return null;
  }
}
