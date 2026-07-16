import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { MiniGameBlockType } from "../types/minigames";
import {
  buildMiniGameFromSelectedNode,
  isSupportedMiniGameBlock,
} from "../utils/miniGameFromNode";
import {
  createStoryUndoHistory,
  type StoryUndoHistoryApi,
} from "../utils/storyUndoHistory";

/** Editor list item for choice-weighting drafts (not WeightedOption). */
export interface MiniGameEditorChoiceWeightingOption {
  id: string;
  label: string;
  value: number;
  correct: boolean;
  effects: unknown[];
}

/** Editor persuasion line — includes per-line node ids the runtime block omits. */
export interface MiniGameEditorPersuasionChoice {
  id: string;
  text: string;
  delta: number;
  response: string;
  successNodeId: string;
  failureNodeId: string;
}

/** Editor trait row — includes `value`; canonical TraitOption uses effects instead. */
export interface MiniGameEditorTraitOption {
  id: string;
  label: string;
  value: string;
  description: string;
}

export type MiniGameEditorItem =
  | MiniGameEditorChoiceWeightingOption
  | MiniGameEditorPersuasionChoice
  | MiniGameEditorTraitOption;

export interface MiniGameEditorChoiceWeightingConfig {
  options: MiniGameEditorChoiceWeightingOption[];
  totalPoints: number;
  variablePrefix: string;
  resultVariable: string;
  lockExactTotal: boolean;
  continueNodeId: string;
}

export interface MiniGameEditorPersuasionConfig {
  targetName: string;
  startScore: number;
  minScore: number;
  maxScore: number;
  threshold: number;
  maxTurns: number;
  visibleMeter: boolean;
  scoreVariable: string;
  successVariable: string;
  successNodeId: string;
  failureNodeId: string;
  choices: MiniGameEditorPersuasionChoice[];
}

export interface MiniGameEditorTraitPickerConfig {
  options: MiniGameEditorTraitOption[];
  minSelections: number;
  maxSelections: number;
  traitListVariable: string;
  continueNodeId: string;
}

export interface MiniGameEditorChoiceWeightingDraft {
  title: string;
  type: "choiceWeighting";
  prompt: string;
  config: MiniGameEditorChoiceWeightingConfig;
}

export interface MiniGameEditorPersuasionDraft {
  title: string;
  type: "persuasion";
  prompt: string;
  config: MiniGameEditorPersuasionConfig;
}

export interface MiniGameEditorTraitPickerDraft {
  title: string;
  type: "traitPicker";
  prompt: string;
  config: MiniGameEditorTraitPickerConfig;
}

/**
 * Normalized editable mini-game document used by the editor shell.
 * Distinct from flat StoryPlayMiniGameBlock persisted/runtime shape.
 */
export type MiniGameEditorDraft =
  | MiniGameEditorChoiceWeightingDraft
  | MiniGameEditorPersuasionDraft
  | MiniGameEditorTraitPickerDraft;

export type MiniGameEditorTab = "config" | "logic" | "advanced";

export interface MiniGameEditorValidation {
  hasPrompt: boolean;
  hasEnoughItems: boolean;
  exactTotalOk: boolean;
  isValid: boolean;
}

export interface MiniGameEditorPreviewPayload {
  selectedIds?: string[];
  selectedChoiceId?: string | null;
}

export interface ChoiceWeightingEditorPreviewResult {
  type: "choiceWeighting";
  score: number;
  totalPoints: number;
  lockExactTotal: boolean;
  status: string;
  selectedIds: string[];
}

export interface PersuasionEditorPreviewResult {
  type: "persuasion";
  selectedChoiceId: string | null;
  scoreBefore: number;
  scoreAfter: number;
  success: boolean;
  response: string;
}

export interface TraitPickerEditorPreviewResult {
  type: "traitPicker";
  selectedIds: string[];
  selectedValues: string[];
  count: number;
  minSelections: number;
  maxSelections: number;
}

export type MiniGameEditorPreviewResult =
  | ChoiceWeightingEditorPreviewResult
  | PersuasionEditorPreviewResult
  | TraitPickerEditorPreviewResult;

export interface UseMiniGameEditorStateParams {
  open: boolean;
  /** Editor payload, story node, or other legacy input — narrowed inside normalize. */
  game: unknown;
  onSave?: (draft: MiniGameEditorDraft) => void;
  onClose?: () => void;
}

