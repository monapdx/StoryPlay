/** localStorage key for the editor's working project (nodes + variables + characters). */
import type { StoryVariables, VariableMetaMap } from "../types/storyCore";
import { normalizeVariableMeta } from "./storyVariables";

export const STORYPLAY_EDITOR_STORAGE_KEY = "storyplay-editor-project";

/**
 * Input accepted by save — fields are not assumed canonical until
 * array/object checks (and variableMeta normalize on load) run.
 */
export interface EditorProjectSaveInput {
  nodes: unknown;
  variables: unknown;
  variableMeta?: unknown;
  characters: unknown;
}

/**
 * Shape returned by load after runtime checks + variableMeta normalize.
 * `nodes` / `characters` remain unknown[] — not StoryNode / StoryCharacter.
 */
export interface EditorProjectStoredData {
  nodes: unknown[];
  variables: StoryVariables;
  variableMeta: VariableMetaMap;
  characters: unknown[];
  savedAt?: string;
}

/**
 * Persist editor story state so imports and sessions survive refresh.
 */
export function saveEditorProject({
  nodes,
  variables,
  variableMeta,
  characters,
}: EditorProjectSaveInput): void {
  const payload = {
    nodes: Array.isArray(nodes) ? nodes : [],
    variables:
      variables && typeof variables === "object" && !Array.isArray(variables)
        ? variables
        : {},
    variableMeta:
      variableMeta &&
      typeof variableMeta === "object" &&
      !Array.isArray(variableMeta)
        ? variableMeta
        : {},
    characters: Array.isArray(characters) ? characters : [],
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      STORYPLAY_EDITOR_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    /* quota / privacy mode */
  }
}

export function loadEditorProject(): EditorProjectStoredData | null {
  try {
    const raw = localStorage.getItem(STORYPLAY_EDITOR_STORAGE_KEY);
    if (!raw) return null;

    const data: unknown = JSON.parse(raw);
    if (!data || !Array.isArray((data as { nodes?: unknown }).nodes)) {
      return null;
    }

    const record = data as Record<string, unknown>;

    const variables: StoryVariables =
      record.variables &&
      typeof record.variables === "object" &&
      !Array.isArray(record.variables)
        ? (record.variables as StoryVariables)
        : {};

    const characters = Array.isArray(record.characters)
      ? record.characters
      : [];
    const variableMeta = normalizeVariableMeta(record.variableMeta);

    return {
      nodes: record.nodes as unknown[],
      variables,
      variableMeta,
      characters,
      savedAt:
        typeof record.savedAt === "string" ? record.savedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function clearEditorProject(): void {
  try {
    localStorage.removeItem(STORYPLAY_EDITOR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
