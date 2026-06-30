import { useEffect, useMemo, useState } from "react";
import {
  buildMiniGameFromSelectedNode,
  isSupportedMiniGameBlock,
} from "../utils/miniGameFromNode";

function makeId(prefix = "item") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createChoiceWeightingOption() {
  return {
    id: makeId("option"),
    label: "",
    value: 0,
    correct: false,
    effects: [],
  };
}

function createPersuasionChoice() {
  return {
    id: makeId("choice"),
    text: "",
    delta: 0,
    response: "",
    successNodeId: "",
    failureNodeId: "",
  };
}

function createTraitOption() {
  return {
    id: makeId("trait"),
    label: "",
    value: "",
    description: "",
  };
}

export function createDefaultMiniGame(type = "choiceWeighting") {
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
          options: [createChoiceWeightingOption(), createChoiceWeightingOption()],
          totalPoints: 10,
          variablePrefix: "",
          resultVariable: "",
          lockExactTotal: true,
          continueNodeId: "",
        },
      };
  }
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function normalizeChoiceWeighting(game) {
  const defaults = createDefaultMiniGame("choiceWeighting");

  const merged = {
    ...defaults,
    ...clone(game || {}),
    config: {
      ...defaults.config,
      ...(clone(game?.config) || {}),
    },
  };

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

function normalizePersuasion(game) {
  const defaults = createDefaultMiniGame("persuasion");

  const merged = {
    ...defaults,
    ...clone(game || {}),
    config: {
      ...defaults.config,
      ...(clone(game?.config) || {}),
    },
  };

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

function normalizeTraitPicker(game) {
  const defaults = createDefaultMiniGame("traitPicker");

  const merged = {
    ...defaults,
    ...clone(game || {}),
    config: {
      ...defaults.config,
      ...(clone(game?.config) || {}),
    },
  };

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

function normalizeMiniGame(game) {
  let g = game;
  if (g && typeof g === "object" && g.type === "storyNode") {
    if (isSupportedMiniGameBlock(g)) {
      const rebuilt = buildMiniGameFromSelectedNode(g);
      if (rebuilt) g = rebuilt;
    }
  }

  const type = g?.type || "choiceWeighting";

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
}) {
  const normalizedGame = useMemo(() => {
    if (!game) return null;
    return normalizeMiniGame(game);
  }, [game]);

  const [draft, setDraft] = useState(normalizedGame);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState("config");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [previewState, setPreviewState] = useState(null);
  const [advancedJson, setAdvancedJson] = useState("");

  useEffect(() => {
    if (!open) return;

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
  }, [draft]);

  const items = useMemo(() => {
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

  const validation = useMemo(() => {
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

  function updateDraft(patch) {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateConfig(patch) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        ...patch,
      },
    }));
  }

  function replaceItems(nextItems) {
    setDraft((current) => {
      if (!current) return current;

      if (current.type === "persuasion") {
        return {
          ...current,
          config: {
            ...current.config,
            choices: nextItems,
          },
        };
      }

      return {
        ...current,
        config: {
          ...current.config,
          options: nextItems,
        },
      };
    });
  }

  function updateItem(itemId, patch) {
    replaceItems(
      items.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  }

  function addItem() {
    let nextItem = null;

    if (draft.type === "persuasion") {
      nextItem = createPersuasionChoice();
      replaceItems([...(draft.config.choices || []), nextItem]);
    } else if (draft.type === "traitPicker") {
      nextItem = createTraitOption();
      replaceItems([...(draft.config.options || []), nextItem]);
    } else {
      nextItem = createChoiceWeightingOption();
      replaceItems([...(draft.config.options || []), nextItem]);
    }

    setSelectedItemId(nextItem.id);
  }

  function removeItem(itemId) {
    const nextItems = items.filter((item) => item.id !== itemId);

    if (nextItems.length === 0) {
      if (draft.type === "persuasion") {
        nextItems.push(createPersuasionChoice());
      } else if (draft.type === "traitPicker") {
        nextItems.push(createTraitOption());
      } else {
        nextItems.push(createChoiceWeightingOption());
      }
    }

    replaceItems(nextItems);
    setSelectedItemId(nextItems[0]?.id ?? null);
  }

  function moveItem(itemId, direction) {
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const reordered = [...items];
    const [item] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, item);

    replaceItems(reordered);
  }

  function applyAdvancedJson() {
    try {
      const parsed = JSON.parse(advancedJson);
      const normalized = normalizeMiniGame(parsed);
      setDraft(normalized);

      if (normalized.type === "persuasion") {
        setSelectedItemId(normalized.config.choices?.[0]?.id ?? null);
      } else {
        setSelectedItemId(normalized.config.options?.[0]?.id ?? null);
      }
    } catch (error) {
      console.error("Invalid mini-game JSON:", error);
    }
  }

  function runPreview(payload = {}) {
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

      const result = {
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

      const result = {
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

      const result = {
        type: "traitPicker",
        selectedIds,
        selectedValues: selectedOptions.map((option) => option.value || option.label),
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
    setAdvancedJson,
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
  };
}