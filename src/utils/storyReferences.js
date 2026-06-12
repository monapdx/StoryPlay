import { getCharacterById } from "./storyEntities";

/** Matches {{type:id.field}} — optional whitespace tolerated (e.g. {{character: char_001.name}}). */
export const STORY_REFERENCE_TOKEN_REGEX =
  /\{\{\s*([a-z][a-z0-9_]*)\s*:\s*([a-zA-Z0-9_]+)\s*\.\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const MISSING_CHARACTER_LABEL = "[Missing character]";

/**
 * @param {string} characterId
 * @returns {string}
 */
export function buildCharacterNameToken(characterId) {
  return `{{character:${characterId}.name}}`;
}

/**
 * @param {object} [storyState]
 * @param {import('./storyEntities.js').StoryCharacter[]} [storyState.characters]
 * @param {Record<string, unknown>} [storyState.variables]
 * @returns {{ characters: import('./storyEntities.js').StoryCharacter[], variables: Record<string, unknown> }}
 */
export function getStoryRenderContext(storyState = {}) {
  return {
    characters: Array.isArray(storyState.characters) ? storyState.characters : [],
    variables:
      storyState.variables && typeof storyState.variables === "object"
        ? storyState.variables
        : {},
  };
}

/**
 * @param {string} type
 * @param {string} id
 * @param {string} field
 * @param {object} storyState
 * @returns {string}
 */
export function resolveReferenceToken(type, id, field, storyState) {
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
      return String(character.description || "").trim() || MISSING_CHARACTER_LABEL;
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
 *
 * @param {string} text
 * @param {object} [storyState]
 * @returns {string}
 */
export function renderStoryText(text, storyState = {}) {
  if (text == null) return "";
  if (typeof text !== "string") return String(text);
  if (!text.includes("{{")) return text;

  return text.replace(STORY_REFERENCE_TOKEN_REGEX, (match, type, id, field) =>
    resolveReferenceToken(type, id, field, storyState)
  );
}

/**
 * @param {string} text
 * @returns {Set<string>}
 */
export function scanTextForCharacterIds(text) {
  const ids = new Set();
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

const NODE_TEXT_FIELDS = ["content", "title", "prompt"];

/**
 * @param {object[]} nodes
 * @returns {Record<string, number>}
 */
export function countCharacterReferencesById(nodes = []) {
  /** @type {Record<string, number>} */
  const counts = {};

  function bump(id) {
    counts[id] = (counts[id] || 0) + 1;
  }

  function scanText(text) {
    for (const id of scanTextForCharacterIds(text)) {
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

/**
 * @param {string} characterId
 * @param {object[]} nodes
 * @returns {number}
 */
export function countCharacterReferences(characterId, nodes = []) {
  return countCharacterReferencesById(nodes)[characterId] || 0;
}

/**
 * Deep-clone nodes and resolve reference tokens in author-facing text fields (for export).
 *
 * @param {object[]} nodes
 * @param {object} storyState
 * @returns {object[]}
 */
export function resolveNodesTextForExport(nodes = [], storyState = {}) {
  const ctx = getStoryRenderContext(storyState);

  return nodes.map((node) => {
    const data = { ...(node.data || {}) };

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
      data.options = data.options.map((option) => ({
        ...option,
        label:
          typeof option?.label === "string"
            ? renderStoryText(option.label, ctx)
            : option?.label,
        description:
          typeof option?.description === "string"
            ? renderStoryText(option.description, ctx)
            : option?.description,
      }));
    }

    return { ...node, data };
  });
}
