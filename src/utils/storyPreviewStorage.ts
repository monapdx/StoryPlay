/** localStorage key for "Play in new tab" snapshot (same shape as editor: nodes + variables). */
import { normalizeVariableMeta } from "./storyVariables";
import type { StoryVariables, VariableMetaMap } from "../types/storyCore";

export const STORYPLAY_PREVIEW_STORAGE_KEY = "storyplay-current-preview";

/** BroadcastChannel name so play tabs can refresh when the snapshot updates. */
export const STORYPLAY_PREVIEW_BROADCAST_CHANNEL = "storyplay-preview-sync";

/**
 * Session flag (per browser tab): after the first "Play in new tab" from this editor tab,
 * debounced pushes keep the preview snapshot aligned while you edit.
 */
export const STORYPLAY_LIVE_PREVIEW_SESSION_KEY =
  "storyplay-live-preview-enabled";

/**
 * Preview snapshot after loadStoryForPreview storage/JSON checks.
 * nodes/characters are only proven to be arrays — not StoryNode[] / StoryCharacter[].
 */
export interface StoryPreviewSnapshot {
  nodes: unknown[];
  variables: StoryVariables;
  variableMeta: VariableMetaMap;
  characters: unknown[];
  selectedNodeId: string | null;
  savedAt?: string;
}

/** Loose save input from the editor / import flows. */
export interface SaveStoryPreviewInput {
  nodes: unknown;
  variables?: unknown;
  variableMeta?: unknown;
  characters?: unknown;
  selectedNodeId?: string | null;
}

export function notifyPreviewTabs(): void {
  try {
    const bc = new BroadcastChannel(STORYPLAY_PREVIEW_BROADCAST_CHANNEL);
    bc.postMessage({ type: "storyplay-preview-updated", at: Date.now() });
    bc.close();
  } catch {
    /* BroadcastChannel may be unavailable (privacy mode, old engines) */
  }
}

export function enableLivePreviewSyncForEditorTab(): void {
  try {
    sessionStorage.setItem(STORYPLAY_LIVE_PREVIEW_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isLivePreviewSyncEnabled(): boolean {
  try {
    return sessionStorage.getItem(STORYPLAY_LIVE_PREVIEW_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Persist current graph + variables for the standalone hash player tab.
 * Does not change the in-memory story model—only serializes it.
 */
export function saveCurrentStoryForPreview({
  nodes,
  variables,
  variableMeta,
  characters,
  selectedNodeId,
}: SaveStoryPreviewInput): void {
  const payload = {
    nodes,
    variables:
      variables && typeof variables === "object" ? variables : {},
    variableMeta:
      variableMeta &&
      typeof variableMeta === "object" &&
      !Array.isArray(variableMeta)
        ? variableMeta
        : {},
    characters: Array.isArray(characters) ? characters : [],
    selectedNodeId: selectedNodeId ?? null,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORYPLAY_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  notifyPreviewTabs();
}

export function loadStoryForPreview(): StoryPreviewSnapshot | null {
  try {
    const raw = localStorage.getItem(STORYPLAY_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown> | null;
    if (!data || !Array.isArray(data.nodes)) return null;
    const variables =
      data.variables &&
      typeof data.variables === "object" &&
      !Array.isArray(data.variables)
        ? (data.variables as StoryVariables)
        : {};
    const characters = Array.isArray(data.characters) ? data.characters : [];
    const variableMeta = normalizeVariableMeta(data.variableMeta);
    const selectedNodeId =
      typeof data.selectedNodeId === "string" ? data.selectedNodeId : null;
    return {
      nodes: data.nodes,
      variables,
      variableMeta,
      characters,
      selectedNodeId,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : undefined,
    };
  } catch {
    return null;
  }
}
