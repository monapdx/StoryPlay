# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

#### First-run onboarding and blank-slate editor

**What was added**

- **Blank project by default** — New sessions start with an empty graph (`nodes: []`, `variables: {}`) instead of auto-loading the Escape Room demo.
- **Canvas empty state** — When there are no blocks, a centered card offers “Add your first block,” “Open tutorial,” and “Load example story.”
- **Starter templates** — Built-in demos (Crossroads, Market Day, Timed Nerve, Escape Room, Guild Audition) moved to an **Example stories** modal; loading replaces the project only after confirmation when content already exists.
- **Guided tour** — Eight-step onboarding (story map, Add Block, sidebar, choices, preview, variables, export, templates) with spotlight tooltips, **Skip tour** / **Finish**, and completion stored in `localStorage` (`storyplay-onboarding-complete`).
- **Tutorial** header button replays the tour anytime.

**How it works**

- `useStoryState` initializes from `createBlankStory()`; `activeDemoStoryId` is `null` for blank projects.
- `StarterTemplateModal` and `requestLoadTemplate()` in `App.jsx` handle deliberate demo loads with a confirm dialog when the graph, variables, or characters have content.
- `OnboardingTour` renders via a portal on `document.body` so overlays are not clipped by panel `overflow`.

---

#### Character registry and reference tokens

**What was added**

- **Story-level `characters` array** — `{ id, name, description, aliases }` with stable IDs (e.g. `char_…`), managed in a full-screen **Characters** workspace.
- **Reference tokens** — Insert `{{character:char_001.name}}` into node content and choice labels; plain text stories still work unchanged.
- **`renderStoryText(text, storyState)`** — Resolves tokens for display; missing characters show `[Missing character]`.
- **`ReferenceTextarea`** — “Insert character” dropdown inserts tokens at the cursor and shows a live preview when tokens are present.
- **Export** — `story.characters` included in v1 export; node/choice text is resolved to current names in downloaded JSON (`resolveReferences: true` by default).
- **Play in new tab** — Preview snapshot includes `characters` so play mode resolves names consistently.

**How it works**

- Tokens are stored in source text, not via find-and-replace on visible names—renaming a character updates every reference automatically.
- `countCharacterReferences()` warns before delete when a character is still referenced.
- Token syntax is designed to extend later (`{{location:…}}`, `{{variable:…}}`, `{{player.name}}`, etc.).

---

#### Minigame block styling (play / preview)

**What was added**

- Shared **`.minigame-play-*`** styles for Trait Picker, Persuasion, and Choice Weighting blocks in preview/play mode.
- Visual alignment with StoryPlay’s dark UI: slate cards, indigo selection/hover, styled progress meter, and primary confirm buttons.
- **`preview-block-minigame`** variant on the preview card when a mini-game block is active.

---

#### Custom panel scrollbars

**What was added**

- **`custom-scrollbar`** utility class plus shared rules for editor panels, variables/characters screens, modals, onboarding tooltips, mini-game editor columns, play mode, and form textareas.
- **9px** WebKit scrollbars (track, thumb, hover, active, corner) and **thin** Firefox `scrollbar-color`—dark inset track, purple/indigo gradient thumb with subtle glow.
- React Flow / canvas viewport is intentionally excluded.

---

### Changed

- **Header** — Demo story `<select>` replaced with project status (“Blank project” / template name) and **Example stories**; **Characters** button opens the character workspace.
- **Dirty / template detection** — `isStoryDirty` and template-load confirmation account for `characters` in the story signature.

### Fixed

- **Onboarding tooltip positioning** — Tooltips no longer clip off-screen on small viewports, header toolbar steps, or sidebar placements; uses measured tooltip size, automatic flip (top/bottom/left/right), viewport clamping (16px margin), `visualViewport` support, resize/scroll/ResizeObserver updates, and portal rendering.
- **Minigame blocks in preview** — Trait Picker and related blocks no longer appear as unstyled default browser controls.

---

#### Story export (v1 JSON)

**What was added**

- **`schemas/storyplay-export.v1.schema.json`** — JSON Schema describing the export document: envelope (`formatVersion`, optional `exportedAt` and `meta`) plus `story: { variables, nodes }` aligned with existing editor state.
- **`src/utils/serializeStoryPlayExport.js`** — `serializeStoryPlayExportV1()` builds the export object from in-memory `{ nodes, variables }` (deep clone, optional stripping of `data.graphIssues` for clean files). `STORYPLAY_EXPORT_FORMAT_VERSION` and `downloadStoryPlayExportV1()` trigger a browser download of that JSON.
- **Header control** — **Export Game** in `App.jsx` downloads the current story as JSON.
- **Development helpers** (dev build only) — `window.__storyplayLogExport()` and `window.__storyplayDownloadExport()` in the browser console for quick inspection without using the button.

**How it works**

- Export serializes the same shape the app already uses: global `variables` and React Flow–style `nodes` (including `position` and full `data`). Graph edges are not stored; they remain implied by `data.choices[].targetNodeId` (and timed timeout targets) as in the editor.
- `formatVersion` is `1`. Each export includes `exportedAt` (ISO timestamp) unless callers override serializer options. By default, `data.graphIssues` is removed from cloned nodes so the file is suitable as a portable story artifact rather than editor diagnostics.
- **Export Game** calls `downloadStoryPlayExportV1({ nodes, variables })`, which creates a temporary blob URL and saves a file such as `storyplay-export-<timestamp>.json`.

**Limitations**

- **Import** is not implemented; downloads are one-way until an importer exists.
- **Assets** (images, audio, etc.) are not bundled; only JSON-serializable story data is exported.
- **Start node** is not written automatically into `meta.startNodeId`; consumers still follow the same implicit rules as the app (for example, first node or selection) unless you extend the serializer to set `meta`.
- **`enterEffects`** may exist on nodes but are not applied by the current play preview; exported stories preserve that field for fidelity, not guaranteed runtime behavior.
- **Export Game** is only on the main app header; it is not shown while the full-screen mini-game editor is open.
- **JSON Schema** documents intended shape; strict validation at export time is not wired in yet.

**Next steps**

- Add **Import** (file picker + merge/replace into `useStoryState`) with `formatVersion` checks and user-visible errors.
- Optional **runtime-only** export mode (omit `position`, strip more editor-only fields) for smaller player bundles.
- **ZIP** (or similar) packaging when binary assets and a standalone player are introduced.
- **Validate** exports against the schema (or a shared Zod/JSON Schema step) before download and on import.
