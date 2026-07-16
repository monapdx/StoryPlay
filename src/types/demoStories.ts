import type { StoryVariables } from "./storyCore";

/**
 * Built-in demo story bag cloned into the editor.
 * Partial vs NormalizedStory — characters / variableMeta are often omitted;
 * editor load normalize fills those in. Nodes stay unknown until normalize.
 */
export interface DemoStoryPayload {
  variables: StoryVariables;
  nodes: unknown[];
  variableMeta?: unknown;
  characters?: unknown;
}

/**
 * Catalog row for starter templates (labels, tier, blurb + story payload).
 */
export interface DemoStoryCatalogEntry {
  id: string;
  label: string;
  tier: string;
  blurb: string;
  story: DemoStoryPayload;
}
