import { useMemo, useState } from "react";
import { cloneDemoStoryById, DEMO_STORIES } from "../data/demoStoriesCatalog";
import { createBlankStory } from "../utils/blankStory";
import { createCharacter, normalizeCharacters } from "../utils/storyEntities";
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
    characters: normalizeCharacters(story?.characters),
  };
}

function stableDemoSignature(nodes, variables, characters) {
  return JSON.stringify({ nodes, variables, characters });
}

export default function useStoryState() {
  /** `null` = blank project; otherwise id of the loaded starter template. */
  const [activeDemoStoryId, setActiveDemoStoryId] = useState(null);

  const initial = useMemo(() => normalizeInitialStory(createBlankStory()), []);

  const [nodes, setNodes] = useState(initial.nodes);
  const [variables, setVariables] = useState(initial.variables);
  const [characters, setCharacters] = useState(initial.characters);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [storyBaselineSignature, setStoryBaselineSignature] = useState(() =>
    stableDemoSignature(initial.nodes, initial.variables, initial.characters)
  );

  const isStoryDirty = useMemo(() => {
    return (
      stableDemoSignature(nodes, variables, characters) !== storyBaselineSignature
    );
  }, [nodes, variables, characters, storyBaselineSignature]);

  const isBlankProject = nodes.length === 0 && activeDemoStoryId == null;

  /** @deprecated use isStoryDirty */
  const isDemoDirty = isStoryDirty;

  function loadDemoStory(storyId) {
    const raw = cloneDemoStoryById(storyId);
    if (!raw) return;

    const next = normalizeInitialStory(raw);

    setNodes(next.nodes);
    setVariables(next.variables);
    setCharacters(next.characters);
    setSelectedNodeId(next.nodes[0]?.id || null);
    setActiveDemoStoryId(storyId);
    setStoryBaselineSignature(
      stableDemoSignature(next.nodes, next.variables, next.characters)
    );
  }

  function resetToBlankStory() {
    const next = normalizeInitialStory(createBlankStory());
    setNodes(next.nodes);
    setVariables(next.variables);
    setCharacters(next.characters);
    setSelectedNodeId(null);
    setActiveDemoStoryId(null);
    setStoryBaselineSignature(
      stableDemoSignature(next.nodes, next.variables, next.characters)
    );
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

        return {
          ...node,
          data: {
            ...node.data,
            choices: [
              ...existingChoices,
              {
                label: "New Choice",
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

  return {
    nodes,
    setNodes,
    edges,
    variables,
    setVariables,
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
  };
}