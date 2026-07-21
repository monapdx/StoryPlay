import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Connection } from "reactflow";
import { cloneDemoStoryById, DEMO_STORIES } from "../data/demoStoriesCatalog";
import {
  ONBOARDING_DEMO_CHOICES,
  ONBOARDING_SCAFFOLD_NODE_ID,
} from "../data/onboardingDemo";
import type { DemoStoryCatalogEntry } from "../types/demoStories";
import type {
  NormalizedStory,
  StoryChoice,
  StoryNode,
  StoryNodePosition,
} from "../types/story";
import type {
  StoryCharacter,
  StoryVariables,
  VariableMetaMap,
} from "../types/storyCore";
import { createBlankStory } from "../utils/blankStory";
import {
  createBlankGoToChoice,
  createNarrativeDestinationNode,
  fanOutPositions,
  getNextChoiceLabelStart,
  isChoiceUnconnected,
  parseChoiceCount,
  resolveOpenPosition,
} from "../utils/choicePathGenerator";
import { miniGamePayloadToNodeData } from "../utils/miniGameFromNode";
import {
  buildStoryEdgesFromNodes,
  type StoryGraphEdge,
} from "../utils/nodeGraphLinks";
import {
  addChoiceToNodeInList,
  applyConnectionInList,
  removeChoiceFromNodeInList,
  removeEdgeFromList,
  updateChoiceOnNodeInList,
} from "../utils/nodeChoiceMutations";
import { ensureChoiceIds, normalizeStoryNodes } from "../utils/nodeHelpers";
import { createCharacter, normalizeCharacters } from "../utils/storyEntities";
import { saveEditorProject, loadEditorProject } from "../utils/storyProjectStorage";
import { renderStoryText } from "../utils/storyReferences";
import {
  createStoryUndoHistory,
  type StoryUndoHistoryApi,
} from "../utils/storyUndoHistory";
import { normalizeVariableMeta } from "../utils/storyVariables";

export type { DemoStoryCatalogEntry };

/** Editor undo/redo snapshot — full working story bag plus selection / demo id. */
export interface StoryStateSnapshot {
  nodes: StoryNode[];
  variables: StoryVariables;
  variableMeta: VariableMetaMap;
  characters: StoryCharacter[];
  selectedNodeId: string | null;
  activeDemoStoryId: string | null;
}

/**
 * Reserved for future hook options. The hook currently takes no parameters;
 * App and other callers continue to invoke `useStoryState()`.
 */
export interface UseStoryStateOptions {}

/** Loose story-shaped input tolerated at load / import / demo boundaries. */
export interface StoryStateLoadSource {
  nodes?: unknown;
  variables?: unknown;
  variableMeta?: unknown;
  characters?: unknown;
}

/** Partial character fields accepted by `updateCharacter` (runtime typeof-gated). */
export interface CharacterUpdatePatch {
  name?: unknown;
  description?: unknown;
  aliases?: unknown;
}

export interface EnsureOnboardingScaffoldOptions {
  seedChoices?: boolean;
}

export interface ChoicePathToolFailure {
  ok: false;
  message: string;
}

export interface ChoicePathToolSuccess {
  ok: true;
  message: string;
  added?: number;
  created?: number;
}

export type ChoicePathToolResult =
  | ChoicePathToolFailure
  | ChoicePathToolSuccess;

