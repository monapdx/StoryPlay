import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cloneDemoStoryById, DEMO_STORIES } from "../data/demoStoriesCatalog";
import {
  ONBOARDING_DEMO_CHOICES,
  ONBOARDING_SCAFFOLD_NODE_ID,
} from "../data/onboardingDemo";
import { createBlankStory } from "../utils/blankStory";
import { saveEditorProject, loadEditorProject } from "../utils/storyProjectStorage";
import { createCharacter, normalizeCharacters } from "../utils/storyEntities";
import { normalizeVariableMeta } from "../utils/storyVariables";
import { renderStoryText } from "../utils/storyReferences";
import { buildStoryEdgesFromNodes } from "../utils/nodeGraphLinks";
import { normalizeStoryNodes } from "../utils/nodeHelpers";
import { miniGamePayloadToNodeData } from "../utils/miniGameFromNode";
import { createStoryUndoHistory } from "../utils/storyUndoHistory";
import {
  createBlankGoToChoice,
  createNarrativeDestinationNode,
  fanOutPositions,
  getNextChoiceLabelStart,
  isChoiceUnconnected,
  parseChoiceCount,
  resolveOpenPosition,
} from "../utils/choicePathGenerator";

function makeNodeId() {
  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function makeChoiceLabel(targetTitle = "Next Block") {
  return `Go to ${targetTitle}`;
}

function buildEdgesFromNodes(nodes, characters = []) {
  const renderContext = { characters };
  return buildStoryEdgesFromNodes(nodes, renderStoryText, renderContext);
}

function normalizeInitialStory(story) {
  const safeNodes = normalizeStoryNodes(
    Array.isArray(story?.nodes) ? story.nodes : []
  );
  const safeVariables =
    story?.variables && typeof story.variables === "object"
      ? story.variables
      : {};

  return {
    nodes: safeNodes,
    variables: safeVariables,
    variableMeta: normalizeVariableMeta(story?.variableMeta),
    characters: normalizeCharacters(story?.characters),
  };
}

function stableDemoSignature(nodes, variables, characters, variableMeta) {
  return JSON.stringify({ nodes, variables, characters, variableMeta });
}

export default function useStoryState() {
  /** `null` = blank project; otherwise id of the loaded starter template. */
  const [activeDemoStoryId, setActiveDemoStoryId] = useState(null);

  const initial = useMemo(() => {
    const saved = loadEditorProject();
    if (saved) {
      return normalizeInitialStory(saved);
    }
    return normalizeInitialStory(createBlankStory());
  }, []);

  const [nodes, setNodesState] = useState(initial.nodes);
  const [variables, setVariablesState] = useState(initial.variables);
  const [variableMeta, setVariableMetaState] = useState(initial.variableMeta);
  const [characters, setCharactersState] = useState(initial.characters);
  const [selectedNodeId, setSelectedNodeId] = useState(
    () => initial.nodes[0]?.id || null
  );
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

  const historyRef = useRef(null);
  if (!historyRef.current) {
    historyRef.current = createStoryUndoHistory();
  }
  const [historyVersion, setHistoryVersion] = useState(0);

  const storyStateRef = useRef({
    nodes: initial.nodes,
    variables: initial.variables,
    variableMeta: initial.variableMeta,
    characters: initial.characters,
    selectedNodeId: initial.nodes[0]?.id || null,
    activeDemoStoryId: null,
  });

  storyStateRef.current = {
    nodes,
    variables,
    variableMeta,
    characters,
    selectedNodeId,
    activeDemoStoryId,
  };

  useEffect(() => historyRef.current.subscribe(() => {
    setHistoryVersion((value) => value + 1);
  }), []);

  function recordHistory({ immediate = false } = {}) {
    historyRef.current.recordBeforeMutation(storyStateRef.current, { immediate });
  }

  function clearHistory() {
    historyRef.current.clear();
  }

  function restoreStorySnapshot(snapshot) {
    historyRef.current.runApplying(() => {
      setNodesState(snapshot.nodes);
      setVariablesState(snapshot.variables);
      setVariableMetaState(snapshot.variableMeta);
      setCharactersState(snapshot.characters);
      setActiveDemoStoryId(snapshot.activeDemoStoryId ?? null);

      const validSelectedId = snapshot.nodes.some(
        (node) => node.id === snapshot.selectedNodeId
      )
        ? snapshot.selectedNodeId
        : snapshot.nodes[0]?.id || null;

      setSelectedNodeId(validSelectedId);
    });
  }

  const undo = useCallback(() => {
    const previous = historyRef.current.undo(storyStateRef.current);
    if (previous) {
      restoreStorySnapshot(previous);
    }
  }, []);

  const redo = useCallback(() => {
    const next = historyRef.current.redo(storyStateRef.current);
    if (next) {
      restoreStorySnapshot(next);
    }
  }, []);

  const canUndo = useMemo(() => {
    void historyVersion;
    return historyRef.current.canUndo();
  }, [historyVersion]);

  const canRedo = useMemo(() => {
    void historyVersion;
    return historyRef.current.canRedo();
  }, [historyVersion]);

  function setVariables(updater) {
    recordHistory();
    setVariablesState(updater);
  }

  function setVariableMeta(updater) {
    recordHistory();
    setVariableMetaState(updater);
  }

  const [storyBaselineSignature, setStoryBaselineSignature] = useState(() =>
    stableDemoSignature(
      initial.nodes,
      initial.variables,
      initial.characters,
      initial.variableMeta
    )
  );

  const isStoryDirty = useMemo(() => {
    return (
      stableDemoSignature(nodes, variables, characters, variableMeta) !==
      storyBaselineSignature
    );
  }, [nodes, variables, characters, variableMeta, storyBaselineSignature]);

  const isBlankProject = nodes.length === 0 && activeDemoStoryId == null;

  /** Persist working project to localStorage (debounced) so edits survive refresh. */
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      saveEditorProject({ nodes, variables, variableMeta, characters });
    }, 1500);

    return () => window.clearTimeout(timerId);
  }, [nodes, variables, variableMeta, characters]);

  /** @deprecated use isStoryDirty */
  const isDemoDirty = isStoryDirty;

  function loadDemoStory(storyId) {
    const raw = cloneDemoStoryById(storyId);
    if (!raw) return;

    const next = normalizeInitialStory(raw);

    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
    setSelectedNodeId(next.nodes[0]?.id || null);
    setActiveDemoStoryId(storyId);
    setStoryBaselineSignature(
      stableDemoSignature(
        next.nodes,
        next.variables,
        next.characters,
        next.variableMeta
      )
    );
    saveEditorProject(next);
  }

  function resetToBlankStory() {
    const next = normalizeInitialStory(createBlankStory());
    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
    setSelectedNodeId(null);
    setActiveDemoStoryId(null);
    setStoryBaselineSignature(
      stableDemoSignature(
        next.nodes,
        next.variables,
        next.characters,
        next.variableMeta
      )
    );
    saveEditorProject(next);
  }

  function importStory(story) {
    const next = normalizeInitialStory(story);
    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
    setSelectedNodeId(next.nodes[0]?.id || null);
    setActiveDemoStoryId(null);
    setStoryBaselineSignature(
      stableDemoSignature(
        next.nodes,
        next.variables,
        next.characters,
        next.variableMeta
      )
    );
    saveEditorProject(next);
  }

  function addCharacter() {
    recordHistory({ immediate: true });
    const next = createCharacter();
    setCharactersState((prev) => [...prev, next]);
    return next.id;
  }

  function updateCharacter(characterId, patch) {
    if (!characterId) return;
    recordHistory();
    setCharactersState((prev) =>
      prev.map((character) =>
        character.id === characterId
          ? {
              ...character,
              ...(typeof patch.name === "string" ? { name: patch.name } : {}),
              ...(typeof patch.description === "string"
                ? { description: patch.description }
                : {}),
              ...(Array.isArray(patch.aliases)
                ? {
                    aliases: patch.aliases.filter((item) => typeof item === "string"),
                  }
                : {}),
            }
          : character
      )
    );
  }

  function deleteCharacter(characterId) {
    if (!characterId) return;
    recordHistory({ immediate: true });
    setCharactersState((prev) => prev.filter((character) => character.id !== characterId));
  }

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const edges = useMemo(() => {
    return buildEdgesFromNodes(nodes, characters);
  }, [nodes, characters]);

  function addNode() {
    recordHistory({ immediate: true });
    const nextId = makeNodeId();

    const newNode = {
      id: nextId,
      type: "storyNode",
      position: {
        x: 260 + nodes.length * 40,
        y: 120 + nodes.length * 30,
      },
      data: {
        title: "New Block",
        content: "Write your story text here.",
        blockType: "narrative",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    };

    setNodesState((prev) => [...prev, newNode]);
    setSelectedNodeId(nextId);
  }

  function updateNodePosition(nodeId, position) {
    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position,
            }
          : node
      )
    );
  }

  function updateSelectedNodeField(field, value) {
    if (!selectedNodeId) return;

    recordHistory();
    setNodesState((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                [field]: value,
              },
            }
          : node
      )
    );
  }

  function applyMiniGameToSelectedNode(updatedMiniGame) {
    if (!selectedNodeId || !updatedMiniGame) return;

    recordHistory({ immediate: true });
    const dataPatch = miniGamePayloadToNodeData(updatedMiniGame);

    setNodesState((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...dataPatch,
              },
            }
          : node
      )
    );
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    recordHistory({ immediate: true });
    const nodeIdToDelete = selectedNodeId;

    setNodesState((prev) => {
      const filteredNodes = prev
        .filter((node) => node.id !== nodeIdToDelete)
        .map((node) => ({
          ...node,
          data: {
            ...node.data,
            choices: (node.data?.choices || []).filter(
              (choice) => choice.targetNodeId !== nodeIdToDelete
            ),
          },
        }));

      const nextSelectedId = filteredNodes[0]?.id || null;
      setSelectedNodeId(nextSelectedId);

      return filteredNodes;
    });
  }

  function addChoiceToSelectedNode() {
    if (!selectedNodeId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const existingChoices = node.data?.choices || [];
        const blockType = node.data?.blockType || "narrative";
        const isChatBlock = blockType === "chat";

        return {
          ...node,
          data: {
            ...node.data,
            choices: [
              ...existingChoices,
              {
                label: isChatBlock ? "New reply" : "New Choice",
                choiceKind: isChatBlock ? "chatReply" : "goTo",
                playerMessage: "",
                npcResponse: "",
                targetNodeId: "",
                conditions: [],
                effects: [],
              },
            ],
          },
        };
      })
    );
  }

  /**
   * Append N blank go-to choices to the selected narrative node (no destinations).
   * @param {unknown} rawCount
   * @returns {{ ok: boolean, message?: string, added?: number }}
   */
  function addMultipleChoicesToSelectedNode(rawCount) {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const parsed = parseChoiceCount(rawCount);
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const count = parsed.count;
    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const existingChoices = node.data?.choices || [];
        let nextNumber = getNextChoiceLabelStart(existingChoices);
        const addedChoices = Array.from({ length: count }, () => {
          const choice = createBlankGoToChoice(`Choice ${nextNumber}`);
          nextNumber += 1;
          return choice;
        });

        return {
          ...node,
          data: {
            ...node.data,
            choices: [...existingChoices, ...addedChoices],
          },
        };
      })
    );

    return {
      ok: true,
      added: count,
      message: `Added ${count} ${count === 1 ? "choice" : "choices"}.`,
    };
  }

  /**
   * For each unconnected choice on the selected narrative node, create a destination
   * node and wire targetNodeId. Existing connections are left untouched.
   * @returns {{ ok: boolean, message?: string, created?: number }}
   */
  function generateDestinationNodesForSelectedNode() {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const existingChoices = sourceNode.data?.choices || [];
    if (existingChoices.length === 0) {
      return { ok: false, message: "Add at least one choice first." };
    }

    const unconnectedIndexes = existingChoices
      .map((choice, index) => (isChoiceUnconnected(choice) ? index : -1))
      .filter((index) => index >= 0);

    if (unconnectedIndexes.length === 0) {
      return { ok: false, message: "All choices already have destinations." };
    }

    const occupied = storyStateRef.current.nodes.map((node) => node.position);
    const draftPositions = fanOutPositions(
      sourceNode.position,
      unconnectedIndexes.length
    );
    const resolvedPositions = [];
    for (const draft of draftPositions) {
      const next = resolveOpenPosition(draft, [...occupied, ...resolvedPositions]);
      resolvedPositions.push(next);
    }

    const destinationByChoiceIndex = new Map();
    const newNodes = unconnectedIndexes.map((choiceIndex, order) => {
      const choice = existingChoices[choiceIndex];
      const nodeId = makeNodeId();
      const title = choice?.label?.trim() || "New Block";
      destinationByChoiceIndex.set(choiceIndex, nodeId);
      return createNarrativeDestinationNode({
        id: nodeId,
        title,
        position: resolvedPositions[order],
      });
    });

    recordHistory({ immediate: true });
    setNodesState((prev) => {
      const nextNodes = prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextChoices = (node.data?.choices || []).map((choice, index) => {
          const targetId = destinationByChoiceIndex.get(index);
          if (!targetId || !isChoiceUnconnected(choice)) {
            return choice;
          }

          return {
            ...choice,
            targetNodeId: targetId,
          };
        });

        return {
          ...node,
          data: {
            ...node.data,
            choices: nextChoices,
          },
        };
      });

      return [...nextNodes, ...newNodes];
    });

    const created = newNodes.length;
    return {
      ok: true,
      created,
      message: `Generated ${created} destination ${created === 1 ? "node" : "nodes"}.`,
    };
  }

  /**
   * Add N new choices and create+connect a destination for each new choice only.
   * Does not fill destinations for pre-existing unconnected choices.
   * @param {unknown} rawCount
   */
  function generateChoicePathsForSelectedNode(rawCount) {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const parsed = parseChoiceCount(rawCount);
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const count = parsed.count;
    const existingChoices = sourceNode.data?.choices || [];
    let nextNumber = getNextChoiceLabelStart(existingChoices);

    const occupied = storyStateRef.current.nodes.map((node) => node.position);
    const draftPositions = fanOutPositions(sourceNode.position, count);
    const resolvedPositions = [];
    for (const draft of draftPositions) {
      const next = resolveOpenPosition(draft, [...occupied, ...resolvedPositions]);
      resolvedPositions.push(next);
    }

    const newChoices = [];
    const newNodes = [];

    for (let index = 0; index < count; index += 1) {
      const label = `Choice ${nextNumber}`;
      nextNumber += 1;
      const nodeId = makeNodeId();
      newNodes.push(
        createNarrativeDestinationNode({
          id: nodeId,
          title: label,
          position: resolvedPositions[index],
        })
      );
      newChoices.push({
        ...createBlankGoToChoice(label),
        targetNodeId: nodeId,
      });
    }

    recordHistory({ immediate: true });
    setNodesState((prev) => {
      const nextNodes = prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            choices: [...(node.data?.choices || []), ...newChoices],
          },
        };
      });

      return [...nextNodes, ...newNodes];
    });

    return {
      ok: true,
      added: count,
      created: count,
      message: `Generated ${count} choice ${count === 1 ? "path" : "paths"}.`,
    };
  }

  function updateChoiceOnSelectedNode(index, field, value) {
    if (!selectedNodeId) return;

    recordHistory();
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextChoices = [...(node.data?.choices || [])];
        const currentChoice = nextChoices[index];

        if (!currentChoice) return node;

        nextChoices[index] = {
          ...currentChoice,
          [field]: value,
        };

        return {
          ...node,
          data: {
            ...node.data,
            choices: nextChoices,
          },
        };
      })
    );
  }

  function removeChoiceFromSelectedNode(index) {
    if (!selectedNodeId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextChoices = [...(node.data?.choices || [])];
        nextChoices.splice(index, 1);

        return {
          ...node,
          data: {
            ...node.data,
            choices: nextChoices,
          },
        };
      })
    );
  }

  function connectNodesFromHandle(connection) {
    const sourceId = connection?.source;
    const targetId = connection?.target;

    if (!sourceId || !targetId || sourceId === targetId) return;

    recordHistory({ immediate: true });
    setNodesState((prevNodes) => {
      const targetNode = prevNodes.find((node) => node.id === targetId);
      const targetTitle = targetNode?.data?.title || "Next Block";

      return prevNodes.map((node) => {
        if (node.id !== sourceId) return node;

        const existingChoices = node.data?.choices || [];
        const alreadyExists = existingChoices.some(
          (choice) => choice.targetNodeId === targetId
        );

        if (alreadyExists) {
          return node;
        }

        const nextChoice = {
          label: makeChoiceLabel(targetTitle),
          targetNodeId: targetId,
          conditions: [],
          effects: [],
        };

        return {
          ...node,
          data: {
            ...node.data,
            choices: [...existingChoices, nextChoice],
          },
        };
      });
    });

    setSelectedNodeId(sourceId);
  }

  function deleteEdge(edgeId) {
    if (!edgeId) return;

    const [sourceId, targetId] = edgeId.split("__");

    if (!sourceId || !targetId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== sourceId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            choices: (node.data?.choices || []).filter(
              (choice) => choice.targetNodeId !== targetId
            ),
          },
        };
      })
    );
  }

  const ensureOnboardingScaffold = useCallback(({ seedChoices = false } = {}) => {
    let targetIdToSelect = null;

    setNodesState((prev) => {
      let next = [...prev];

      let targetId =
        selectedNodeIdRef.current &&
        next.some((node) => node.id === selectedNodeIdRef.current)
          ? selectedNodeIdRef.current
          : null;

      if (!targetId) {
        const existingScaffold = next.find(
          (node) =>
            node.id === ONBOARDING_SCAFFOLD_NODE_ID || node.data?.isOnboardingScaffold
        );

        if (existingScaffold) {
          targetId = existingScaffold.id;
        } else if (next.length === 0) {
          const scaffold = {
            id: ONBOARDING_SCAFFOLD_NODE_ID,
            type: "storyNode",
            position: { x: 260, y: 120 },
            data: {
              title: "Tutorial Scene",
              content: "Write what the player reads when they reach this scene.",
              blockType: "narrative",
              choices: [],
              isOnboardingScaffold: true,
              enterEffects: [],
              graphIssues: [],
            },
          };
          next = [...next, scaffold];
          targetId = scaffold.id;
        } else {
          targetId = next[0]?.id || null;
        }
      }

      if (seedChoices && targetId) {
        const demoChoices = ONBOARDING_DEMO_CHOICES.map((choice) => ({ ...choice }));
        next = next.map((node) =>
          node.id === targetId
            ? {
                ...node,
                data: {
                  ...node.data,
                  blockType: node.data?.blockType || "narrative",
                  choices: demoChoices,
                },
              }
            : node
        );
      }

      targetIdToSelect = targetId;
      return next;
    });

    if (targetIdToSelect) {
      setSelectedNodeId(targetIdToSelect);
    }
  }, []);

  return {
    nodes,
    edges,
    variables,
    setVariables,
    variableMeta,
    setVariableMeta,
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    activeDemoStoryId,
    demoStories: DEMO_STORIES,
    loadDemoStory,
    resetToBlankStory,
    importStory,
    isBlankProject,
    isStoryDirty,
    isDemoDirty,
    addNode,
    updateNodePosition,
    updateSelectedNodeField,
    applyMiniGameToSelectedNode,
    deleteSelectedNode,
    addChoiceToSelectedNode,
    addMultipleChoicesToSelectedNode,
    generateDestinationNodesForSelectedNode,
    generateChoicePathsForSelectedNode,
    updateChoiceOnSelectedNode,
    removeChoiceFromSelectedNode,
    connectNodesFromHandle,
    deleteEdge,
    ensureOnboardingScaffold,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}