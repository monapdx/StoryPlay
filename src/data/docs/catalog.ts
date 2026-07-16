/**
 * Documentation section catalog.
 * Each entry maps to a content renderer in `sections.jsx` for future per-page routes.
 */

/** Closed set of docs nav group ids — catalog is authoritative. */
export type DocGroupId = "start" | "authoring" | "project" | "reference";

/**
 * Closed set of documentation section ids — catalog is authoritative.
 * Hash routes may still pass arbitrary strings into lookups.
 */
export type DocSectionId =
  | "getting-started"
  | "your-first-story"
  | "building-stories"
  | "block-types"
  | "variables"
  | "characters"
  | "chat-conversations"
  | "mini-games"
  | "templates"
  | "import-export"
  | "json-format"
  | "keyboard-shortcuts"
  | "faq"
  | "roadmap";

/** Group/category row in the sidebar. */
export interface DocGroupMeta {
  id: DocGroupId;
  label: string;
}

/** Section metadata for nav, landing, and article headers. */
export interface DocSectionMeta {
  id: DocSectionId;
  group: DocGroupId;
  title: string;
  summary: string;
  featured?: boolean;
}

/** Group plus its filtered section list (sidebar navigation). */
export interface DocGroupWithSections extends DocGroupMeta {
  sections: DocSectionMeta[];
}

export const DOC_GROUPS: DocGroupMeta[] = [
  { id: "start", label: "Getting started" },
  { id: "authoring", label: "Authoring" },
  { id: "project", label: "Project" },
  { id: "reference", label: "Reference" },
];

export const DOC_SECTIONS: DocSectionMeta[] = [
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

export function getDocSection(
  sectionId: string | null | undefined
): DocSectionMeta | null {
  if (!sectionId) return null;
  return DOC_SECTIONS.find((section) => section.id === sectionId) ?? null;
}

export function getDocSectionsByGroup(): DocGroupWithSections[] {
  return DOC_GROUPS.map((group) => ({
    ...group,
    sections: DOC_SECTIONS.filter((section) => section.group === group.id),
  }));
}
