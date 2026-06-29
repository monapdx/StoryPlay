/**
 * Canonical StoryPlay project export/import shape (v1).
 * @see schemas/storyplay-export.v1.schema.json
 */

import { normalizeStoryNodes } from "./nodeHelpers";

export const STORYPLAY_EXPORT_FORMAT_VERSION = 1;

export const SUPPORTED_FORMAT_VERSIONS = [STORYPLAY_EXPORT_FORMAT_VERSION];

/**
 * @typedef {object} StoryPlayImportSummary
 * @property {number} nodeCount
 * @property {number} variableCount
 * @property {number} characterCount
 * @property {string | null} exportedAt
 * @property {number} formatVersion
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

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

/**
 * Apply safe defaults so exports from the live editor round-trip through import.
 * @param {unknown} project
 * @returns {Record<string, unknown>}
 */
export function canonicalizeStoryPlayProject(project) {
  if (!isPlainObject(project)) return {};

  const next = cloneJson(project);

  if (isPlainObject(next.story) && Array.isArray(next.story.nodes)) {
    next.story = {
      ...next.story,
      nodes: normalizeStoryNodes(next.story.nodes),
    };
  }

  return next;
}

/**
 * Validate raw parsed JSON against the StoryPlay export envelope (blocking errors only).
 *
 * @param {unknown} project
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateStoryPlayProjectShape(project) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(project)) {
    errors.push("Project file must be a JSON object.");
    return { errors, warnings };
  }

  if (!Object.prototype.hasOwnProperty.call(project, "formatVersion")) {
    errors.push('Missing required field "formatVersion".');
  } else if (typeof project.formatVersion !== "number") {
    errors.push('"formatVersion" must be a number.');
  }

  if (!Object.prototype.hasOwnProperty.call(project, "story")) {
    errors.push('Missing required field "story".');
    return { errors, warnings };
  }

  const story = project.story;
  if (!isPlainObject(story)) {
    errors.push('"story" must be an object.');
    return { errors, warnings };
  }

  if (!Object.prototype.hasOwnProperty.call(story, "variables")) {
    errors.push('Missing required field "story.variables".');
  } else if (!isPlainObject(story.variables)) {
    errors.push('"story.variables" must be an object.');
  }

  if (!Object.prototype.hasOwnProperty.call(story, "characters")) {
    errors.push('Missing required field "story.characters".');
  } else if (!Array.isArray(story.characters)) {
    errors.push('"story.characters" must be an array.');
  }

  if (!Object.prototype.hasOwnProperty.call(story, "nodes")) {
    errors.push('Missing required field "story.nodes".');
  } else if (!Array.isArray(story.nodes)) {
    errors.push('"story.nodes" must be an array.');
  } else {
    validateNodesShape(story.nodes, errors);
  }

  if (
    Array.isArray(story?.nodes) &&
    story.nodes.length === 0 &&
    errors.length === 0
  ) {
    warnings.push("Project has no story nodes.");
  }

  return { errors, warnings };
}

/**
 * @param {unknown[]} nodes
 * @param {string[]} errors
 */
function validateNodesShape(nodes, errors) {
  const seenIds = new Set();

  nodes.forEach((node, index) => {
    const label = `Node at index ${index}`;

    if (!isPlainObject(node)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    if (typeof node.id !== "string" || !node.id.trim()) {
      errors.push(`${label} is missing a valid "id" string.`);
    } else if (seenIds.has(node.id)) {
      errors.push(`Duplicate node id "${node.id}".`);
    } else {
      seenIds.add(node.id);
    }

    if (typeof node.type !== "string" || !node.type.trim()) {
      errors.push(
        `Node "${typeof node.id === "string" ? node.id : index}" is missing a valid "type" string.`
      );
    }

    if (!isPlainObject(node.position)) {
      errors.push(
        `Node "${typeof node.id === "string" ? node.id : index}" is missing a valid "position" object.`
      );
    } else {
      if (typeof node.position.x !== "number" || typeof node.position.y !== "number") {
        errors.push(
          `Node "${typeof node.id === "string" ? node.id : index}" position must have numeric "x" and "y".`
        );
      }
    }

    if (!isPlainObject(node.data)) {
      errors.push(
        `Node "${typeof node.id === "string" ? node.id : index}" is missing a valid "data" object.`
      );
    }
  });
}

/**
 * Validate graph references after normalization. Returns blocking errors only.
 *
 * @param {unknown[]} nodes
 * @returns {string[]}
 */
export function validateStoryGraphReferences(nodes) {
  const errors = [];
  if (!Array.isArray(nodes)) return errors;

  const nodeIds = new Set(
    nodes
      .filter((node) => isPlainObject(node) && typeof node.id === "string")
      .map((node) => node.id)
  );

  for (const node of nodes) {
    if (!isPlainObject(node) || typeof node.id !== "string") continue;

    const data = isPlainObject(node.data) ? node.data : {};
    const nodeLabel = data.title || node.id;

    const choices = Array.isArray(data.choices) ? data.choices : [];
    choices.forEach((choice, choiceIndex) => {
      if (!isPlainObject(choice)) return;
      const targetId = choice.targetNodeId;
      if (targetId == null || targetId === "") return;
      if (typeof targetId !== "string") {
        errors.push(
          `Node "${nodeLabel}": choice ${choiceIndex + 1} has an invalid targetNodeId.`
        );
        return;
      }
      if (!nodeIds.has(targetId)) {
        errors.push(
          `Node "${nodeLabel}": choice "${choice.label || choiceIndex + 1}" points to missing node "${targetId}".`
        );
      }
    });

    for (const field of ["continueNodeId", "successNodeId", "failureNodeId"]) {
      const refId = data[field];
      if (refId == null || refId === "") continue;
      if (typeof refId !== "string") {
        errors.push(`Node "${nodeLabel}": "${field}" must be a string when set.`);
        continue;
      }
      if (!nodeIds.has(refId)) {
        errors.push(
          `Node "${nodeLabel}": "${field}" points to missing node "${refId}".`
        );
      }
    }
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} project
 * @param {{ variables: Record<string, unknown>, characters: unknown[], nodes: unknown[] }} story
 * @returns {StoryPlayImportSummary}
 */
export function buildStoryPlayImportSummary(project, story) {
  return {
    formatVersion:
      typeof project.formatVersion === "number" ? project.formatVersion : 0,
    nodeCount: Array.isArray(story.nodes) ? story.nodes.length : 0,
    variableCount: isPlainObject(story.variables)
      ? Object.keys(story.variables).length
      : 0,
    characterCount: Array.isArray(story.characters) ? story.characters.length : 0,
    exportedAt:
      typeof project.exportedAt === "string" ? project.exportedAt : null,
  };
}
