import type { StoryCharacter, StoryVariables } from "../types/storyCore";
import type { StoryNode, StoryNodeData } from "../types/story";
import { getCharacterById } from "./storyEntities";

/** Matches {{type:id.field}} — optional whitespace tolerated (e.g. {{character: char_001.name}}). */
export const STORY_REFERENCE_TOKEN_REGEX =
  /\{\{\s*([a-z][a-z0-9_]*)\s*:\s*([a-zA-Z0-9_]+)\s*\.\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const MISSING_CHARACTER_LABEL = "[Missing character]";

/** Normalized context used when resolving reference tokens. */
export interface StoryRenderContext {
  characters: StoryCharacter[];
  variables: StoryVariables;
}

/**
 * Loose authoring/play state accepted by render helpers.
 * Malformed characters/variables are narrowed inside getStoryRenderContext.
 */
export interface StoryRenderStateInput {
  characters?: unknown;
  variables?: unknown;
}

/** Node fields scanned for character reference tokens. */
export interface CharacterReferenceScanNode {
  data?: {
    content?: unknown;
    title?: unknown;
    prompt?: unknown;
    choices?: ReadonlyArray<{
      label?: unknown;
      playerMessage?: unknown;
      npcResponse?: unknown;
      text?: unknown;
      response?: unknown;
    } | null | undefined> | null;
    options?: ReadonlyArray<{
      label?: unknown;
      description?: unknown;
    } | null | undefined> | null;
  } | null;
}

const NODE_TEXT_FIELDS = ["content", "title", "prompt"] as const;

export function buildCharacterNameToken(characterId: string): string {
  return `{{character:${characterId}.name}}`;
}

export function getStoryRenderContext(
  storyState: StoryRenderStateInput = {}
): StoryRenderContext {
  return {
    characters: Array.isArray(storyState.characters)
      ? (storyState.characters as StoryCharacter[])
      : [],
    variables:
      storyState.variables && typeof storyState.variables === "object"
        ? (storyState.variables as StoryVariables)
        : {},
  };
}

export function resolveReferenceToken(
  type: string,
  id: string,
  field: string,
  storyState?: StoryRenderStateInput
): string {
  const ctx = getStoryRenderContext(storyState);
  const normalizedType = String(type || "").trim();
  const normalizedId = String(id || "").trim();
  const normalizedField = String(field || "").trim();

  if (normalizedType === "character") {
    if (normalizedField === "name") {
      const character = getCharacterById(ctx.characters, normalizedId);
      if (!character) return MISSING_CHARACTER_LABEL;
      const name = String(character.name || "").trim();
      return name || MISSING_CHARACTER_LABEL;
    }
    if (normalizedField === "description") {
      const character = getCharacterById(ctx.characters, normalizedId);
      if (!character) return MISSING_CHARACTER_LABEL;
      return (
        String(character.description || "").trim() || MISSING_CHARACTER_LABEL
      );
    }
    return MISSING_CHARACTER_LABEL;
  }

  if (normalizedType === "variable" && normalizedField) {
    const value = ctx.variables[normalizedId];
    if (value === undefined || value === null) return `[Missing variable]`;
    return String(value);
  }

  if (
    normalizedType === "location" ||
    normalizedType === "item" ||
    normalizedType === "faction"
  ) {
    return `[Missing ${normalizedType}]`;
  }

  if (normalizedType === "player" && normalizedField === "name") {
    const value = ctx.variables.playerName ?? ctx.variables.player_name;
    if (value === undefined || value === null) return "[Player]";
    return String(value);
  }

  return `{{${normalizedType}:${normalizedId}.${normalizedField}}}`;
}

/**
 * Replace known reference tokens with current values. Plain text passes through unchanged.
 * Accepts non-strings at the boundary — runtime historically coerced via String().
 */
export function renderStoryText(
  text: unknown,
  storyState: StoryRenderStateInput = {}
): string {
  if (text == null) return "";
  if (typeof text !== "string") return String(text);
  if (!text.includes("{{")) return text;

  return text.replace(STORY_REFERENCE_TOKEN_REGEX, (_match, type, id, field) =>
    resolveReferenceToken(type, id, field, storyState)
  );
}

export function scanTextForCharacterIds(text: unknown): Set<string> {
  const ids = new Set<string>();
  if (!text || typeof text !== "string") return ids;

  const regex = new RegExp(STORY_REFERENCE_TOKEN_REGEX.source, "g");
  let match = regex.exec(text);
  while (match) {
    const [, type, id] = match;
    if (type === "character" && id) ids.add(id);
    match = regex.exec(text);
  }
  return ids;
}

export function countCharacterReferencesById(
  nodes: CharacterReferenceScanNode[] = []
): Record<string, number> {
  const counts: Record<string, number> = {};

  function bump(id: string) {
    counts[id] = (counts[id] || 0) + 1;
  }

  function scanText(value: unknown) {
    for (const id of scanTextForCharacterIds(value)) {
      bump(id);
    }
  }

  for (const node of nodes) {
    const data = node?.data || {};
    for (const field of NODE_TEXT_FIELDS) {
      scanText(data[field]);
    }
    for (const choice of data.choices || []) {
      scanText(choice?.label);
      scanText(choice?.playerMessage);
      scanText(choice?.npcResponse);
      scanText(choice?.text);
      scanText(choice?.response);
    }
    for (const option of data.options || []) {
      scanText(option?.label);
      scanText(option?.description);
    }
  }

  return counts;
}

export function countCharacterReferences(
  characterId: string,
  nodes: CharacterReferenceScanNode[] = []
): number {
  return countCharacterReferencesById(nodes)[characterId] || 0;
}

/**
 * Deep-clone nodes and resolve reference tokens in author-facing text fields (for export).
 */
export function resolveNodesTextForExport(
  nodes: StoryNode[] = [],
  storyState: StoryRenderStateInput = {}
): StoryNode[] {
  const ctx = getStoryRenderContext(storyState);

  return nodes.map((node) => {
    const data: StoryNodeData = { ...(node.data || {}) };

    for (const field of NODE_TEXT_FIELDS) {
      if (typeof data[field] === "string") {
        data[field] = renderStoryText(data[field], ctx);
      }
    }

    if (Array.isArray(data.choices)) {
      data.choices = data.choices.map((choice) => ({
        ...choice,
        label:
          typeof choice?.label === "string"
            ? renderStoryText(choice.label, ctx)
            : choice?.label,
        playerMessage:
          typeof choice?.playerMessage === "string"
            ? renderStoryText(choice.playerMessage, ctx)
            : choice?.playerMessage,
        npcResponse:
          typeof choice?.npcResponse === "string"
            ? renderStoryText(choice.npcResponse, ctx)
            : choice?.npcResponse,
        text:
          typeof choice?.text === "string"
            ? renderStoryText(choice.text, ctx)
            : choice?.text,
        response:
          typeof choice?.response === "string"
            ? renderStoryText(choice.response, ctx)
            : choice?.response,
      }));
    }

    if (Array.isArray(data.options)) {
      data.options = data.options.map((rawOption) => {
        const option = rawOption as {
          label?: unknown;
          description?: unknown;
        };
        return {
          ...option,
          label:
            typeof option?.label === "string"
              ? renderStoryText(option.label, ctx)
              : option?.label,
          description:
            typeof option?.description === "string"
              ? renderStoryText(option.description, ctx)
              : option?.description,
        };
      });
    }

    return { ...node, data };
  });
}
