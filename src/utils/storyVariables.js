/**
 * Player-facing labels for story variables (author-defined in the editor).
 *
 * @typedef {{
 *   playerLabel?: string,
 *   playerDescription?: string,
 *   icon?: string
 * }} VariablePlayerMeta
 */

/**
 * @param {unknown} meta
 * @returns {Record<string, VariablePlayerMeta>}
 */
export function normalizeVariableMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {};
  }

  /** @type {Record<string, VariablePlayerMeta>} */
  const next = {};

  for (const [key, entry] of Object.entries(meta)) {
    if (!key || typeof key !== "string") continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const playerLabel =
      typeof entry.playerLabel === "string" ? entry.playerLabel.trim() : "";
    const playerDescription =
      typeof entry.playerDescription === "string"
        ? entry.playerDescription.trim()
        : "";
    const icon = typeof entry.icon === "string" ? entry.icon.trim() : "";

    if (!playerLabel && !playerDescription && !icon) continue;

    next[key] = {
      ...(playerLabel ? { playerLabel } : {}),
      ...(playerDescription ? { playerDescription } : {}),
      ...(icon ? { icon } : {}),
    };
  }

  return next;
}

/**
 * @param {Record<string, VariablePlayerMeta>} meta
 * @param {string} key
 * @param {Partial<VariablePlayerMeta>} patch
 * @returns {Record<string, VariablePlayerMeta>}
 */
export function patchVariableMeta(meta, key, patch) {
  if (!key) return normalizeVariableMeta(meta);

  const safe = normalizeVariableMeta(meta);
  const current = safe[key] || {};
  const merged = {
    ...current,
    ...patch,
  };

  const normalized = normalizeVariableMeta({ [key]: merged });
  if (!normalized[key]) {
    const next = { ...safe };
    delete next[key];
    return next;
  }

  return { ...safe, [key]: normalized[key] };
}

/**
 * @param {Record<string, VariablePlayerMeta>} meta
 * @param {string} oldKey
 * @param {string} newKey
 * @returns {Record<string, VariablePlayerMeta>}
 */
export function renameVariableMetaKey(meta, oldKey, newKey) {
  if (!oldKey || !newKey || oldKey === newKey) {
    return normalizeVariableMeta(meta);
  }

  const safe = normalizeVariableMeta(meta);
  if (!safe[oldKey]) return safe;

  const next = { ...safe };
  const entry = next[oldKey];
  delete next[oldKey];
  next[newKey] = entry;
  return next;
}

/**
 * @param {Record<string, VariablePlayerMeta>} meta
 * @param {string} key
 * @returns {Record<string, VariablePlayerMeta>}
 */
export function deleteVariableMetaKey(meta, key) {
  if (!key) return normalizeVariableMeta(meta);
  const safe = normalizeVariableMeta(meta);
  if (!safe[key]) return safe;
  const next = { ...safe };
  delete next[key];
  return next;
}

/**
 * @param {string} key
 * @param {Record<string, VariablePlayerMeta>} [meta]
 * @returns {string | null}
 */
export function getAuthoredPlayerLabel(key, meta) {
  const entry = normalizeVariableMeta(meta)[key];
  return entry?.playerLabel || null;
}
