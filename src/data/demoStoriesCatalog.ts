import escapeRoomStory from "./sampleStory";
import crossroadsStory from "./demo/crossroadsStory";
import marketDayStory from "./demo/marketDayStory";
import timedNerveStory from "./demo/timedNerveStory";
import guildAuditionStory from "./demo/guildAuditionStory";
import type {
  DemoStoryCatalogEntry,
  DemoStoryPayload,
} from "../types/demoStories";

export type { DemoStoryCatalogEntry, DemoStoryPayload };

/**
 * Built-in demos for the editor. `story` is `{ variables, nodes }` (same as export / useStoryState).
 * Demo JS blobs are untyped; cast at the catalog boundary only.
 */
export const DEMO_STORIES: DemoStoryCatalogEntry[] = [
  {
    id: "crossroads",
    label: "Crossroads",
    tier: "simple",
    blurb: "One fork, two endings—no variables.",
    story: crossroadsStory as DemoStoryPayload,
  },
  {
    id: "market-day",
    label: "Market Day",
    tier: "moderate",
    blurb: "Coins, chat merchant, conditional buy.",
    story: marketDayStory as DemoStoryPayload,
  },
  {
    id: "timed-nerve",
    label: "Timed Nerve",
    tier: "moderate",
    blurb: "Short countdown with timeout effects.",
    story: timedNerveStory as DemoStoryPayload,
  },
  {
    id: "escape-room",
    label: "Escape Room",
    tier: "moderate",
    blurb: "Original demo: chat, timed desk, key logic.",
    story: escapeRoomStory as DemoStoryPayload,
  },
  {
    id: "guild-audition",
    label: "Guild Audition",
    tier: "complex",
    blurb: "Trait picker → persuasion → point split → gated endings.",
    story: guildAuditionStory as DemoStoryPayload,
  },
];

export function getDemoStoryEntry(
  storyId: string
): DemoStoryCatalogEntry | null {
  return DEMO_STORIES.find((entry) => entry.id === storyId) || null;
}

/** Deep clone so switching demos never mutates catalog source objects. */
export function cloneDemoStoryById(storyId: string): DemoStoryPayload | null {
  const entry = getDemoStoryEntry(storyId);
  if (!entry?.story) return null;
  return JSON.parse(JSON.stringify(entry.story)) as DemoStoryPayload;
}
