# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

#### First-run onboarding and blank-slate editor

**What was added**

- **Blank project by default** — New sessions start with an empty graph (`nodes: []`, `variables: {}`) instead of auto-loading the Escape Room demo.
- **Canvas empty state** — When there are no blocks, a centered card offers “Add your first block,” “Open tutorial,” and “Load example story.”
- **Starter templates** — Built-in demos (Crossroads, Market Day, Timed Nerve, Escape Room, Guild Audition) moved to an **Example stories** modal; loading replaces the project only after confirmation when content already exists.
- **Guided tour** — Nine-step onboarding (story map, Add Block, sidebar, add choices, expand choices, preview, variables, export, templates) with spotlight tooltips, **Skip tour** / **Finish**, and completion stored in `localStorage` (`storyplay-onboarding-complete`).
- **Tutorial scaffolding** — During the tour, a **Tutorial Scene** is created when needed; the **Add choices** step seeds two example choices with a staggered reveal animation.
- **Expand-to-edit step** — A dedicated tour step spotlights the blue **▾** arrow on choice rows and explains how to expand a choice to edit it.
- **Tutorial** header button replays the tour anytime.

**How it works**

- `useStoryState` initializes from `createBlankStory()`; `activeDemoStoryId` is `null` for blank projects.
- `StarterTemplateModal` and `requestLoadTemplate()` in `App.jsx` handle deliberate demo loads with a confirm dialog when the graph, variables, or characters have content.
- `OnboardingTour` renders via a portal on `document.body` so overlays are not clipped by panel `overflow`.
- `ensureOnboardingScaffold()` in `useStoryState` selects or creates a tutorial block and optionally seeds demo choices for tour steps.

---

#### Chat block conversation turns

**What was added**

- **Chat reply vs go to block** — Chat blocks distinguish **chat reply** choices (in-thread conversation) from **go to block** choices (leave the chat for another scene). Set via **Choice type** in the choice editor.
- **Player and NPC sides** — Chat reply choices support a **reply button** label, optional **player message** (chat bubble text; defaults to the button label), and **NPC response** lines (`Name: message` format, one line per message).
- **Schema fields** — `choiceKind` (`chatReply` | `goTo`), `playerMessage`, and `npcResponse` documented in `schemas/storyplay-export.v1.schema.json`.
- **Play flow** — Picking a chat reply shows the player message, animates NPC response lines, applies choice effects after the NPC turn, then offers the next reply or exit choices.

**How it works**

- Opening NPC script lives in block **content** (`Name: message` lines). Reply turns use per-choice **NPC response** text parsed by the same chat line rules as content.
- `getChatPrefaceLines()` stops auto-play before the first `You:` line when reply choices exist so the player picks their response from choices.
- Graph health warns when a chat reply choice has no NPC response.

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
- **Sidebar editor** — Trimmed helper text and empty-state copy to reduce scrolling; node ID shown as a compact footnote instead of a full helper box.
- **Choice rows** — Collapsible headers use a larger, bright blue **▾** chevron with hover and onboarding pulse styles. Choices start **collapsed** when selecting a block, changing block type, or adding new choices; click a row (or chevron) to expand or collapse.
- **Chat choice editor** — Player and NPC fields grouped into labeled **Player** / **NPC** sections with shorter placeholders.
- **Reference tokens** — Token regex tolerates optional whitespace (e.g. `{{character: char_id.name}}`). Chat bubbles resolve tokens at **display time** so renames and late-loaded characters update without restarting the thread.
- **Export schema** — Choice definition documents `choiceKind`, `playerMessage`, and `npcResponse` for chat blocks.

### Fixed

- **Onboarding tooltip positioning** — Tooltips no longer clip off-screen on small viewports, header toolbar steps, or sidebar placements; uses measured tooltip size, automatic flip (top/bottom/left/right), viewport clamping (16px margin), `visualViewport` support, resize/scroll/ResizeObserver updates, and portal rendering.
- **Minigame blocks in preview** — Trait Picker and related blocks no longer appear as unstyled default browser controls.
- **Chat speaker parsing** — `splitChatLine()` ignores colons inside `{{character:…}}` tokens so lines like `{{character:char_id.name}}: Hello` resolve the speaker name instead of splitting on the token’s internal colon.
- **Chat preview reply turns** — NPC responses after a chat reply no longer disappear when choice effects update variables; chat thread init runs on block entry / preview reset only, not on every variable re-render. Choice effects apply after the NPC response animation completes.
- **Character names in chat preview** — Reference tokens in chat speakers and messages resolve to character names in play preview and quick preview (including tokens with spaces after the colon).

---

#### Story export (v1 JSON)

**What was added**

- **`schemas/storyplay-export.v1.schema.json`** — JSON Schema describing the export document: envelope (`formatVersion`, optional `exportedAt` and `meta`) plus `story: { variables, characters, nodes }` aligned with existing editor state.
- **`src/utils/serializeStoryPlayExport.js`** — `serializeStoryPlayExportV1()` builds the export object from in-memory `{ nodes, variables, characters }` (deep clone, optional stripping of `data.graphIssues` for clean files). `STORYPLAY_EXPORT_FORMAT_VERSION` and `downloadStoryPlayExportV1()` trigger a browser download of that JSON.
- **Header control** — **Export Game** in `App.jsx` downloads the current story as JSON.
- **Development helpers** (dev build only) — `window.__storyplayLogExport()` and `window.__storyplayDownloadExport()` in the browser console for quick inspection without using the button.

**How it works**

- Export serializes the same shape the app already uses: global `variables` and React Flow–style `nodes` (including `position` and full `data`). Graph edges are not stored; they remain implied by `data.choices[].targetNodeId` (and timed timeout targets) as in the editor.
- `formatVersion` is `1`. Each export includes `exportedAt` (ISO timestamp) unless callers override serializer options. By default, `data.graphIssues` is removed from cloned nodes so the file is suitable as a portable story artifact rather than editor diagnostics.
- **Export Game** calls `downloadStoryPlayExportV1({ nodes, variables, characters })`, which creates a temporary blob URL and saves a file such as `storyplay-export-<timestamp>.json`.

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
