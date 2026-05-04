/** localStorage key for "Play in new tab" snapshot (same shape as editor: nodes + variables). */
export const STORYPLAY_PREVIEW_STORAGE_KEY = "storyplay-current-preview";

/** BroadcastChannel name so play tabs can refresh when the snapshot updates. */
export const STORYPLAY_PREVIEW_BROADCAST_CHANNEL = "storyplay-preview-sync";

/**
 * Session flag (per browser tab): after the first "Play in new tab" from this editor tab,
 * debounced pushes keep the preview snapshot aligned while you edit.
 */
export const STORYPLAY_LIVE_PREVIEW_SESSION_KEY = "storyplay-live-preview-enabled";

export function notifyPreviewTabs() {
  try {
    const bc = new BroadcastChannel(STORYPLAY_PREVIEW_BROADCAST_CHANNEL);
    bc.postMessage({ type: "storyplay-preview-updated", at: Date.now() });
    bc.close();
  } catch {
    /* BroadcastChannel may be unavailable (privacy mode, old engines) */
  }
}

export function enableLivePreviewSyncForEditorTab() {
  try {
    sessionStorage.setItem(STORYPLAY_LIVE_PREVIEW_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isLivePreviewSyncEnabled() {
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
export function saveCurrentStoryForPreview({ nodes, variables, selectedNodeId }) {
  const payload = {
    nodes,
    variables:
      variables && typeof variables === "object" ? variables : {},
    selectedNodeId: selectedNodeId ?? null,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORYPLAY_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  notifyPreviewTabs();
}

/**
 * @returns {null | { nodes: unknown[], variables: Record<string, unknown>, selectedNodeId: string | null, savedAt?: string }}
 */
export function loadStoryForPreview() {
  try {
    const raw = localStorage.getItem(STORYPLAY_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.nodes)) return null;
    const variables =
      data.variables && typeof data.variables === "object" && !Array.isArray(data.variables)
        ? data.variables
        : {};
    const selectedNodeId =
      typeof data.selectedNodeId === "string" ? data.selectedNodeId : null;
    return {
      nodes: data.nodes,
      variables,
      selectedNodeId,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : undefined,
    };
  } catch {
    return null;
  }
}
