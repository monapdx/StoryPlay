/** @typedef {{ id: string, name: string, description?: string, aliases?: string[] }} StoryCharacter */

export function makeCharacterId() {
  return `char_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {Partial<StoryCharacter>} [overrides]
 * @returns {StoryCharacter}
 */
export function createCharacter(overrides = {}) {
  return {
    id: overrides.id || makeCharacterId(),
    name: typeof overrides.name === "string" ? overrides.name : "New Character",
    description: typeof overrides.description === "string" ? overrides.description : "",
    aliases: Array.isArray(overrides.aliases)
      ? overrides.aliases.filter((item) => typeof item === "string")
      : [],
  };
}

/**
 * @param {unknown} characters
 * @returns {StoryCharacter[]}
 */
export function normalizeCharacters(characters) {
  if (!Array.isArray(characters)) return [];

  return characters
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : makeCharacterId(),
      name: typeof item.name === "string" ? item.name : "Unnamed",
      description: typeof item.description === "string" ? item.description : "",
      aliases: Array.isArray(item.aliases)
        ? item.aliases.filter((alias) => typeof alias === "string")
        : [],
    }));
}

/**
 * @param {StoryCharacter[]} characters
 * @param {string} characterId
 * @returns {StoryCharacter | undefined}
 */
export function getCharacterById(characters, characterId) {
  const normalizedId = String(characterId || "").trim();
  if (!normalizedId) return undefined;
  return (characters || []).find((character) => character.id === normalizedId);
}
