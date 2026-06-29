import { useEffect, useMemo, useState } from "react";
import { applyEffects } from "../utils/storyLogic";
import {
  getInitiallyRevealedVariableKeys,
  getNodeVariableExposure,
} from "../utils/playerVariableStats";

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
  const [revealedVariableKeys, setRevealedVariableKeys] = useState(() =>
    getInitiallyRevealedVariableKeys(initialVariables)
  );

  function mergeRevealedKeys(keys = []) {
    if (!keys.length) return;
    setRevealedVariableKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => {
        if (key) next.add(key);
      });
      return [...next];
    });
  }

  function resetRevealedKeys(variables = initialVariables) {
    setRevealedVariableKeys(getInitiallyRevealedVariableKeys(variables));
  }

  useEffect(() => {
    if (!nodes.length) {
      setCurrentPlayNodeId(null);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariables));
      setPreviousPlayVariables(cloneVariables(initialVariables));
      setChangedVariableKeys([]);
      resetRevealedKeys(initialVariables);
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
      resetRevealedKeys(initialVariables);
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

  useEffect(() => {
    if (!currentPlayNode) return;
    const exposure = getNodeVariableExposure(currentPlayNode);
    if (!exposure.length) return;

    setRevealedVariableKeys((prev) => {
      const next = new Set(prev);
      exposure.forEach((key) => next.add(key));
      return [...next];
    });
  }, [currentPlayNode]);

  function startFromNode(nodeId) {
    if (!nodeId) return;

    const resetVars = cloneVariables(initialVariables);

    setCurrentPlayNodeId(nodeId);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
    resetRevealedKeys(resetVars);
  }

  function resetToSelected() {
    const resetVars = cloneVariables(initialVariables);

    setCurrentPlayNodeId(selectedNodeId || nodes[0]?.id || null);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
    resetRevealedKeys(resetVars);
  }

  function goToNode(nodeId, effects = []) {
    if (!nodeId) return;

    const safeEffects = effects || [];
    const beforeVars = cloneVariables(playVariables);
    const afterVars = applyEffects(safeEffects, beforeVars);
    const changedKeys = getChangedKeys(beforeVars, afterVars);

    if (nodeId === currentPlayNodeId) {
      if (!safeEffects.length) return;

      setHistory((prev) => [
        ...prev,
        {
          nodeId: currentPlayNodeId,
          variables: beforeVars,
        },
      ]);

      setPreviousPlayVariables(beforeVars);
      setPlayVariables(afterVars);
      setChangedVariableKeys(changedKeys);
      mergeRevealedKeys(changedKeys);
      return;
    }

    setHistory((prev) => [
      ...prev,
      {
        nodeId: currentPlayNodeId,
        variables: beforeVars,
      },
    ]);

    setPreviousPlayVariables(beforeVars);
    setPlayVariables(afterVars);
    setChangedVariableKeys(changedKeys);
    mergeRevealedKeys(changedKeys);
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
    revealedVariableKeys,
    startFromNode,
    resetToSelected,
    goToNode,
    goBack,
  };
}