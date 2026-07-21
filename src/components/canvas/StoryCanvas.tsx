import { useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import StoryNode, {
  type StoryCanvasNodeData,
  type StoryCanvasNodePlayState,
} from "./StoryNode";
import StoryEdge, {
  type StoryCanvasEdgeData,
  type StoryCanvasEdgePlayState,
} from "./StoryEdge";
import NodeSearchBar from "./NodeSearchBar";
import UndoRedoButtons from "../editor/UndoRedoButtons";
import { evaluateConditions } from "../../utils/storyLogic";
import type { UseStoryStateResult } from "../../hooks/useStoryState";
import type { UsePlayStateResult } from "../../hooks/usePlayState";
import type { StoryNode as StoryGraphNode, StoryVariables } from "../../types/story";
import type { StoryGraphEdge } from "../../utils/nodeGraphLinks";

export type StoryCanvasProps = Pick<
  UseStoryStateResult,
  | "nodes"
  | "edges"
  | "characters"
  | "selectedNodeId"
  | "setSelectedNodeId"
  | "addNode"
  | "deleteSelectedNode"
  | "addChoiceToNode"
  | "updateNodePosition"
  | "connectNodesFromHandle"
  | "deleteEdge"
  | "undo"
  | "redo"
  | "canUndo"
  | "canRedo"
> & {
  currentPlayNodeId?: UsePlayStateResult["currentPlayNodeId"];
  playVariables?: StoryVariables;
};

/** RF node after canvas hydration (renderer data, not persisted story). */
export type HydratedStoryFlowNode = Node<StoryCanvasNodeData>;

/** RF edge after canvas hydration (renderer data, not persisted story). */
export type HydratedStoryFlowEdge = Edge<StoryCanvasEdgeData>;

/**
 * Registry cast: RF NodeTypes/EdgeTypes are invariant over NodeProps<data>;
 * our renderers are typed to StoryCanvasNodeData / StoryCanvasEdgeData.
 */
const nodeTypes = {
  storyNode: StoryNode,
} as NodeTypes;

const edgeTypes = {
  storyEdge: StoryEdge,
} as EdgeTypes;

export default function StoryCanvas({
  nodes = [],
  edges = [],
  characters = [],
  selectedNodeId,
  setSelectedNodeId,
  addNode,
  deleteSelectedNode,
  addChoiceToNode,
  updateNodePosition,
  connectNodesFromHandle,
  deleteEdge,
  undo,
  redo,
  canUndo = false,
  canRedo = false,
  currentPlayNodeId,
  playVariables = {},
}: StoryCanvasProps) {
  const [rfNodes, setRfNodes, onNodesChange] =
    useNodesState<StoryCanvasNodeData>([]);
  const [rfEdges, setRfEdges, onEdgesChange] =
    useEdgesState<StoryCanvasEdgeData>([]);

  const nodesById = useMemo(() => {
    const map: Record<string, StoryGraphNode> = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  const playStateMap = useMemo(() => {
    const map: Record<string, StoryCanvasNodePlayState> = {};

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
        characters,
        isSelected: node.id === selectedNodeId,
        playState: playStateMap[node.id] || "idle",
        onSelectNode: (nodeId: string) => setSelectedNodeId?.(nodeId),
        onAddChoice: (nodeId: string) => {
          if (!nodeId) return;
          // Mutate the exact node whose button was clicked. Selection is a
          // convenience update and must not be relied on for the mutation.
          setSelectedNodeId?.(nodeId);
          addChoiceToNode?.(nodeId);
        },
      },
    })) as HydratedStoryFlowNode[];
  }, [
    nodes,
    characters,
    selectedNodeId,
    playStateMap,
    setSelectedNodeId,
    addChoiceToNode,
  ]);

  const hydratedEdges = useMemo(() => {
    return edges.map((edge: StoryGraphEdge) => {
      let playState: StoryCanvasEdgePlayState = "idle";

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
    }) as HydratedStoryFlowEdge[];
  }, [edges, currentPlayNodeId, nodesById, playVariables]);

  useEffect(() => {
    setRfNodes(hydratedNodes);
  }, [hydratedNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(hydratedEdges);
  }, [hydratedEdges, setRfEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedNodeId?.(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId?.(null);
  }, [setSelectedNodeId]);

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_, node) => {
      updateNodePosition?.(node.id, node.position);
    },
    [updateNodePosition]
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
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
    function shouldIgnoreKeyTarget(target: EventTarget | null) {
      if (!target) return false;
      const element = target as HTMLElement;
      const tag = element.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (element.isContentEditable) return true;
      return false;
    }

    function onKeyDown(event: KeyboardEvent) {
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
        <button
          type="button"
          className="toolbar-button"
          data-onboarding="add-block"
          onClick={addNode}
        >
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

        <UndoRedoButtons
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          className="canvas-toolbar__undo-redo"
          buttonClassName="toolbar-button"
        />
      </div>

      <div className="canvas-searchbar-wrap">
        <NodeSearchBar
          nodes={nodes}
          onJumpToNode={(nodeId) => setSelectedNodeId?.(nodeId)}
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.15}
          color="rgba(129, 140, 248, 0.14)"
        />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </>
  );
}
