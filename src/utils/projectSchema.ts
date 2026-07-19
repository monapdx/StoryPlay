/**
 * Canonical StoryPlay project export/import shape (v1).
 * @see schemas/storyplay-export.v1.schema.json
 */

import type {
  NormalizedStory,
  StoryPlayExportDocument,
  StoryPlayImportSummary,
  StoryPlayValidationResult,
} from "../types/story";
import { normalizeStoryNodes } from "./nodeHelpers";
import { validateStoryPlaySemantics } from "./storySemanticValidation";

export type { StoryPlayImportSummary, StoryPlayValidationResult };

export const STORYPLAY_EXPORT_FORMAT_VERSION = 1;

export const SUPPORTED_FORMAT_VERSIONS = [STORYPLAY_EXPORT_FORMAT_VERSION];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

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

/**
 * Apply safe defaults so exports from the live editor round-trip through import.
 */
export function canonicalizeStoryPlayProject(
  project: unknown
): Record<string, unknown> {
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
 */
export function validateStoryPlayProjectShape(
  project: unknown
): StoryPlayValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  if (
    Object.prototype.hasOwnProperty.call(story, "characters") &&
    !Array.isArray(story.characters)
  ) {
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
    Array.isArray(story.nodes) &&
    story.nodes.length === 0 &&
    errors.length === 0
  ) {
    warnings.push("Project has no story nodes.");
  }

  return { errors, warnings };
}

function validateNodesShape(nodes: unknown[], errors: string[]): void {
  nodes.forEach((node, index) => {
    const label = `Node at index ${index}`;

    if (!isPlainObject(node)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    if (typeof node.id !== "string" || !node.id.trim()) {
      errors.push(`${label} is missing a valid "id" string.`);
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
 */
export function validateStoryGraphReferences(nodes: unknown): string[] {
  return validateStoryPlaySemantics({
    story: {
      nodes: Array.isArray(nodes) ? nodes : [],
    },
  }).errors;
}

export function buildStoryPlayImportSummary(
  project: Record<string, unknown> | StoryPlayExportDocument,
  story: Pick<NormalizedStory, "variables" | "characters" | "nodes">
): StoryPlayImportSummary {
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
