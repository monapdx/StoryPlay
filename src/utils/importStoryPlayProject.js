import { normalizeCharacters } from "./storyEntities";
import { normalizeVariableMeta } from "./storyVariables";
import {
  buildStoryPlayImportSummary,
  validateStoryGraphReferences,
  validateStoryPlayProjectShape,
} from "./projectSchema";
import {
  migrateStoryPlayProject,
  UnsupportedFormatVersionError,
} from "./projectMigrations";

export class StoryPlayImportError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message, options);
    this.name = "StoryPlayImportError";
  }
}

/**
 * @param {string} text
 * @returns {unknown}
 */
export function parseStoryPlayProjectJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new StoryPlayImportError("Project file is empty.");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new StoryPlayImportError(
      "Invalid JSON file. Make sure you selected a StoryPlay export (.json).",
      { cause: error }
    );
  }
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
 * Fill safe defaults without inventing missing node ids or repairing broken links.
 *
 * @param {Record<string, unknown>} story
 * @returns {{ variables: Record<string, unknown>, variableMeta: Record<string, object>, characters: import("./storyEntities").StoryCharacter[], nodes: unknown[] }}
 */
export function normalizeImportedStory(story) {
  const safeStory = cloneJson(story);

  if (!safeStory.variables || typeof safeStory.variables !== "object" || Array.isArray(safeStory.variables)) {
    safeStory.variables = {};
  }

  safeStory.variableMeta = normalizeVariableMeta(safeStory.variableMeta);

  if (!Array.isArray(safeStory.characters)) {
    safeStory.characters = [];
  } else {
    safeStory.characters = normalizeCharacters(safeStory.characters);
  }

  if (!Array.isArray(safeStory.nodes)) {
    safeStory.nodes = [];
  } else {
    safeStory.nodes = safeStory.nodes.map((node) => {
      if (!node || typeof node !== "object") return node;

      const next = { ...node };
      if (!next.data || typeof next.data !== "object" || Array.isArray(next.data)) {
        next.data = {};
      } else {
        next.data = { ...next.data };
      }

      if (!Array.isArray(next.data.choices)) {
        next.data.choices = [];
      }

      if (!Array.isArray(next.data.enterEffects)) {
        next.data.enterEffects = [];
      }

      return next;
    });
  }

  return safeStory;
}

/**
 * Parse, validate, migrate, and normalize a StoryPlay export for import preview.
 * Does not mutate editor state.
 *
 * @param {string} fileText
 * @returns {{
 *   ok: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   summary: import("./projectSchema").StoryPlayImportSummary | null,
 *   story: { variables: Record<string, unknown>, variableMeta?: Record<string, object>, characters: unknown[], nodes: unknown[] } | null,
 *   project: Record<string, unknown> | null
 * }}
 */
export function prepareStoryPlayImport(fileText) {
  let raw;

  try {
    raw = parseStoryPlayProjectJson(fileText);
  } catch (error) {
    const message =
      error instanceof StoryPlayImportError
        ? error.message
        : "Could not read the project file.";
    return {
      ok: false,
      errors: [message],
      warnings: [],
      summary: null,
      story: null,
      project: null,
    };
  }

  const { errors: shapeErrors, warnings } = validateStoryPlayProjectShape(raw);
  const errors = [...shapeErrors];

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      summary: null,
      story: null,
      project: null,
    };
  }

  let project;
  try {
    project = migrateStoryPlayProject(raw);
  } catch (error) {
    const message =
      error instanceof UnsupportedFormatVersionError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unsupported project format.";
    return {
      ok: false,
      errors: [message],
      warnings,
      summary: null,
      story: null,
      project: null,
    };
  }

  const story = normalizeImportedStory(
    /** @type {Record<string, unknown>} */ (project.story)
  );

  const referenceErrors = validateStoryGraphReferences(story.nodes);
  errors.push(...referenceErrors);

  const summary = buildStoryPlayImportSummary(
    /** @type {Record<string, unknown>} */ (project),
    story
  );

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary,
    story: errors.length === 0 ? story : null,
    project: errors.length === 0 ? project : null,
  };
}

/**
 * Read a File object as UTF-8 text.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readProjectFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      reject(new StoryPlayImportError("Could not read the selected file."));
    };
    reader.readAsText(file);
  });
}
