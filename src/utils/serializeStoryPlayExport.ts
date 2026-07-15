/**
 * Build a StoryPlay v1 export document from in-editor story state.
 * @see schemas/storyplay-export.v1.schema.json
 */

import { normalizeCharacters } from "./storyEntities";
import { normalizeVariableMeta } from "./storyVariables";
import { STORYPLAY_EXPORT_FORMAT_VERSION } from "./projectSchema";
import { normalizeStoryNode } from "./nodeHelpers";
import { resolveNodesTextForExport } from "./storyReferences";
import type {
  StoryCharacter,
  StoryNode,
  StoryPlayExportDocument,
  StoryPlayExportMeta,
  StoryVariables,
  VariableMetaMap,
} from "../types/story";

export { STORYPLAY_EXPORT_FORMAT_VERSION };

function cloneJson<T>(value: T): T {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
  } catch {
    /* fall through */
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneNodeForExport(
  node: unknown,
  { cleanGraphIssues }: { cleanGraphIssues: boolean }
): StoryNode {
  const next = cloneJson(node);

  if (
    cleanGraphIssues &&
    next &&
    typeof next === "object" &&
    !Array.isArray(next) &&
    "data" in next &&
    next.data &&
    typeof next.data === "object" &&
    !Array.isArray(next.data) &&
    Object.prototype.hasOwnProperty.call(next.data, "graphIssues")
  ) {
    const data = next.data as Record<string, unknown>;
    const { graphIssues: _removed, ...restData } = data;
    (next as { data: Record<string, unknown> }).data = restData;
  }

  return normalizeStoryNode(next);
}

export interface SerializeStoryPlayExportOptions {
  nodes?: unknown[];
  variables?: StoryVariables | Record<string, unknown>;
  variableMeta?: VariableMetaMap | Record<string, unknown>;
  characters?: StoryCharacter[] | unknown[];
  meta?: StoryPlayExportMeta | Record<string, unknown> | null;
  includeExportedAt?: boolean;
  cleanGraphIssues?: boolean;
  resolveReferences?: boolean;
}

/**
 * Serialize current story state into StoryPlay export v1 shape.
 */
export function serializeStoryPlayExportV1({
  nodes = [],
  variables = {},
  variableMeta = {},
  characters = [],
  meta,
  includeExportedAt = true,
  cleanGraphIssues = true,
  resolveReferences = true,
}: SerializeStoryPlayExportOptions = {}): StoryPlayExportDocument {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeVariables =
    variables && typeof variables === "object" && !Array.isArray(variables)
      ? variables
      : {};
  const safeCharacters = normalizeCharacters(characters);
  const safeVariableMeta = normalizeVariableMeta(variableMeta);

  let storyNodes = safeNodes.map((node) =>
    cloneNodeForExport(node, { cleanGraphIssues })
  );

  if (resolveReferences) {
    storyNodes = resolveNodesTextForExport(storyNodes, {
      characters: safeCharacters,
      variables: safeVariables,
    }) as StoryNode[];
  }

  const storyPayload: StoryPlayExportDocument["story"] = {
    variables: cloneJson(safeVariables),
    characters: cloneJson(safeCharacters),
    nodes: storyNodes,
  };

  if (Object.keys(safeVariableMeta).length > 0) {
    storyPayload.variableMeta = cloneJson(safeVariableMeta);
  }

  const doc: StoryPlayExportDocument = {
    formatVersion: STORYPLAY_EXPORT_FORMAT_VERSION,
    story: storyPayload,
  };

  if (includeExportedAt) {
    doc.exportedAt = new Date().toISOString();
  }

  if (meta != null && typeof meta === "object" && !Array.isArray(meta)) {
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      doc.meta = cloneJson(meta) as StoryPlayExportMeta;
    }
  }

  return doc;
}

/**
 * Serialize and trigger a browser download of the v1 JSON export.
 */
export function downloadStoryPlayExportV1(
  options: SerializeStoryPlayExportOptions = {}
): StoryPlayExportDocument {
  const payload = serializeStoryPlayExportV1(options);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storyplay-export-${new Date().toISOString().replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return payload;
}
