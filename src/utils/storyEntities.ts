import type { StoryCharacter } from "../types/storyCore";

export type { StoryCharacter };

export function makeCharacterId(): string {
  return `char_${Math.random().toString(36).slice(2, 10)}`;
}

export function createCharacter(
  overrides: Partial<StoryCharacter> = {}
): StoryCharacter {
  return {
    id: overrides.id || makeCharacterId(),
    name: typeof overrides.name === "string" ? overrides.name : "New Character",
    description:
      typeof overrides.description === "string" ? overrides.description : "",
    aliases: Array.isArray(overrides.aliases)
      ? overrides.aliases.filter((item) => typeof item === "string")
      : [],
  };
}

export function normalizeCharacters(characters: unknown): StoryCharacter[] {
  if (!Array.isArray(characters)) return [];

  return characters
    .filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === "object"
    )
    .map((item) => ({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : makeCharacterId(),
      name: typeof item.name === "string" ? item.name : "Unnamed",
      description:
        typeof item.description === "string" ? item.description : "",
      aliases: Array.isArray(item.aliases)
        ? item.aliases.filter((alias): alias is string => typeof alias === "string")
        : [],
    }));
}

export function getCharacterById(
  characters: StoryCharacter[] | null | undefined,
  characterId: string
): StoryCharacter | undefined {
  const normalizedId = String(characterId || "").trim();
  if (!normalizedId) return undefined;
  return (characters || []).find((character) => character.id === normalizedId);
}