export interface UseMiniGameEditorStateResult {
  draft: MiniGameEditorDraft | null;
  setDraft: Dispatch<SetStateAction<MiniGameEditorDraft | null>>;
  activeTab: MiniGameEditorTab;
  setActiveTab: Dispatch<SetStateAction<MiniGameEditorTab>>;
  selectedItemId: string | null;
  setSelectedItemId: Dispatch<SetStateAction<string | null>>;
  selectedItem: MiniGameEditorItem | null;
  items: MiniGameEditorItem[];
  previewState: MiniGameEditorPreviewResult | null;
  totalAssigned: number;
  validation: MiniGameEditorValidation;
  isDirty: boolean;
  advancedJson: string;
  advancedJsonError: string;
  setAdvancedJson: Dispatch<SetStateAction<string>>;
  setAdvancedJsonError: Dispatch<SetStateAction<string>>;
  updateDraft: (patch: Partial<{ title: string; prompt: string; type: MiniGameBlockType }>) => void;
  updateConfig: (
    patch: Partial<
      MiniGameEditorChoiceWeightingConfig &
        MiniGameEditorPersuasionConfig &
        MiniGameEditorTraitPickerConfig
    >
  ) => void;
  updateItem: (itemId: string, patch: Partial<MiniGameEditorItem>) => void;
  addItem: () => void;
  removeItem: (itemId: string) => void;
  moveItem: (itemId: string, direction: "up" | "down") => void;
  applyAdvancedJson: () => void;
  runPreview: (
    payload?: MiniGameEditorPreviewPayload
  ) => MiniGameEditorPreviewResult | null;
  handleSave: () => void;
  handleBack: () => void;
  handleDiscard: () => void;
  handleClose: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface MiniGameEditorHistorySnapshot {
  draft: MiniGameEditorDraft | null;
  selectedItemId: string | null;
}

function makeId(prefix = "item"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createChoiceWeightingOption(): MiniGameEditorChoiceWeightingOption {
  return {
    id: makeId("option"),
    label: "",
    value: 0,
    correct: false,
    effects: [],
  };
}

function createPersuasionChoice(): MiniGameEditorPersuasionChoice {
  return {
    id: makeId("choice"),
    text: "",
    delta: 0,
    response: "",
    successNodeId: "",
    failureNodeId: "",
  };
}

function createTraitOption(): MiniGameEditorTraitOption {
  return {
    id: makeId("trait"),
    label: "",
    value: "",
    description: "",
  };
}

export function createDefaultMiniGame(
  type: "traitPicker"
): MiniGameEditorTraitPickerDraft;
export function createDefaultMiniGame(
  type: "persuasion"
): MiniGameEditorPersuasionDraft;
export function createDefaultMiniGame(
  type?: "choiceWeighting"
): MiniGameEditorChoiceWeightingDraft;
export function createDefaultMiniGame(
  type?: string
): MiniGameEditorDraft;
export function createDefaultMiniGame(
  type: string = "choiceWeighting"
): MiniGameEditorDraft {
  switch (type) {
    case "traitPicker":
      return {
        title: "Trait Picker",
        type: "traitPicker",
        prompt: "",
        config: {
          options: [createTraitOption(), createTraitOption()],
          minSelections: 0,
          maxSelections: 2,
          traitListVariable: "",
          continueNodeId: "",
        },
      };

    case "persuasion":
      return {
        title: "Persuasion",
        type: "persuasion",
        prompt: "",
        config: {
          targetName: "",
          startScore: 50,
          minScore: 0,
          maxScore: 100,
          threshold: 75,
          maxTurns: 3,
          visibleMeter: true,
          scoreVariable: "",
          successVariable: "",
          successNodeId: "",
          failureNodeId: "",
          choices: [createPersuasionChoice(), createPersuasionChoice()],
        },
      };

    case "choiceWeighting":
    default:
      return {
        title: "Choice Weighting",
        type: "choiceWeighting",
        prompt: "",
        config: {
          options: [
            createChoiceWeightingOption(),
            createChoiceWeightingOption(),
          ],
          totalPoints: 10,
          variablePrefix: "",
          resultVariable: "",
          lockExactTotal: true,
          continueNodeId: "",
        },
      };
  }
}

function clone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function normalizeChoiceWeighting(game: unknown): MiniGameEditorChoiceWeightingDraft {
  const defaults = createDefaultMiniGame("choiceWeighting");
  const source = (game || {}) as Partial<MiniGameEditorChoiceWeightingDraft>;

  const merged = {
    ...defaults,
    ...clone(source),
    config: {
      ...defaults.config,
      ...(clone(source?.config) || {}),
    },
  } as MiniGameEditorChoiceWeightingDraft;

  const options = Array.isArray(merged.config.options) ? merged.config.options : [];
  merged.config.options =
    options.length > 0
      ? options.map((option) => ({
          id: option.id || makeId("option"),
          label: option.label ?? "",
          value: Number(option.value ?? 0),
          correct: Boolean(option.correct),
          effects: Array.isArray(option.effects) ? option.effects : [],
        }))
      : [createChoiceWeightingOption(), createChoiceWeightingOption()];

  merged.config.continueNodeId =
    typeof merged.config.continueNodeId === "string"
      ? merged.config.continueNodeId
      : "";

  return merged;
}

function normalizePersuasion(game: unknown): MiniGameEditorPersuasionDraft {
  const defaults = createDefaultMiniGame("persuasion");
  const source = (game || {}) as Partial<MiniGameEditorPersuasionDraft>;

  const merged = {
    ...defaults,
    ...clone(source),
    config: {
      ...defaults.config,
      ...(clone(source?.config) || {}),
    },
  } as MiniGameEditorPersuasionDraft;

  const choices = Array.isArray(merged.config.choices) ? merged.config.choices : [];
  merged.config.choices =
    choices.length > 0
      ? choices.map((choice) => ({
          id: choice.id || makeId("choice"),
          text: choice.text ?? "",
          delta: Number(choice.delta ?? 0),
          response: choice.response ?? "",
          successNodeId: choice.successNodeId ?? "",
          failureNodeId: choice.failureNodeId ?? "",
        }))
      : [createPersuasionChoice(), createPersuasionChoice()];

  return merged;
}

function normalizeTraitPicker(game: unknown): MiniGameEditorTraitPickerDraft {
  const defaults = createDefaultMiniGame("traitPicker");
  const source = (game || {}) as Partial<MiniGameEditorTraitPickerDraft>;

  const merged = {
    ...defaults,
    ...clone(source),
    config: {
      ...defaults.config,
      ...(clone(source?.config) || {}),
    },
  } as MiniGameEditorTraitPickerDraft;

  const options = Array.isArray(merged.config.options) ? merged.config.options : [];
  merged.config.options =
    options.length > 0
      ? options.map((option) => ({
          id: option.id || makeId("trait"),
          label: option.label ?? "",
          value: option.value ?? "",
          description: option.description ?? "",
        }))
      : [createTraitOption(), createTraitOption()];

  merged.config.continueNodeId =
    typeof merged.config.continueNodeId === "string"
      ? merged.config.continueNodeId
      : "";

  return merged;
}

function normalizeMiniGame(game: unknown): MiniGameEditorDraft {
  let g: unknown = game;
  if (g && typeof g === "object" && (g as { type?: unknown }).type === "storyNode") {
    if (isSupportedMiniGameBlock(g)) {
      const rebuilt = buildMiniGameFromSelectedNode(g);
      if (rebuilt) g = rebuilt;
    }
  }

  const type =
    (g && typeof g === "object"
      ? (g as { type?: unknown }).type
      : undefined) || "choiceWeighting";

  switch (type) {
    case "traitPicker":
      return normalizeTraitPicker(g);
    case "persuasion":
      return normalizePersuasion(g);
    case "choiceWeighting":
    default:
      return normalizeChoiceWeighting(g);
  }
}

export default function useMiniGameEditorState({
  open,
  game,
  onSave,
  onClose,
}: UseMiniGameEditorStateParams): UseMiniGameEditorStateResult {
  const normalizedGame = useMemo(() => {
    if (!game) return null;
    return normalizeMiniGame(game);
  }, [game]);

  const [draft, setDraft] = useState<MiniGameEditorDraft | null>(normalizedGame);
  const [savedSnapshot, setSavedSnapshot] = useState<MiniGameEditorDraft | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<MiniGameEditorTab>("config");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [previewState, setPreviewState] =
    useState<MiniGameEditorPreviewResult | null>(null);
  const [advancedJson, setAdvancedJson] = useState("");
  const [advancedJsonError, setAdvancedJsonError] = useState("");

  const historyRef =
    useRef<StoryUndoHistoryApi<MiniGameEditorHistorySnapshot> | null>(null);
  if (!historyRef.current) {
    historyRef.current =
      createStoryUndoHistory<MiniGameEditorHistorySnapshot>();
  }
  const [historyVersion, setHistoryVersion] = useState(0);

  const draftRef = useRef(draft);
  const selectedItemIdRef = useRef(selectedItemId);
  draftRef.current = draft;
  selectedItemIdRef.current = selectedItemId;

  const editorSnapshotRef = useRef<MiniGameEditorHistorySnapshot>({
    draft,
    selectedItemId,
  });
  editorSnapshotRef.current = { draft, selectedItemId };

  useEffect(
    () =>
      historyRef.current!.subscribe(() => {
        setHistoryVersion((value) => value + 1);
      }),
    []
  );

  function recordDraftHistory({ immediate = false } = {}) {
    if (!draftRef.current) return;
    historyRef.current!.recordBeforeMutation(editorSnapshotRef.current, {
      immediate,
    });
  }

  function resolveSelectedItemId(
    nextDraft: MiniGameEditorDraft | null,
    preferredId: string | null | undefined
  ): string | null {
    if (!nextDraft) return null;

    const nextItems =
      nextDraft.type === "persuasion"
        ? nextDraft.config?.choices || []
        : nextDraft.config?.options || [];

    if (nextItems.some((item) => item.id === preferredId)) {
      return preferredId as string | null;
    }

    return nextItems[0]?.id ?? null;
  }

  function restoreEditorSnapshot(snapshot: MiniGameEditorHistorySnapshot) {
    if (!snapshot.draft) return;

    historyRef.current!.runApplying(() => {
      const nextDraft = clone(snapshot.draft);
      setDraft(nextDraft);
      setSelectedItemId(
        resolveSelectedItemId(nextDraft, snapshot.selectedItemId)
      );
      setPreviewState(null);
    });
  }

  const undo = useCallback(() => {
    const previous = historyRef.current!.undo(editorSnapshotRef.current);
    if (previous) {
      restoreEditorSnapshot(previous);
    }
  }, []);

  const redo = useCallback(() => {
    const next = historyRef.current!.redo(editorSnapshotRef.current);
    if (next) {
      restoreEditorSnapshot(next);
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

  useEffect(() => {
    if (!open) return;

    historyRef.current!.clear();

    const nextDraft = normalizedGame || createDefaultMiniGame("choiceWeighting");
    setDraft(nextDraft);
    setSavedSnapshot(clone(nextDraft));
    setActiveTab("config");
    setPreviewState(null);
    setAdvancedJson(JSON.stringify(nextDraft, null, 2));

    if (nextDraft.type === "choiceWeighting") {
      setSelectedItemId(nextDraft.config.options?.[0]?.id ?? null);
    } else if (nextDraft.type === "persuasion") {
      setSelectedItemId(nextDraft.config.choices?.[0]?.id ?? null);
    } else if (nextDraft.type === "traitPicker") {
      setSelectedItemId(nextDraft.config.options?.[0]?.id ?? null);
    } else {
      setSelectedItemId(null);
    }
  }, [open, normalizedGame]);

  useEffect(() => {
    if (!draft) return;
    setAdvancedJson(JSON.stringify(draft, null, 2));
    setAdvancedJsonError("");
  }, [draft]);

  const items = useMemo((): MiniGameEditorItem[] => {
    if (!draft) return [];

    switch (draft.type) {
      case "persuasion":
        return draft.config.choices || [];
      case "traitPicker":
      case "choiceWeighting":
      default:
        return draft.config.options || [];
    }
  }, [draft]);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const totalAssigned = useMemo(() => {
    if (!draft || draft.type !== "choiceWeighting") return 0;
    return (draft.config.options || []).reduce(
      (sum, option) => sum + Number(option.value || 0),
      0
    );
  }, [draft]);

  const validation = useMemo((): MiniGameEditorValidation => {
    if (!draft) {
      return {
        hasPrompt: false,
        hasEnoughItems: false,
        exactTotalOk: true,
        isValid: false,
      };
    }

    const hasPrompt = Boolean(draft.prompt?.trim());

    if (draft.type === "choiceWeighting") {
      const hasEnoughItems = (draft.config.options?.length || 0) >= 2;
      const exactTotalOk = draft.config.lockExactTotal
        ? totalAssigned === Number(draft.config.totalPoints || 0)
        : true;

      return {
        hasPrompt,
        hasEnoughItems,
        exactTotalOk,
        isValid: hasPrompt && hasEnoughItems && exactTotalOk,
      };
    }

    if (draft.type === "persuasion") {
      const hasEnoughItems = (draft.config.choices?.length || 0) >= 2;
      return {
        hasPrompt,
        hasEnoughItems,
        exactTotalOk: true,
        isValid: hasPrompt && hasEnoughItems,
      };
    }

    if (draft.type === "traitPicker") {
      const hasEnoughItems = (draft.config.options?.length || 0) >= 2;
      return {
        hasPrompt,
        hasEnoughItems,
        exactTotalOk: true,
        isValid: hasPrompt && hasEnoughItems,
      };
    }

    return {
      hasPrompt,
      hasEnoughItems: false,
      exactTotalOk: true,
      isValid: false,
    };
  }, [draft, totalAssigned]);

  const isDirty = useMemo(() => {
    if (!draft || !savedSnapshot) return false;
    return JSON.stringify(draft) !== JSON.stringify(savedSnapshot);
  }, [draft, savedSnapshot]);

  function updateDraft(
    patch: Partial<{ title: string; prompt: string; type: MiniGameBlockType }>
  ) {
    recordDraftHistory();
    setDraft((current) =>
      ({
        ...current,
        ...patch,
      }) as MiniGameEditorDraft
    );
  }

  function updateConfig(
    patch: Partial<
      MiniGameEditorChoiceWeightingConfig &
        MiniGameEditorPersuasionConfig &
        MiniGameEditorTraitPickerConfig
    >
  ) {
    recordDraftHistory();
    setDraft((current) =>
      ({
        ...current,
        config: {
          ...(current as MiniGameEditorDraft).config,
          ...patch,
        },
      }) as MiniGameEditorDraft
    );
  }

  function replaceItems(nextItems: MiniGameEditorItem[]) {
    setDraft((current) => {
      if (!current) return current;

      if (current.type === "persuasion") {
        return {
          ...current,
          config: {
            ...current.config,
            choices: nextItems as MiniGameEditorPersuasionChoice[],
          },
        };
      }

      if (current.type === "traitPicker") {
        return {
          ...current,
          config: {
            ...current.config,
            options: nextItems as MiniGameEditorTraitOption[],
          },
        };
      }

      return {
        ...current,
        config: {
          ...current.config,
          options: nextItems as MiniGameEditorChoiceWeightingOption[],
        },
      };
    });
  }

  function updateItem(itemId: string, patch: Partial<MiniGameEditorItem>) {
    recordDraftHistory();
    replaceItems(
      items.map((item) =>
        item.id === itemId ? ({ ...item, ...patch } as MiniGameEditorItem) : item
      )
    );
  }

  function addItem() {
    recordDraftHistory({ immediate: true });
    let nextItem: MiniGameEditorItem | null = null;

    if (draft!.type === "persuasion") {
      nextItem = createPersuasionChoice();
      replaceItems([...(draft!.config.choices || []), nextItem]);
    } else if (draft!.type === "traitPicker") {
      nextItem = createTraitOption();
      replaceItems([...(draft!.config.options || []), nextItem]);
    } else {
      nextItem = createChoiceWeightingOption();
      replaceItems([...(draft!.config.options || []), nextItem]);
    }

    setSelectedItemId(nextItem.id);
  }

  function removeItem(itemId: string) {
    recordDraftHistory({ immediate: true });
    const nextItems = items.filter((item) => item.id !== itemId);

    if (nextItems.length === 0) {
      if (draft!.type === "persuasion") {
        nextItems.push(createPersuasionChoice());
      } else if (draft!.type === "traitPicker") {
        nextItems.push(createTraitOption());
      } else {
        nextItems.push(createChoiceWeightingOption());
      }
    }

    replaceItems(nextItems);
    setSelectedItemId(nextItems[0]?.id ?? null);
  }

  function moveItem(itemId: string, direction: "up" | "down") {
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    recordDraftHistory({ immediate: true });
    const reordered = [...items];
    const [item] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, item);

    replaceItems(reordered);
  }

  function applyAdvancedJson() {
    try {
      const parsed: unknown = JSON.parse(advancedJson);
      const normalized = normalizeMiniGame(parsed);
      recordDraftHistory({ immediate: true });
      setDraft(normalized);
      setAdvancedJsonError("");

      if (normalized.type === "persuasion") {
        setSelectedItemId(normalized.config.choices?.[0]?.id ?? null);
      } else {
        setSelectedItemId(normalized.config.options?.[0]?.id ?? null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON";
      setAdvancedJsonError(message);
      console.error("Invalid mini-game JSON:", error);
    }
  }

  function runPreview(
    payload: MiniGameEditorPreviewPayload = {}
  ): MiniGameEditorPreviewResult | null {
    if (!draft) return null;

    if (draft.type === "choiceWeighting") {
      const selectedIds = payload.selectedIds || [];
      const selectedOptions = (draft.config.options || []).filter((option) =>
        selectedIds.includes(option.id)
      );

      const score = selectedOptions.reduce(
        (sum, option) => sum + Number(option.value || 0),
        0
      );

      const totalPoints = Number(draft.config.totalPoints || 0);
      const lockExactTotal = Boolean(draft.config.lockExactTotal);

      let status = "incomplete";
      if (lockExactTotal && score === totalPoints) status = "success";
      else if (!lockExactTotal && score >= totalPoints) status = "success";
      else if (score > totalPoints) status = "overflow";

      const result: ChoiceWeightingEditorPreviewResult = {
        type: "choiceWeighting",
        score,
        totalPoints,
        lockExactTotal,
        status,
        selectedIds,
      };

      setPreviewState(result);
      return result;
    }

    if (draft.type === "persuasion") {
      const selectedChoiceId = payload.selectedChoiceId || null;
      const selectedChoice = (draft.config.choices || []).find(
        (choice) => choice.id === selectedChoiceId
      );

      const startScore = Number(draft.config.startScore || 0);
      const nextScore = Math.max(
        Number(draft.config.minScore || 0),
        Math.min(
          Number(draft.config.maxScore || 100),
          startScore + Number(selectedChoice?.delta || 0)
        )
      );

      const success = nextScore >= Number(draft.config.threshold || 0);

      const result: PersuasionEditorPreviewResult = {
        type: "persuasion",
        selectedChoiceId,
        scoreBefore: startScore,
        scoreAfter: nextScore,
        success,
        response: selectedChoice?.response || "",
      };

      setPreviewState(result);
      return result;
    }

    if (draft.type === "traitPicker") {
      const selectedIds = payload.selectedIds || [];
      const selectedOptions = (draft.config.options || []).filter((option) =>
        selectedIds.includes(option.id)
      );

      const result: TraitPickerEditorPreviewResult = {
        type: "traitPicker",
        selectedIds,
        selectedValues: selectedOptions.map(
          (option) => option.value || option.label
        ),
        count: selectedOptions.length,
        minSelections: Number(draft.config.minSelections || 0),
        maxSelections: Number(draft.config.maxSelections || 0),
      };

      setPreviewState(result);
      return result;
    }

    return null;
  }

  function handleSave() {
    if (!draft) return;
    onSave?.(clone(draft));
    setSavedSnapshot(clone(draft));
  }

  function handleBack() {
    if (!draft) {
      onClose?.();
      return;
    }

    onSave?.(clone(draft));
  }

  function handleDiscard() {
    if (isDirty) {
      const shouldDiscard = window.confirm(
        "Discard unsaved mini-game changes?"
      );
      if (!shouldDiscard) return;
    }

    onClose?.();
  }

  function handleClose() {
    handleBack();
  }

  return {
    draft,
    setDraft,
    activeTab,
    setActiveTab,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    items,
    previewState,
    totalAssigned,
    validation,
    isDirty,
    advancedJson,
    advancedJsonError,
    setAdvancedJson,
    setAdvancedJsonError,
    updateDraft,
    updateConfig,
    updateItem,
    addItem,
    removeItem,
    moveItem,
    applyAdvancedJson,
    runPreview,
    handleSave,
    handleBack,
    handleDiscard,
    handleClose,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
