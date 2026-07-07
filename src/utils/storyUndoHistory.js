const DEFAULT_MAX_HISTORY = 50;
const DEFAULT_DEBOUNCE_MS = 400;

export function cloneStorySnapshot(snapshot) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(snapshot);
    }
  } catch {
    /* fall through */
  }

  return JSON.parse(JSON.stringify(snapshot));
}

/**
 * Snapshot-based undo/redo for editor story state.
 * Debounced `recordBeforeMutation` groups rapid edits (typing) into one undo step.
 */
export function createStoryUndoHistory({
  maxSize = DEFAULT_MAX_HISTORY,
  debounceMs = DEFAULT_DEBOUNCE_MS,
} = {}) {
  const past = [];
  const future = [];
  let pendingSnapshot = null;
  let debounceTimer = null;
  let isApplying = false;
  let version = 0;
  const listeners = new Set();

  function notify() {
    version += 1;
    listeners.forEach((listener) => listener(version));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function pushPast(snapshot) {
    past.push(cloneStorySnapshot(snapshot));
    if (past.length > maxSize) {
      past.shift();
    }
    future.length = 0;
    notify();
  }

  function flushPending() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (pendingSnapshot) {
      pushPast(pendingSnapshot);
      pendingSnapshot = null;
    }
  }

  function recordBeforeMutation(snapshot, { immediate = false } = {}) {
    if (isApplying) return;

    if (immediate) {
      flushPending();
      pushPast(cloneStorySnapshot(snapshot));
      return;
    }

    if (!pendingSnapshot) {
      pendingSnapshot = cloneStorySnapshot(snapshot);
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (pendingSnapshot) {
        pushPast(pendingSnapshot);
        pendingSnapshot = null;
      }
    }, debounceMs);
  }

  function clear() {
    flushPending();
    past.length = 0;
    future.length = 0;
    notify();
  }

  function undo(currentSnapshot) {
    flushPending();
    if (past.length === 0) return null;

    future.push(cloneStorySnapshot(currentSnapshot));
    const previous = past.pop();
    notify();
    return previous;
  }

  function redo(currentSnapshot) {
    flushPending();
    if (future.length === 0) return null;

    past.push(cloneStorySnapshot(currentSnapshot));
    const next = future.pop();
    notify();
    return next;
  }

  function canUndo() {
    return past.length > 0 || pendingSnapshot != null;
  }

  function canRedo() {
    return future.length > 0;
  }

  function runApplying(callback) {
    isApplying = true;
    try {
      return callback();
    } finally {
      isApplying = false;
    }
  }

  return {
    subscribe,
    recordBeforeMutation,
    flushPending,
    clear,
    undo,
    redo,
    canUndo,
    canRedo,
    runApplying,
    getVersion: () => version,
  };
}
