const DEFAULT_MAX_HISTORY = 50;
const DEFAULT_DEBOUNCE_MS = 400;

export interface StoryUndoHistoryOptions {
  maxSize?: number;
  debounceMs?: number;
}

export interface RecordBeforeMutationOptions {
  immediate?: boolean;
}

/**
 * Snapshot-based undo/redo API. Generic over the caller's snapshot shape
 * (story editor state, mini-game editor bag, etc.).
 */
export interface StoryUndoHistoryApi<TSnapshot = unknown> {
  subscribe: (listener: (version: number) => void) => () => boolean;
  recordBeforeMutation: (
    snapshot: TSnapshot,
    options?: RecordBeforeMutationOptions
  ) => void;
  flushPending: () => void;
  clear: () => void;
  undo: (currentSnapshot: TSnapshot) => TSnapshot | null;
  redo: (currentSnapshot: TSnapshot) => TSnapshot | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  runApplying: <T>(callback: () => T) => T;
  getVersion: () => number;
}

export function cloneStorySnapshot<T>(snapshot: T): T {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(snapshot);
    }
  } catch {
    /* fall through */
  }

  return JSON.parse(JSON.stringify(snapshot)) as T;
}

/**
 * Snapshot-based undo/redo for editor story state.
 * Debounced `recordBeforeMutation` groups rapid edits (typing) into one undo step.
 */
export function createStoryUndoHistory<TSnapshot = unknown>({
  maxSize = DEFAULT_MAX_HISTORY,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: StoryUndoHistoryOptions = {}): StoryUndoHistoryApi<TSnapshot> {
  const past: TSnapshot[] = [];
  const future: TSnapshot[] = [];
  let pendingSnapshot: TSnapshot | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isApplying = false;
  let version = 0;
  const listeners = new Set<(version: number) => void>();

  function notify() {
    version += 1;
    listeners.forEach((listener) => listener(version));
  }

  function subscribe(listener: (version: number) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function pushPast(snapshot: TSnapshot) {
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

  function recordBeforeMutation(
    snapshot: TSnapshot,
    { immediate = false }: RecordBeforeMutationOptions = {}
  ) {
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

  function undo(currentSnapshot: TSnapshot): TSnapshot | null {
    flushPending();
    if (past.length === 0) return null;

    future.push(cloneStorySnapshot(currentSnapshot));
    const previous = past.pop();
    notify();
    return previous ?? null;
  }

  function redo(currentSnapshot: TSnapshot): TSnapshot | null {
    flushPending();
    if (future.length === 0) return null;

    past.push(cloneStorySnapshot(currentSnapshot));
    const next = future.pop();
    notify();
    return next ?? null;
  }

  function canUndo() {
    return past.length > 0 || pendingSnapshot != null;
  }

  function canRedo() {
    return future.length > 0;
  }

  function runApplying<T>(callback: () => T): T {
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
