import { useEffect, useMemo, useState } from "react";
import { applyEffects } from "../utils/storyLogic";

function cloneVariables(variables) {
  return { ...(variables || {}) };
}

function getStartNodeId(story, fallbackSelectedNodeId = null) {
  return (
    story?.metadata?.startNodeId ||
    fallbackSelectedNodeId ||
    story?.nodes?.[0]?.id ||
    null
  );
}

function getChangedKeys(previousVars = {}, nextVars = {}) {
  const keys = new Set([
    ...Object.keys(previousVars || {}),
    ...Object.keys(nextVars || {}),
  ]);

  return [...keys].filter((key) => previousVars[key] !== nextVars[key]);
}

export default function usePlayState(story, fallbackSelectedNodeId = null) {
  const nodes = story?.nodes || [];
  const initialVariables = story?.variables || {};
  const startNodeId = getStartNodeId(story, fallbackSelectedNodeId);

  const [currentPlayNodeId, setCurrentPlayNodeId] = useState(startNodeId);
  const [history, setHistory] = useState([]);
  const [playVariables, setPlayVariables] = useState(() =>
    cloneVariables(initialVariables)
  );
  const [previousPlayVariables, setPreviousPlayVariables] = useState(
    cloneVariables(initialVariables)
  );
  const [changedVariableKeys, setChangedVariableKeys] = useState([]);

  useEffect(() => {
    const validNodeIds = new Set(nodes.map((node) => node.id));

    if (!nodes.length) {
      setCurrentPlayNodeId(null);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariables));
      setPreviousPlayVariables(cloneVariables(initialVariables));
      setChangedVariableKeys([]);
      return;
    }

    if (!validNodeIds.has(currentPlayNodeId)) {
      setCurrentPlayNodeId(startNodeId);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariables));
      setPreviousPlayVariables(cloneVariables(initialVariables));
      setChangedVariableKeys([]);
      return;
    }

    setHistory((prevHistory) =>
      prevHistory.filter(
        (entry) => entry && validNodeIds.has(entry.nodeId)
      )
    );
  }, [nodes, currentPlayNodeId, startNodeId, initialVariables]);

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
    setCurrentPlayNodeId(startNodeId);
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
    setCurrentPlayNodeId(previousEntry?.nodeId || startNodeId);
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