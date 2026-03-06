import { useEffect, useMemo, useState } from "react";

export default function usePlayState(nodes, selectedNodeId) {
  const [currentPlayNodeId, setCurrentPlayNodeId] = useState(
    selectedNodeId || nodes[0]?.id || null
  );

  useEffect(() => {
    if (!nodes.length) {
      setCurrentPlayNodeId(null);
      return;
    }

    const stillExists = nodes.some((node) => node.id === currentPlayNodeId);

    if (!stillExists) {
      setCurrentPlayNodeId(selectedNodeId || nodes[0]?.id || null);
    }
  }, [nodes, currentPlayNodeId, selectedNodeId]);

  const currentPlayNode = useMemo(() => {
    return nodes.find((node) => node.id === currentPlayNodeId) || null;
  }, [nodes, currentPlayNodeId]);

  function startFromNode(nodeId) {
    if (!nodeId) return;
    setCurrentPlayNodeId(nodeId);
  }

  function resetToSelected() {
    setCurrentPlayNodeId(selectedNodeId || nodes[0]?.id || null);
  }

  function goToNode(nodeId) {
    if (!nodeId) return;
    setCurrentPlayNodeId(nodeId);
  }

  return {
    currentPlayNodeId,
    currentPlayNode,
    startFromNode,
    resetToSelected,
    goToNode,
  };
}