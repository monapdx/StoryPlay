/** localStorage key for the editor's working project (nodes + variables + characters). */
import { normalizeVariableMeta } from "./storyVariables";

export const STORYPLAY_EDITOR_STORAGE_KEY = "storyplay-editor-project";

/**
 * Persist editor story state so imports and sessions survive refresh.
 *
 * @param {{ nodes: unknown[], variables: Record<string, unknown>, variableMeta?: Record<string, unknown>, characters: unknown[] }} story
 */
export function saveEditorProject({ nodes, variables, variableMeta, characters }) {
  const payload = {
    nodes: Array.isArray(nodes) ? nodes : [],
    variables:
      variables && typeof variables === "object" && !Array.isArray(variables)
        ? variables
        : {},
    variableMeta:
      variableMeta && typeof variableMeta === "object" && !Array.isArray(variableMeta)
        ? variableMeta
        : {},
    characters: Array.isArray(characters) ? characters : [],
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORYPLAY_EDITOR_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / privacy mode */
  }
}

/**
 * @returns {null | { nodes: unknown[], variables: Record<string, unknown>, variableMeta: Record<string, object>, characters: unknown[], savedAt?: string }}
 */
export function loadEditorProject() {
  try {
    const raw = localStorage.getItem(STORYPLAY_EDITOR_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.nodes)) return null;

    const variables =
      data.variables && typeof data.variables === "object" && !Array.isArray(data.variables)
        ? data.variables
        : {};

    const characters = Array.isArray(data.characters) ? data.characters : [];
    const variableMeta = normalizeVariableMeta(data.variableMeta);

    return {
      nodes: data.nodes,
      variables,
      variableMeta,
      characters,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function clearEditorProject() {
  try {
    localStorage.removeItem(STORYPLAY_EDITOR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
