import { useCallback, useMemo, useRef, useState } from "react";
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

function makeNodeId() {
  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function makeChoiceLabel(targetTitle = "Next Block") {
  return `Go to ${targetTitle}`;
}

function buildEdgesFromNodes(nodes, characters = []) {
  const renderContext = { characters };
  const edges = [];

  for (const node of nodes) {
    const choices = node?.data?.choices || [];

    choices.forEach((choice, index) => {
      if (!choice?.targetNodeId) return;

      const rawLabel = choice.label || "";
      edges.push({
        id: `${node.id}__${choice.targetNodeId}__${index}`,
        source: node.id,
        target: choice.targetNodeId,
        type: "storyEdge",
        data: {
          label: renderStoryText(rawLabel, renderContext),
        },
      });
    });
  }

  return edges;
}

function normalizeInitialStory(story) {
  const safeNodes = Array.isArray(story?.nodes) ? story.nodes : [];
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

  const [nodes, setNodes] = useState(initial.nodes);
  const [variables, setVariables] = useState(initial.variables);
  const [variableMeta, setVariableMeta] = useState(initial.variableMeta);
  const [characters, setCharacters] = useState(initial.characters);
  const [selectedNodeId, setSelectedNodeId] = useState(
    () => initial.nodes[0]?.id || null
  );
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

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

  /** @deprecated use isStoryDirty */
  const isDemoDirty = isStoryDirty;

  function loadDemoStory(storyId) {
    const raw = cloneDemoStoryById(storyId);
    if (!raw) return;

    const next = normalizeInitialStory(raw);

    setNodes(next.nodes);
    setVariables(next.variables);
    setVariableMeta(next.variableMeta);
    setCharacters(next.characters);
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
    setNodes(next.nodes);
    setVariables(next.variables);
    setVariableMeta(next.variableMeta);
    setCharacters(next.characters);
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
    setNodes(next.nodes);
    setVariables(next.variables);
    setVariableMeta(next.variableMeta);
    setCharacters(next.characters);
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
    const next = createCharacter();
    setCharacters((prev) => [...prev, next]);
    return next.id;
  }

  function updateCharacter(characterId, patch) {
    if (!characterId) return;
    setCharacters((prev) =>
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
    setCharacters((prev) => prev.filter((character) => character.id !== characterId));
  }

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const edges = useMemo(() => {
    return buildEdgesFromNodes(nodes, characters);
  }, [nodes, characters]);

  function addNode() {
    const nextId = makeNodeId();

    const newNode = {
      id: nextId,
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

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(nextId);
  }

  function updateNodePosition(nodeId, position) {
    setNodes((prev) =>
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

    setNodes((prev) =>
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

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    const nodeIdToDelete = selectedNodeId;

    setNodes((prev) => {
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

    setNodes((prev) =>
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

  function updateChoiceOnSelectedNode(index, field, value) {
    if (!selectedNodeId) return;

    setNodes((prev) =>
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

    setNodes((prev) =>
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

    setNodes((prevNodes) => {
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

    setNodes((prev) =>
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

    setNodes((prev) => {
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
    setNodes,
    edges,
    variables,
    setVariables,
    variableMeta,
    setVariableMeta,
    characters,
    setCharacters,
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
    deleteSelectedNode,
    addChoiceToSelectedNode,
    updateChoiceOnSelectedNode,
    removeChoiceFromSelectedNode,
    connectNodesFromHandle,
    deleteEdge,
    ensureOnboardingScaffold,
  };
}