import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Effect, StoryVariables } from "../types/storyCore";
import type { StoryNode } from "../types/story";
import { applyEffects } from "../utils/storyLogic";
import {
  getInitiallyRevealedVariableKeys,
  getNodeVariableExposure,
} from "../utils/playerVariableStats";
import { getNodesSignature } from "../utils/playEntryNode";

export interface UsePlayStateOptions {
  standalone?: boolean;
}

export interface PlayHistoryEntry {
  /** May be null/undefined when leaving a play position that was unset. */
  nodeId: string | null | undefined;
  variables: StoryVariables;
}

export interface UsePlayStateResult {
  currentPlayNodeId: string | null | undefined;
  currentPlayNode: StoryNode | null;
  history: PlayHistoryEntry[];
  playVariables: StoryVariables;
  previousPlayVariables: StoryVariables;
  changedVariableKeys: string[];
  revealedVariableKeys: string[];
  startFromNode: (nodeId: string | null | undefined) => void;
  resetToSelected: () => void;
  goToNode: (
    nodeId: string | null | undefined,
    effects?: Effect[] | null
  ) => void;
  goBack: () => void;
}

function cloneVariables(
  variables?: StoryVariables | null
): StoryVariables {
  return { ...(variables || {}) };
}

function getChangedKeys(
  previousVars: StoryVariables = {},
  nextVars: StoryVariables = {}
): string[] {
  const keys = new Set([
    ...Object.keys(previousVars || {}),
    ...Object.keys(nextVars || {}),
  ]);

  return [...keys].filter((key) => previousVars[key] !== nextVars[key]);
}

/**
 * Play/preview navigation and variable state for a story graph.
 *
 * Callers pass editor/preview nodes (`StoryNode[]`) plus a selected or
 * standalone entry id. Incomplete ids/effects remain tolerated at the same
 * runtime boundaries as the original JS hook.
 */
export default function usePlayState(
  nodes: readonly StoryNode[],
  selectedNodeId: string | null | undefined,
  initialVariables: StoryVariables = {},
  options: UsePlayStateOptions = {}
): UsePlayStateResult {
  const { standalone = false } = options;
  const anchorNodeId = standalone
    ? selectedNodeId
    : selectedNodeId || nodes[0]?.id || null;

  const [currentPlayNodeId, setCurrentPlayNodeId] = useState<
    string | null | undefined
  >(anchorNodeId);
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [playVariables, setPlayVariables] = useState<StoryVariables>(() =>
    cloneVariables(initialVariables)
  );
  const [previousPlayVariables, setPreviousPlayVariables] =
    useState<StoryVariables>(() => cloneVariables(initialVariables));
  const [changedVariableKeys, setChangedVariableKeys] = useState<string[]>([]);
  const [revealedVariableKeys, setRevealedVariableKeys] = useState<string[]>(
    () => getInitiallyRevealedVariableKeys(initialVariables)
  );

  const playVariablesRef = useRef(playVariables);
  const currentPlayNodeIdRef = useRef(currentPlayNodeId);
  const initialVariablesRef = useRef(initialVariables);
  const anchorNodeIdRef = useRef(anchorNodeId);

  playVariablesRef.current = playVariables;
  currentPlayNodeIdRef.current = currentPlayNodeId;
  initialVariablesRef.current = initialVariables;
  anchorNodeIdRef.current = anchorNodeId;

  const nodesSignature = useMemo(() => getNodesSignature(nodes), [nodes]);

  function mergeRevealedKeys(keys: string[] = []) {
    if (!keys.length) return;
    setRevealedVariableKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => {
        if (key) next.add(key);
      });
      return [...next];
    });
  }

  function resetRevealedKeys(
    variables: StoryVariables = initialVariablesRef.current
  ) {
    setRevealedVariableKeys(getInitiallyRevealedVariableKeys(variables));
  }

  function resetPlayToAnchor() {
    const resetVars = cloneVariables(initialVariablesRef.current);
    const nextNodeId = anchorNodeIdRef.current || nodes[0]?.id || null;

    setCurrentPlayNodeId(nextNodeId);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
    resetRevealedKeys(resetVars);
  }

  useEffect(() => {
    if (!nodes.length) {
      setCurrentPlayNodeId(null);
      setHistory([]);
      setPlayVariables(cloneVariables(initialVariablesRef.current));
      setPreviousPlayVariables(cloneVariables(initialVariablesRef.current));
      setChangedVariableKeys([]);
      resetRevealedKeys(initialVariablesRef.current);
      return;
    }

    const activeNodeId = currentPlayNodeIdRef.current;
    const playNodeStillExists = nodes.some((node) => node.id === activeNodeId);

    if (!playNodeStillExists) {
      resetPlayToAnchor();
      return;
    }

    setHistory((prevHistory) =>
      prevHistory.filter((entry) =>
        nodes.some((node) => node.id === entry.nodeId)
      )
    );
  }, [nodesSignature, nodes]);

  const currentPlayNode = useMemo(() => {
    return nodes.find((node) => node.id === currentPlayNodeId) || null;
  }, [nodes, currentPlayNodeId]);

  useEffect(() => {
    if (!currentPlayNode) return;
    // playerVariableStats.js is still untyped; narrow at this boundary.
    const exposure = getNodeVariableExposure(currentPlayNode) as string[];
    if (!exposure.length) return;

    setRevealedVariableKeys((prev) => {
      const next = new Set(prev);
      exposure.forEach((key) => next.add(key));
      return [...next];
    });
  }, [currentPlayNode]);

  const goToNode = useCallback(
    (nodeId: string | null | undefined, effects: Effect[] | null = []) => {
      if (!nodeId) return;

      const safeEffects = effects || [];
      const beforeVars = cloneVariables(playVariablesRef.current);
      const afterVars = applyEffects(safeEffects, beforeVars);
      const changedKeys = getChangedKeys(beforeVars, afterVars);
      const currentId = currentPlayNodeIdRef.current;

      if (nodeId === currentId) {
        if (!safeEffects.length) return;

        setHistory((prev) => [
          ...prev,
          {
            nodeId: currentId,
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
          nodeId: currentId,
          variables: beforeVars,
        },
      ]);

      setPreviousPlayVariables(beforeVars);
      setPlayVariables(afterVars);
      setChangedVariableKeys(changedKeys);
      mergeRevealedKeys(changedKeys);
      setCurrentPlayNodeId(nodeId);
    },
    []
  );

  function startFromNode(nodeId: string | null | undefined) {
    if (!nodeId) return;

    const resetVars = cloneVariables(initialVariablesRef.current);

    setCurrentPlayNodeId(nodeId);
    setHistory([]);
    setPlayVariables(resetVars);
    setPreviousPlayVariables(resetVars);
    setChangedVariableKeys([]);
    resetRevealedKeys(resetVars);
  }

  function resetToSelected() {
    resetPlayToAnchor();
  }

  function goBack() {
    if (!history.length) return;

    const nextHistory = [...history];
    const previousEntry = nextHistory.pop();

    setHistory(nextHistory);
    setCurrentPlayNodeId(previousEntry?.nodeId || null);
    setPreviousPlayVariables(cloneVariables(playVariablesRef.current));
    setPlayVariables(
      cloneVariables(previousEntry?.variables || initialVariablesRef.current)
    );
    setChangedVariableKeys(
      getChangedKeys(
        playVariablesRef.current,
        previousEntry?.variables || initialVariablesRef.current
      )
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
