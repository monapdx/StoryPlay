import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import storyPlayExportV1Schema from "../../schemas/storyplay-export.v1.schema.json";
import type { StoryPlayGameExportV1 } from "../types/generated/storyplayExportV1";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

const validateV1 = ajv.compile<StoryPlayGameExportV1>(
  storyPlayExportV1Schema
);

function formatSchemaError(error: ErrorObject): string {
  const path = error.instancePath || "project";
  const detail =
    error.keyword === "additionalProperties" &&
    typeof error.params.additionalProperty === "string"
      ? ` contains unknown field "${error.params.additionalProperty}"`
      : ` ${error.message || "is invalid"}`;

  return `${path}${detail}.`;
}

export interface StoryPlaySchemaValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate the persisted v1 wire shape. Graph integrity and authoring semantics
 * are intentionally handled by storySemanticValidation / graphHealth.
 */
export function validateStoryPlayExportV1Schema(
  project: unknown
): StoryPlaySchemaValidationResult {
  const valid = validateV1(project);
  return {
    valid: Boolean(valid),
    errors: valid
      ? []
      : (validateV1.errors || []).map(formatSchemaError),
  };
}
