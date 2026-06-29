/**
 * Build a StoryPlay v1 export document from in-editor story state.
 * @see schemas/storyplay-export.v1.schema.json
 */

import { normalizeCharacters } from "./storyEntities";
import { STORYPLAY_EXPORT_FORMAT_VERSION } from "./projectSchema";
import { resolveNodesTextForExport } from "./storyReferences";

export { STORYPLAY_EXPORT_FORMAT_VERSION };

function cloneJson(value) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
  } catch {
    /* fall through */
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneNodeForExport(node, { cleanGraphIssues }) {
  const next = cloneJson(node);

  if (
    cleanGraphIssues &&
    next &&
    typeof next === "object" &&
    next.data &&
    typeof next.data === "object" &&
    !Array.isArray(next.data) &&
    Object.prototype.hasOwnProperty.call(next.data, "graphIssues")
  ) {
    const { graphIssues: _removed, ...restData } = next.data;
    next.data = restData;
  }

  return next;
}

/**
 * Serialize current story state into StoryPlay export v1 shape.
 *
 * @param {object} params
 * @param {object[]} [params.nodes] - React Flow nodes from useStoryState
 * @param {Record<string, unknown>} [params.variables] - variables map from useStoryState
 * @param {object[]} [params.characters] - character registry from useStoryState
 * @param {object} [params.meta] - Optional envelope metadata (title, author, description, startNodeId)
 * @param {boolean} [params.includeExportedAt=true] - Set ISO `exportedAt` on the document
 * @param {boolean} [params.cleanGraphIssues=true] - Omit `data.graphIssues` from each node (editor-only)
 * @param {boolean} [params.resolveReferences=true] - Resolve {{character:…}} tokens in exported text fields
 * @returns {{
 *   formatVersion: number,
 *   exportedAt?: string,
 *   meta?: object,
 *   story: { variables: Record<string, unknown>, characters: object[], nodes: unknown[] }
 * }}
 */
export function serializeStoryPlayExportV1({
  nodes = [],
  variables = {},
  characters = [],
  meta,
  includeExportedAt = true,
  cleanGraphIssues = true,
  resolveReferences = true,
} = {}) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeVariables =
    variables && typeof variables === "object" && !Array.isArray(variables)
      ? variables
      : {};
  const safeCharacters = normalizeCharacters(characters);

  let storyNodes = safeNodes.map((node) => cloneNodeForExport(node, { cleanGraphIssues }));

  if (resolveReferences) {
    storyNodes = resolveNodesTextForExport(storyNodes, {
      characters: safeCharacters,
      variables: safeVariables,
    });
  }

  /** @type {Record<string, unknown>} */
  const doc = {
    formatVersion: STORYPLAY_EXPORT_FORMAT_VERSION,
    story: {
      variables: cloneJson(safeVariables),
      characters: cloneJson(safeCharacters),
      nodes: storyNodes,
    },
  };

  if (includeExportedAt) {
    doc.exportedAt = new Date().toISOString();
  }

  if (meta != null && typeof meta === "object" && !Array.isArray(meta)) {
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      doc.meta = cloneJson(meta);
    }
  }

  return doc;
}

/**
 * Serialize and trigger a browser download of the v1 JSON export.
 * @param {Parameters<typeof serializeStoryPlayExportV1>[0]} options
 * @returns {ReturnType<typeof serializeStoryPlayExportV1>}
 */
export function downloadStoryPlayExportV1(options = {}) {
  const payload = serializeStoryPlayExportV1(options);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storyplay-export-${new Date().toISOString().replaceAll(":", "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return payload;
}
