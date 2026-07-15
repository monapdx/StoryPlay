import type { BlankStoryProject } from "../types/storyCore";

/** Empty editor project — default for new users. */
export function createBlankStory(): BlankStoryProject {
  return {
    nodes: [],
    variables: {},
    variableMeta: {},
    characters: [],
  };
}
