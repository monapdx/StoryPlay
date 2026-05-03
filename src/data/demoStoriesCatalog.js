import escapeRoomStory from "./sampleStory";
import crossroadsStory from "./demo/crossroadsStory";
import marketDayStory from "./demo/marketDayStory";
import timedNerveStory from "./demo/timedNerveStory";
import guildAuditionStory from "./demo/guildAuditionStory";

/**
 * Built-in demos for the editor. `story` is `{ variables, nodes }` (same as export / useStoryState).
 */
export const DEMO_STORIES = [
  {
    id: "crossroads",
    label: "Crossroads",
    tier: "simple",
    blurb: "One fork, two endings—no variables.",
    story: crossroadsStory,
  },
  {
    id: "market-day",
    label: "Market Day",
    tier: "moderate",
    blurb: "Coins, chat merchant, conditional buy.",
    story: marketDayStory,
  },
  {
    id: "timed-nerve",
    label: "Timed Nerve",
    tier: "moderate",
    blurb: "Short countdown with timeout effects.",
    story: timedNerveStory,
  },
  {
    id: "escape-room",
    label: "Escape Room",
    tier: "moderate",
    blurb: "Original demo: chat, timed desk, key logic.",
    story: escapeRoomStory,
  },
  {
    id: "guild-audition",
    label: "Guild Audition",
    tier: "complex",
    blurb: "Trait picker → persuasion → point split → gated endings.",
    story: guildAuditionStory,
  },
];

export const DEFAULT_DEMO_STORY_ID = "escape-room";

export function getDemoStoryEntry(storyId) {
  return DEMO_STORIES.find((entry) => entry.id === storyId) || null;
}

/** Deep clone so switching demos never mutates catalog source objects. */
export function cloneDemoStoryById(storyId) {
  const entry = getDemoStoryEntry(storyId);
  if (!entry?.story) return null;
  return JSON.parse(JSON.stringify(entry.story));
}
