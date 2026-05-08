import { useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import StoryNode from "./StoryNode";
import StoryEdge from "./StoryEdge";
import NodeSearchBar from "./NodeSearchBar";
import { evaluateConditions } from "../../utils/storyLogic";

const nodeTypes = {
  storyNode: StoryNode,
};

const edgeTypes = {
  storyEdge: StoryEdge,
};

export default function StoryCanvas({
  nodes = [],
  edges = [],
  selectedNodeId,
  setSelectedNodeId,
  addNode,
  deleteSelectedNode,
  addChoiceToSelectedNode,
  updateNodePosition,
  connectNodesFromHandle,
  deleteEdge,
  currentPlayNodeId,
  playVariables = {},
}) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const nodesById = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  const playStateMap = useMemo(() => {
    const map = {};

    if (!currentPlayNodeId || !nodesById[currentPlayNodeId]) {
      return map;
    }

    map[currentPlayNodeId] = "playing";

    const currentNode = nodesById[currentPlayNodeId];
    const choices = currentNode?.data?.choices || [];

    choices.forEach((choice) => {
      const targetId = choice.targetNodeId;
      if (!targetId) return;

      const allowed = evaluateConditions(
        choice.conditions || [],
        playVariables || {}
      );

      if (!map[targetId]) {
        map[targetId] = allowed ? "reachable" : "locked";
      }
    });

    return map;
  }, [currentPlayNodeId, nodesById, playVariables]);

  const hydratedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      type: "storyNode",
      selected: node.id === selectedNodeId,
      data: {
        ...node.data,
        isSelected: node.id === selectedNodeId,
        playState: playStateMap[node.id] || "idle",
        onSelectNode: (nodeId) => setSelectedNodeId?.(nodeId),
        onAddChoice: (nodeId) => {
          if (!nodeId) return;
          setSelectedNodeId?.(nodeId);
          setTimeout(() => {
            addChoiceToSelectedNode?.();
          }, 0);
        },
      },
    }));
  }, [nodes, selectedNodeId, playStateMap, setSelectedNodeId, addChoiceToSelectedNode]);

  const hydratedEdges = useMemo(() => {
    return edges.map((edge) => {
      let playState = "idle";

      if (edge.source === currentPlayNodeId) {
        const sourceNode = nodesById[edge.source];
        const matchingChoice = (sourceNode?.data?.choices || []).find(
          (choice) => choice.targetNodeId === edge.target
        );

        if (matchingChoice) {
          const allowed = evaluateConditions(
            matchingChoice.conditions || [],
            playVariables || {}
          );

          playState = allowed ? "reachable" : "blocked";
        }
      }

      return {
        ...edge,
        type: "storyEdge",
        data: {
          ...(edge.data || {}),
          playState,
        },
      };
    });
  }, [edges, currentPlayNodeId, nodesById, playVariables]);

  useEffect(() => {
    setRfNodes(hydratedNodes);
  }, [hydratedNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(hydratedEdges);
  }, [hydratedEdges, setRfEdges]);

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedNodeId?.(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId?.(null);
  }, [setSelectedNodeId]);

  const onNodeDragStop = useCallback(
    (_, node) => {
      updateNodePosition?.(node.id, node.position);
    },
    [updateNodePosition]
  );

  const onConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;

      connectNodesFromHandle?.(params);
    },
    [connectNodesFromHandle]
  );

  const handleDeleteSelectedEdge = useCallback(() => {
    const selectedEdge = rfEdges.find((edge) => edge.selected);
    if (selectedEdge) {
      deleteEdge?.(selectedEdge.id);
    }
  }, [rfEdges, deleteEdge]);

  useEffect(() => {
    function shouldIgnoreKeyTarget(target) {
      if (!target) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (target.isContentEditable) return true;
      return false;
    }

    function onKeyDown(event) {
      if (!selectedNodeId) return;
      if (shouldIgnoreKeyTarget(event.target)) return;
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      event.preventDefault();
      deleteSelectedNode?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNodeId, deleteSelectedNode]);

  return (
    <>
      <div className="canvas-toolbar">
        <button type="button" className="toolbar-button" onClick={addNode}>
          + Add Block
        </button>

        <button
          type="button"
          className="toolbar-button"
          onClick={deleteSelectedNode}
          disabled={!selectedNodeId}
          title={!selectedNodeId ? "Select a block to delete it" : "Delete selected block"}
        >
          Delete Selected Block
        </button>

        <button type="button" className="toolbar-button" onClick={handleDeleteSelectedEdge}>
          Delete Selected Edge
        </button>
      </div>

      <div className="canvas-searchbar-wrap">
        <NodeSearchBar
          nodes={nodes}
          onSelectNode={(nodeId) => setSelectedNodeId?.(nodeId)}
        />
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </>
  );
}