import type {
  VariableMetaMap,
  VariablePlayerMeta,
} from "../types/storyCore";

export type { VariableMetaMap, VariablePlayerMeta };

export function normalizeVariableMeta(meta: unknown): VariableMetaMap {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {};
  }

  const next: VariableMetaMap = {};

  for (const [key, entry] of Object.entries(meta)) {
    if (!key || typeof key !== "string") continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const record = entry as Record<string, unknown>;
    const playerLabel =
      typeof record.playerLabel === "string" ? record.playerLabel.trim() : "";
    const playerDescription =
      typeof record.playerDescription === "string"
        ? record.playerDescription.trim()
        : "";
    const icon = typeof record.icon === "string" ? record.icon.trim() : "";

    if (!playerLabel && !playerDescription && !icon) continue;

    next[key] = {
      ...(playerLabel ? { playerLabel } : {}),
      ...(playerDescription ? { playerDescription } : {}),
      ...(icon ? { icon } : {}),
    };
  }

  return next;
}

export function patchVariableMeta(
  meta: VariableMetaMap | unknown,
  key: string,
  patch: Partial<VariablePlayerMeta>
): VariableMetaMap {
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

export function renameVariableMetaKey(
  meta: VariableMetaMap | unknown,
  oldKey: string,
  newKey: string
): VariableMetaMap {
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

export function deleteVariableMetaKey(
  meta: VariableMetaMap | unknown,
  key: string
): VariableMetaMap {
  if (!key) return normalizeVariableMeta(meta);
  const safe = normalizeVariableMeta(meta);
  if (!safe[key]) return safe;
  const next = { ...safe };
  delete next[key];
  return next;
}

export function getAuthoredPlayerLabel(
  key: string,
  meta?: VariableMetaMap | unknown
): string | null {
  const entry = normalizeVariableMeta(meta)[key];
  return entry?.playerLabel || null;
}
