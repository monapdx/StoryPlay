# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

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