export interface UseStoryStateResult {
  nodes: StoryNode[];
  edges: StoryGraphEdge[];
  variables: StoryVariables;
  setVariables: (updater: SetStateAction<StoryVariables>) => void;
  variableMeta: VariableMetaMap;
  setVariableMeta: (updater: SetStateAction<VariableMetaMap>) => void;
  characters: StoryCharacter[];
  addCharacter: () => string;
  updateCharacter: (
    characterId: string | null | undefined,
    patch: CharacterUpdatePatch
  ) => void;
  deleteCharacter: (characterId: string | null | undefined) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;
  selectedNode: StoryNode | null;
  activeDemoStoryId: string | null;
  demoStories: DemoStoryCatalogEntry[];
  loadDemoStory: (storyId: string) => void;
  resetToBlankStory: () => void;
  importStory: (story: StoryStateLoadSource | null | undefined) => void;
  isBlankProject: boolean;
  isStoryDirty: boolean;
  /** @deprecated use isStoryDirty */
  isDemoDirty: boolean;
  addNode: () => void;
  updateNodePosition: (
    nodeId: string,
    position: StoryNodePosition
  ) => void;
  updateSelectedNodeField: (field: string, value: unknown) => void;
  applyMiniGameToSelectedNode: (updatedMiniGame: unknown) => void;
  deleteSelectedNode: () => void;
  /** Node-id-based choice mutations — apply to the given node, not the selection. */
  addChoiceToNode: (nodeId: string) => void;
  updateChoiceOnNode: (
    nodeId: string,
    index: number,
    field: string,
    value: unknown
  ) => void;
  removeChoiceFromNode: (nodeId: string, index: number) => void;
  /** Convenience wrappers for the sidebar/inspector, which edits the selection. */
  addChoiceToSelectedNode: () => void;
  addMultipleChoicesToSelectedNode: (
    rawCount: unknown
  ) => ChoicePathToolResult;
  generateDestinationNodesForSelectedNode: () => ChoicePathToolResult;
  generateChoicePathsForSelectedNode: (
    rawCount: unknown
  ) => ChoicePathToolResult;
  updateChoiceOnSelectedNode: (
    index: number,
    field: string,
    value: unknown
  ) => void;
  removeChoiceFromSelectedNode: (index: number) => void;
  connectNodesFromHandle: (
    connection: Connection | null | undefined
  ) => void;
  deleteEdge: (edgeId: string | null | undefined) => void;
  ensureOnboardingScaffold: (
    options?: EnsureOnboardingScaffoldOptions
  ) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function makeNodeId(): string {
  return `node_${Math.random().toString(36).slice(2, 10)}`;
}

function buildEdgesFromNodes(
  nodes: StoryNode[],
  characters: StoryCharacter[] = []
): StoryGraphEdge[] {
  const renderContext = { characters };
  return buildStoryEdgesFromNodes(nodes, renderStoryText, renderContext);
}

function normalizeInitialStory(
  story: StoryStateLoadSource | null | undefined
): NormalizedStory {
  const safeNodes = normalizeStoryNodes(
    Array.isArray(story?.nodes) ? story.nodes : []
  );
  const safeVariables: StoryVariables =
    story?.variables && typeof story.variables === "object"
      ? (story.variables as StoryVariables)
      : {};

  return {
    nodes: safeNodes,
    variables: safeVariables,
    variableMeta: normalizeVariableMeta(story?.variableMeta),
    characters: normalizeCharacters(story?.characters),
  };
}

function stableDemoSignature(
  nodes: StoryNode[],
  variables: StoryVariables,
  characters: StoryCharacter[],
  variableMeta: VariableMetaMap
): string {
  return JSON.stringify({ nodes, variables, characters, variableMeta });
}

export default function useStoryState(): UseStoryStateResult {
  /** `null` = blank project; otherwise id of the loaded starter template. */
  const [activeDemoStoryId, setActiveDemoStoryId] = useState<string | null>(
    null
  );

  const initial = useMemo(() => {
    const saved = loadEditorProject();
    if (saved) {
      return normalizeInitialStory(saved);
    }
    return normalizeInitialStory(createBlankStory());
  }, []);

  const [nodes, setNodesState] = useState<StoryNode[]>(initial.nodes);
  const [variables, setVariablesState] = useState<StoryVariables>(
    initial.variables
  );
  const [variableMeta, setVariableMetaState] = useState<VariableMetaMap>(
    initial.variableMeta
  );
  const [characters, setCharactersState] = useState<StoryCharacter[]>(
    initial.characters
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    () => initial.nodes[0]?.id || null
  );
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

  const historyRef = useRef<StoryUndoHistoryApi<StoryStateSnapshot> | null>(
    null
  );
  if (!historyRef.current) {
    historyRef.current = createStoryUndoHistory<StoryStateSnapshot>();
  }
  const [historyVersion, setHistoryVersion] = useState(0);

  const storyStateRef = useRef<StoryStateSnapshot>({
    nodes: initial.nodes,
    variables: initial.variables,
    variableMeta: initial.variableMeta,
    characters: initial.characters,
    selectedNodeId: initial.nodes[0]?.id || null,
    activeDemoStoryId: null,
  });

  storyStateRef.current = {
    nodes,
    variables,
    variableMeta,
    characters,
    selectedNodeId,
    activeDemoStoryId,
  };

  useEffect(
    () =>
      historyRef.current!.subscribe(() => {
        setHistoryVersion((value) => value + 1);
      }),
    []
  );

  function recordHistory({ immediate = false } = {}) {
    historyRef.current!.recordBeforeMutation(storyStateRef.current, {
      immediate,
    });
  }

  function clearHistory() {
    historyRef.current!.clear();
  }

  function restoreStorySnapshot(snapshot: StoryStateSnapshot) {
    historyRef.current!.runApplying(() => {
      setNodesState(snapshot.nodes);
      setVariablesState(snapshot.variables);
      setVariableMetaState(snapshot.variableMeta);
      setCharactersState(snapshot.characters);
      setActiveDemoStoryId(snapshot.activeDemoStoryId ?? null);

      const validSelectedId = snapshot.nodes.some(
        (node) => node.id === snapshot.selectedNodeId
      )
        ? snapshot.selectedNodeId
        : snapshot.nodes[0]?.id || null;

      setSelectedNodeId(validSelectedId);
    });
  }

  const undo = useCallback(() => {
    const previous = historyRef.current!.undo(storyStateRef.current);
    if (previous) {
      restoreStorySnapshot(previous);
    }
  }, []);

  const redo = useCallback(() => {
    const next = historyRef.current!.redo(storyStateRef.current);
    if (next) {
      restoreStorySnapshot(next);
    }
  }, []);

  const canUndo = useMemo(() => {
    void historyVersion;
    return historyRef.current!.canUndo();
  }, [historyVersion]);

  const canRedo = useMemo(() => {
    void historyVersion;
    return historyRef.current!.canRedo();
  }, [historyVersion]);

  function setVariables(updater: SetStateAction<StoryVariables>) {
    recordHistory();
    setVariablesState(updater);
  }

  function setVariableMeta(updater: SetStateAction<VariableMetaMap>) {
    recordHistory();
    setVariableMetaState(updater);
  }

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

  /** Persist working project to localStorage (debounced) so edits survive refresh. */
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      saveEditorProject({ nodes, variables, variableMeta, characters });
    }, 1500);

    return () => window.clearTimeout(timerId);
  }, [nodes, variables, variableMeta, characters]);

  /** @deprecated use isStoryDirty */
  const isDemoDirty = isStoryDirty;

  function loadDemoStory(storyId: string) {
    const raw = cloneDemoStoryById(storyId);
    if (!raw) return;

    const next = normalizeInitialStory(raw);

    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
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
    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
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

  function importStory(story: StoryStateLoadSource | null | undefined) {
    const next = normalizeInitialStory(story);
    clearHistory();
    setNodesState(next.nodes);
    setVariablesState(next.variables);
    setVariableMetaState(next.variableMeta);
    setCharactersState(next.characters);
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
    recordHistory({ immediate: true });
    const next = createCharacter();
    setCharactersState((prev) => [...prev, next]);
    return next.id;
  }

  function updateCharacter(
    characterId: string | null | undefined,
    patch: CharacterUpdatePatch
  ) {
    if (!characterId) return;
    recordHistory();
    setCharactersState((prev) =>
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
                    aliases: patch.aliases.filter(
                      (item) => typeof item === "string"
                    ),
                  }
                : {}),
            }
          : character
      )
    );
  }

  function deleteCharacter(characterId: string | null | undefined) {
    if (!characterId) return;
    recordHistory({ immediate: true });
    setCharactersState((prev) =>
      prev.filter((character) => character.id !== characterId)
    );
  }

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const edges = useMemo(() => {
    return buildEdgesFromNodes(nodes, characters);
  }, [nodes, characters]);

  function addNode() {
    recordHistory({ immediate: true });
    const nextId = makeNodeId();

    const newNode: StoryNode = {
      id: nextId,
      type: "storyNode",
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

    setNodesState((prev) => [...prev, newNode]);
    setSelectedNodeId(nextId);
  }

  function updateNodePosition(nodeId: string, position: StoryNodePosition) {
    recordHistory({ immediate: true });
    setNodesState((prev) =>
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

  function updateSelectedNodeField(field: string, value: unknown) {
    if (!selectedNodeId) return;

    recordHistory();
    setNodesState((prev) =>
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

  function applyMiniGameToSelectedNode(updatedMiniGame: unknown) {
    if (!selectedNodeId || !updatedMiniGame) return;

    recordHistory({ immediate: true });
    const dataPatch = miniGamePayloadToNodeData(updatedMiniGame);

    setNodesState((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...dataPatch,
              },
            }
          : node
      )
    );
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    recordHistory({ immediate: true });
    const nodeIdToDelete = selectedNodeId;

    setNodesState((prev) => {
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

  /**
   * Append a blank choice to a specific node. The node id is supplied by the
   * caller (e.g. a node's own "+ Choice" button), so the mutation never depends
   * on the asynchronously-updated selected node.
   */
  function addChoiceToNode(nodeId: string) {
    if (!nodeId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) => addChoiceToNodeInList(prev, nodeId));
  }

  function updateChoiceOnNode(
    nodeId: string,
    index: number,
    field: string,
    value: unknown
  ) {
    if (!nodeId) return;

    recordHistory();
    setNodesState((prev) =>
      updateChoiceOnNodeInList(prev, nodeId, index, field, value)
    );
  }

  function removeChoiceFromNode(nodeId: string, index: number) {
    if (!nodeId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) => removeChoiceFromNodeInList(prev, nodeId, index));
  }

  function addChoiceToSelectedNode() {
    if (!selectedNodeId) return;
    addChoiceToNode(selectedNodeId);
  }

  /**
   * Append N blank go-to choices to the selected narrative node (no destinations).
   */
  function addMultipleChoicesToSelectedNode(
    rawCount: unknown
  ): ChoicePathToolResult {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const parsed = parseChoiceCount(rawCount);
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const count = parsed.count;
    recordHistory({ immediate: true });
    setNodesState((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const existingChoices = node.data?.choices || [];
        let nextNumber = getNextChoiceLabelStart(existingChoices);
        const addedChoices: StoryChoice[] = Array.from(
          { length: count },
          () => {
            const choice = createBlankGoToChoice(`Choice ${nextNumber}`);
            nextNumber += 1;
            return choice;
          }
        );

        return {
          ...node,
          data: {
            ...node.data,
            choices: [...existingChoices, ...addedChoices],
          },
        };
      })
    );

    return {
      ok: true,
      added: count,
      message: `Added ${count} ${count === 1 ? "choice" : "choices"}.`,
    };
  }

  /**
   * For each unconnected choice on the selected narrative node, create a destination
   * node and wire targetNodeId. Existing connections are left untouched.
   */
  function generateDestinationNodesForSelectedNode(): ChoicePathToolResult {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const existingChoices = sourceNode.data?.choices || [];
    if (existingChoices.length === 0) {
      return { ok: false, message: "Add at least one choice first." };
    }

    const unconnectedIndexes = existingChoices
      .map((choice, index) => (isChoiceUnconnected(choice) ? index : -1))
      .filter((index) => index >= 0);

    if (unconnectedIndexes.length === 0) {
      return { ok: false, message: "All choices already have destinations." };
    }

    const occupied = storyStateRef.current.nodes.map((node) => node.position);
    const draftPositions = fanOutPositions(
      sourceNode.position,
      unconnectedIndexes.length
    );
    const resolvedPositions: StoryNodePosition[] = [];
    for (const draft of draftPositions) {
      const next = resolveOpenPosition(draft, [
        ...occupied,
        ...resolvedPositions,
      ]);
      resolvedPositions.push(next);
    }

    const destinationByChoiceIndex = new Map<number, string>();
    const newNodes: StoryNode[] = unconnectedIndexes.map(
      (choiceIndex, order) => {
        const choice = existingChoices[choiceIndex];
        const nodeId = makeNodeId();
        const title = choice?.label?.trim() || "New Block";
        destinationByChoiceIndex.set(choiceIndex, nodeId);
        return createNarrativeDestinationNode({
          id: nodeId,
          title,
          position: resolvedPositions[order],
        });
      }
    );

    recordHistory({ immediate: true });
    setNodesState((prev) => {
      const nextNodes = prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        const nextChoices = (node.data?.choices || []).map((choice, index) => {
          const targetId = destinationByChoiceIndex.get(index);
          if (!targetId || !isChoiceUnconnected(choice)) {
            return choice;
          }

          return {
            ...choice,
            targetNodeId: targetId,
          };
        });

        return {
          ...node,
          data: {
            ...node.data,
            choices: nextChoices,
          },
        };
      });

      return [...nextNodes, ...newNodes];
    });

    const created = newNodes.length;
    return {
      ok: true,
      created,
      message: `Generated ${created} destination ${created === 1 ? "node" : "nodes"}.`,
    };
  }

  /**
   * Add N new choices and create+connect a destination for each new choice only.
   * Does not fill destinations for pre-existing unconnected choices.
   */
  function generateChoicePathsForSelectedNode(
    rawCount: unknown
  ): ChoicePathToolResult {
    if (!selectedNodeId) {
      return { ok: false, message: "Select a narrative block first." };
    }

    const parsed = parseChoiceCount(rawCount);
    if (!parsed.ok) {
      return { ok: false, message: parsed.message };
    }

    const sourceNode = storyStateRef.current.nodes.find(
      (node) => node.id === selectedNodeId
    );
    if (!sourceNode) {
      return { ok: false, message: "Select a narrative block first." };
    }
    if ((sourceNode.data?.blockType || "narrative") !== "narrative") {
      return {
        ok: false,
        message: "Choice path tools are for narrative blocks.",
      };
    }

    const count = parsed.count;
    const existingChoices = sourceNode.data?.choices || [];
    let nextNumber = getNextChoiceLabelStart(existingChoices);

    const occupied = storyStateRef.current.nodes.map((node) => node.position);
    const draftPositions = fanOutPositions(sourceNode.position, count);
    const resolvedPositions: StoryNodePosition[] = [];
    for (const draft of draftPositions) {
      const next = resolveOpenPosition(draft, [
        ...occupied,
        ...resolvedPositions,
      ]);
      resolvedPositions.push(next);
    }

    const newChoices: StoryChoice[] = [];
    const newNodes: StoryNode[] = [];

    for (let index = 0; index < count; index += 1) {
      const label = `Choice ${nextNumber}`;
      nextNumber += 1;
      const nodeId = makeNodeId();
      newNodes.push(
        createNarrativeDestinationNode({
          id: nodeId,
          title: label,
          position: resolvedPositions[index],
        })
      );
      newChoices.push({
        ...createBlankGoToChoice(label),
        targetNodeId: nodeId,
      });
    }

    recordHistory({ immediate: true });
    setNodesState((prev) => {
      const nextNodes = prev.map((node) => {
        if (node.id !== selectedNodeId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            choices: [...(node.data?.choices || []), ...newChoices],
          },
        };
      });

      return [...nextNodes, ...newNodes];
    });

    return {
      ok: true,
      added: count,
      created: count,
      message: `Generated ${count} choice ${count === 1 ? "path" : "paths"}.`,
    };
  }

  function updateChoiceOnSelectedNode(
    index: number,
    field: string,
    value: unknown
  ) {
    if (!selectedNodeId) return;
    updateChoiceOnNode(selectedNodeId, index, field, value);
  }

  function removeChoiceFromSelectedNode(index: number) {
    if (!selectedNodeId) return;
    removeChoiceFromNode(selectedNodeId, index);
  }

  function connectNodesFromHandle(
    connection: Connection | null | undefined
  ) {
    const sourceId = connection?.source;
    const targetId = connection?.target;

    if (!sourceId || !targetId || sourceId === targetId) return;

    recordHistory({ immediate: true });
    // Route by source handle: generic drag → default transition (continueNodeId),
    // a choice handle → that choice's target, success/failure/timeout → their
    // link field. A generic connector never appends a new player choice.
    setNodesState((prevNodes) => applyConnectionInList(prevNodes, connection));

    setSelectedNodeId(sourceId);
  }

  function deleteEdge(edgeId: string | null | undefined) {
    if (!edgeId) return;

    recordHistory({ immediate: true });
    setNodesState((prev) => removeEdgeFromList(prev, edgeId));
  }

  const ensureOnboardingScaffold = useCallback(
    ({ seedChoices = false }: EnsureOnboardingScaffoldOptions = {}) => {
      let targetIdToSelect: string | null = null;

      setNodesState((prev) => {
        let next = [...prev];

        let targetId =
          selectedNodeIdRef.current &&
          next.some((node) => node.id === selectedNodeIdRef.current)
            ? selectedNodeIdRef.current
            : null;

        if (!targetId) {
          const existingScaffold = next.find(
            (node) =>
              node.id === ONBOARDING_SCAFFOLD_NODE_ID ||
              node.data?.isOnboardingScaffold
          );

          if (existingScaffold) {
            targetId = existingScaffold.id;
          } else if (next.length === 0) {
            const scaffold: StoryNode = {
              id: ONBOARDING_SCAFFOLD_NODE_ID,
              type: "storyNode",
              position: { x: 260, y: 120 },
              data: {
                title: "Tutorial Scene",
                content:
                  "Write what the player reads when they reach this scene.",
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
          const demoChoices = ensureChoiceIds(
            ONBOARDING_DEMO_CHOICES.map((choice) => ({ ...choice }))
          );
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
    },
    []
  );

  return {
    nodes,
    edges,
    variables,
    setVariables,
    variableMeta,
    setVariableMeta,
    characters,
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
    applyMiniGameToSelectedNode,
    deleteSelectedNode,
    addChoiceToNode,
    updateChoiceOnNode,
    removeChoiceFromNode,
    addChoiceToSelectedNode,
    addMultipleChoicesToSelectedNode,
    generateDestinationNodesForSelectedNode,
    generateChoicePathsForSelectedNode,
    updateChoiceOnSelectedNode,
    removeChoiceFromSelectedNode,
    connectNodesFromHandle,
    deleteEdge,
    ensureOnboardingScaffold,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
