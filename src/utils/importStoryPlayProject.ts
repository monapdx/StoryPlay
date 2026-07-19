import { normalizeCharacters } from "./storyEntities";
import { normalizeVariableMeta } from "./storyVariables";
import { normalizeStoryNode } from "./nodeHelpers";
import {
  buildStoryPlayImportSummary,
  canonicalizeStoryPlayProject,
  validateStoryPlayProjectShape,
} from "./projectSchema";
import { validateStoryPlayExportV1Schema } from "./storyPlaySchemaValidation";
import { validateStoryPlaySemantics } from "./storySemanticValidation";
import {
  migrateStoryPlayProject,
  UnsupportedFormatVersionError,
} from "./projectMigrations";
import type {
  NormalizedStory,
  StoryPlayExportDocument,
  StoryPlayImportSummary,
} from "../types/story";

export class StoryPlayImportError extends Error {
  cause?: unknown;

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = "StoryPlayImportError";
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function parseStoryPlayProjectJson(text: unknown): unknown {
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
 * Fill safe defaults without inventing missing node ids or repairing broken links.
 */
export function normalizeImportedStory(story: unknown): NormalizedStory {
  const safeStory = cloneJson(story) as Record<string, unknown>;

  if (
    !safeStory.variables ||
    typeof safeStory.variables !== "object" ||
    Array.isArray(safeStory.variables)
  ) {
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
    safeStory.nodes = safeStory.nodes.map((node) => normalizeStoryNode(node));
  }

  // Preserve any extra story keys from the clone (same as pre-TS behavior).
  return safeStory as unknown as NormalizedStory;
}

export interface PrepareStoryPlayImportResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: StoryPlayImportSummary | null;
  story: NormalizedStory | null;
  project: Record<string, unknown> | null;
}

/**
 * Parse, validate, migrate, and normalize a StoryPlay export for import preview.
 * Does not mutate editor state.
 */
export function prepareStoryPlayImport(
  fileText: string
): PrepareStoryPlayImportResult {
  let raw: unknown;

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

  const canonical = canonicalizeStoryPlayProject(raw);
  const { errors: shapeErrors, warnings } =
    validateStoryPlayProjectShape(canonical);
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

  let project: Record<string, unknown>;
  try {
    project = migrateStoryPlayProject(canonical);
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

  const schemaResult = validateStoryPlayExportV1Schema(project);
  errors.push(...schemaResult.errors);

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

  const story = normalizeImportedStory(project.story);
  const normalizedProject = { ...project, story };
  const semanticResult = validateStoryPlaySemantics(normalizedProject);
  errors.push(...semanticResult.errors);
  warnings.push(...semanticResult.warnings);

  const summary = buildStoryPlayImportSummary(normalizedProject, story);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary,
    story: errors.length === 0 ? story : null,
    project: errors.length === 0 ? normalizedProject : null,
  };
}

/**
 * Read a File object as UTF-8 text.
 */
export function readProjectFileAsText(file: File): Promise<string> {
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

export type { StoryPlayExportDocument, StoryPlayImportSummary };
