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

/**
 * Maps a mini-game editor payload back onto story node `data` fields.
 */
export function miniGamePayloadToNodeData(updatedMiniGame) {
  if (!updatedMiniGame || typeof updatedMiniGame !== "object") {
    return {};
  }

  const { type, title, prompt, config = {} } = updatedMiniGame;

  const patch = {
    blockType: type,
    title: title || "Mini-Game",
    content: prompt || "",
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
