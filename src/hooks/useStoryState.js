import { useMemo, useState } from "react";
import sampleStory from "../data/sampleStory";
import { normalizeStory } from "../utils/storyModel";

function makeNodeId() {
  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function makeChoiceId() {
  return `choice_${Math.random().toString(36).slice(2, 10)}`;
}

function makeChoiceLabel(targetTitle = "Next Block") {
  return `Go to ${targetTitle}`;
}

function buildEdgesFromNodes(nodes) {
  const edges = [];

  for (const node of nodes) {
    const choices = node?.data?.choices || [];

    choices.forEach((choice) => {
      if (!choice?.targetNodeId || !choice?.id) return;

      edges.push({
        id: `${node.id}__${choice.id}__${choice.targetNodeId}`,
        source: node.id,
        target: choice.targetNodeId,
        type: "storyEdge",
        data: {
          choiceId: choice.id,
          label: choice.label || "",
        },
      });
    });
  }

  return edges;
}

export default function useStoryState() {
  const [story, setStory] = useState(() => normalizeStory(sampleStory));
  const [selectedNodeId, setSelectedNodeId] = useState(
    () => sampleStory?.nodes?.[0]?.id || null
  );

  const nodes = story.nodes;
  const variables = story.variables;

  function setNodes(nextNodes) {
    setStory((prev) => ({
      ...prev,
      nodes:
        typeof nextNodes === "function" ? nextNodes(prev.nodes) : nextNodes,
    }));
  }

  function setVariables(nextVariables) {
    setStory((prev) => ({
      ...prev,
      variables:
        typeof nextVariables === "function"
          ? nextVariables(prev.variables)
          : nextVariables,
    }));
  }

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const edges = useMemo(() => {
    return buildEdgesFromNodes(nodes);
  }, [nodes]);

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
                id: makeChoiceId(),
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

  function updateChoiceOnSelectedNode(choiceId, field, value) {
    if (!selectedNodeId || !choiceId) return;

    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextChoices = (node.data?.choices || []).map((choice) =>
          choice.id === choiceId
            ? {
                ...choice,
                [field]: value,
              }
            : choice
        );

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

  function removeChoiceFromSelectedNode(choiceId) {
    if (!selectedNodeId || !choiceId) return;

    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            choices: (node.data?.choices || []).filter(
              (choice) => choice.id !== choiceId
            ),
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
          id: makeChoiceId(),
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

    const [sourceId, choiceId, targetId] = edgeId.split("__");

    if (!sourceId || !choiceId || !targetId) return;

    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== sourceId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            choices: (node.data?.choices || []).filter(
              (choice) => choice.id !== choiceId
            ),
          },
        };
      })
    );
  }

  return {
    story,
    setStory,
    nodes,
    setNodes,
    edges,
    variables,
    setVariables,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
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