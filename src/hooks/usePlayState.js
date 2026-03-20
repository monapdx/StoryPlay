import { useEffect, useMemo, useState } from "react";
import { applyEffects } from "../utils/storyLogic";

function cloneVariables(variables) {
  return { ...(variables || {}) };
}

function getChangedKeys(previousVars = {}, nextVars = {}) {
  const keys = new Set([
    ...Object.keys(previousVars || {}),
    ...Object.keys(nextVars || {}),
  ]);

  return [...keys].filter((key) => previousVars[key] !== nextVars[key]);
}

export default function usePlayState(nodes, selectedNodeId, initialVariables = {}) {
  const [currentPlayNodeId, setCurrentPlayNodeId] = useState(
    selectedNodeId || nodes[0]?.id || null
  );
  const [history, setHistory] = useState([]);
  const [playVariables, setPlayVariables] = useState(cloneVariables(initialVariables));
  const [previousPlayVariables, setPreviousPlayVariables] = useState(
    cloneVariables(initialVariables)
  );
  const [changedVariableKeys, setChangedVariableKeys] = useState([]);

  useEffect(() => {
    if (!nodes.length) {
      setCurrentPlayNodeId(null);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariables));
      setPreviousPlayVariables(cloneVariables(initialVariables));
      setChangedVariableKeys([]);
      return;
    }

    const playNodeStillExists = nodes.some(
      (node) => node.id === currentPlayNodeId
    );

    if (!playNodeStillExists) {
      setCurrentPlayNodeId(selectedNodeId || nodes[0]?.id || null);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariables));
      setPreviousPlayVariables(cloneVariables(initialVariables));
      setChangedVariableKeys([]);
      return;
    }

    setHistory((prevHistory) =>
      prevHistory.filter((entry) =>
        nodes.some((node) => node.id === entry.nodeId)
      )
    );
  }, [nodes, currentPlayNodeId, selectedNodeId, initialVariables]);

  const currentPlayNode = useMemo(() => {
    return nodes.find((node) => node.id === currentPlayNodeId) || null;
  }, [nodes, currentPlayNodeId]);

  function startFromNode(nodeId) {
    if (!nodeId) return;

    const resetVars = cloneVariables(initialVariables);

    setCurrentPlayNodeId(nodeId);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
  }

  function resetToSelected() {
    const resetVars = cloneVariables(initialVariables);

    setCurrentPlayNodeId(selectedNodeId || nodes[0]?.id || null);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
  }

  function goToNode(nodeId, effects = []) {
    if (!nodeId || nodeId === currentPlayNodeId) return;

    const beforeVars = cloneVariables(playVariables);
    const afterVars = applyEffects(effects || [], beforeVars);

    setHistory((prev) => [
      ...prev,
      {
        nodeId: currentPlayNodeId,
        variables: beforeVars,
      },
    ]);

    setPreviousPlayVariables(beforeVars);
    setPlayVariables(afterVars);
    setChangedVariableKeys(getChangedKeys(beforeVars, afterVars));
    setCurrentPlayNodeId(nodeId);
  }

  function goBack() {
    if (!history.length) return;

    const nextHistory = [...history];
    const previousEntry = nextHistory.pop();

    setHistory(nextHistory);
    setCurrentPlayNodeId(previousEntry?.nodeId || null);
    setPreviousPlayVariables(cloneVariables(playVariables));
    setPlayVariables(cloneVariables(previousEntry?.variables || initialVariables));
    setChangedVariableKeys(
      getChangedKeys(playVariables, previousEntry?.variables || initialVariables)
    );
  }

  return {
    currentPlayNodeId,
    currentPlayNode,
    history,
    playVariables,
    previousPlayVariables,
    changedVariableKeys,
    startFromNode,
    resetToSelected,
    goToNode,
    goBack,
  };
}