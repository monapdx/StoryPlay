/**
 * Documentation section catalog.
 * Each entry maps to a content renderer in `sections.jsx` for future per-page routes.
 */

export const DOC_GROUPS = [
  { id: "start", label: "Getting started" },
  { id: "authoring", label: "Authoring" },
  { id: "project", label: "Project" },
  { id: "reference", label: "Reference" },
];

export const DOC_SECTIONS = [
  {
    id: "getting-started",
    group: "start",
    title: "Getting Started",
    summary: "What StoryPlay is and how to open your first project.",
  },
  {
    id: "your-first-story",
    group: "start",
    title: "Your First Story",
    summary: "A quick path from blank canvas to exported game.",
    featured: true,
  },
  {
    id: "building-stories",
    group: "authoring",
    title: "Building Stories",
    summary: "Blocks, choices, connections, and the story graph.",
  },
  {
    id: "block-types",
    group: "authoring",
    title: "Block Types",
    summary: "Narrative, chat, timed, ending, and mini-game blocks.",
  },
  {
    id: "variables",
    group: "authoring",
    title: "Variables",
    summary: "Story-wide values, conditions, effects, and player stats.",
  },
  {
    id: "characters",
    group: "authoring",
    title: "Characters",
    summary: "Reusable names and reference tokens in text.",
  },
  {
    id: "chat-conversations",
    group: "authoring",
    title: "Chat Conversations",
    summary: "Chat scripts, replies, and leaving a scene.",
  },
  {
    id: "mini-games",
    group: "authoring",
    title: "Mini-Games",
    summary: "Trait picker, persuasion, and choice weighting blocks.",
  },
  {
    id: "templates",
    group: "project",
    title: "Templates",
    summary: "Built-in example stories and blank projects.",
  },
  {
    id: "import-export",
    group: "project",
    title: "Import & Export",
    summary: "Save, share, and reload StoryPlay project files.",
  },
  {
    id: "json-format",
    group: "project",
    title: "JSON Format",
    summary: "StoryPlay export v1 structure (simplified overview).",
  },
  {
    id: "keyboard-shortcuts",
    group: "reference",
    title: "Keyboard Shortcuts",
    summary: "Undo, redo, and editor shortcuts.",
  },
  {
    id: "faq",
    group: "reference",
    title: "FAQ",
    summary: "Common questions from new authors.",
  },
  {
    id: "roadmap",
    group: "reference",
    title: "Roadmap",
    summary: "Near-future directions for StoryPlay.",
  },
];

export function getDocSection(sectionId) {
  if (!sectionId) return null;
  return DOC_SECTIONS.find((section) => section.id === sectionId) ?? null;
}

export function getDocSectionsByGroup() {
  return DOC_GROUPS.map((group) => ({
    ...group,
    sections: DOC_SECTIONS.filter((section) => section.group === group.id),
  }));
}
