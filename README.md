# StoryPlay

| Logo | Description |
|---|---|
| <img src="product.png" width="402"> | StoryPlay is a visual editor for building playable narrative games. Design branching stories, track variables, define reusable characters, and add game mechanics using a node-based interface with live preview. **Think Twine, but visual, built-in game systems, and a real play/debug mode** |

[![Chrome Extension](https://img.shields.io/badge/%F0%9F%93%8CChrome%20Extension-111111?style=for-the-badge)](#)

## Story blocks

[![Narrative](https://img.shields.io/badge/%F0%9F%93%96%20Narrative-111111?style=for-the-badge)](#block-types) [![Chats](https://img.shields.io/badge/%F0%9F%92%AC%20Chats-111111?style=for-the-badge)](#block-types) [![Timed](https://img.shields.io/badge/%F0%9F%95%90%20Timed-111111?style=for-the-badge)](#block-types) [![Ending](https://img.shields.io/badge/%F0%9F%8F%81%20Ending-111111?style=for-the-badge)](#block-types)

## Screenshot

<img src="https://raw.githubusercontent.com/monapdx/StoryPlay/refs/heads/main/StoryPlay-main-editor.png" alt="StoryPlay editor screenshot">

## Mini-game blocks

[![Trait Picker](https://img.shields.io/badge/%F0%9F%91%89Trait%20Picker-111111?style=for-the-badge)](#block-types) [![Persuasion](https://img.shields.io/badge/%E2%9C%A8Persuasion-111111?style=for-the-badge)](#block-types) [![Choice Weighting](https://img.shields.io/badge/%E2%9A%96%EF%B8%8FChoice%20Weighting-111111?style=for-the-badge)](#block-types)

## Planned mini-games

[![Word Jumbles](https://img.shields.io/badge/%F0%9F%94%A4%20Word%20Jumbles-111111?style=for-the-badge)](#) [![Riddles](https://img.shields.io/badge/%E2%9D%93Riddles-111111?style=for-the-badge)](#) [![Alchemy](https://img.shields.io/badge/%F0%9F%94%A5%20Alchemy-111111?style=for-the-badge)](#) [![City Builder](https://img.shields.io/badge/%F0%9F%8F%A1%20City%20Builder-111111?style=for-the-badge)](#) [![Cards](https://img.shields.io/badge/%E2%9F%A3%EF%B8%8F%20Cards-111111?style=for-the-badge)](#)

## Contents

- [StoryPlay](#storyplay)
  - [Block types](#block-types)
  - [Characters and reference tokens](#characters-and-reference-tokens)
  - [Built-in demo stories](#built-in-demo-stories)
  - [Features](#features)
  - [Export](#export)
  - [Tech stack](#tech-stack)
  - [Running locally](#running-locally)
  - [Changelog](#changelog)
  - [Planned features](#planned-features)

## Block types

### Story blocks

- **Narrative** — Body text plus branching **choices** (label, target node, optional **conditions** and **effects** on variables).
- **Chat** — Line-based script rendered as chat bubbles in preview. Opening lines use **`Name: message`** (or character tokens as the speaker). Lines starting with `You:` are outgoing. After the opening script, the player picks **chat reply** choices to continue the conversation in-thread, or **go to block** choices to leave for another scene.
  - **Chat reply** choices support a **reply button** label, optional **player message** (what appears in the player’s bubble), and **NPC response** lines (`Name: message` per line).
  - Leave **After Reply, Go To** empty to keep talking in the same block.
- **Timed** — **Countdown**; at zero the preview can jump to a **timeout target** node and apply **timeout effects** (same effect model as choices).
- **Ending** — Typically has no choices; used as a terminal beat.

### Mini-game blocks

Edited in the sidebar summary plus a **full-screen mini-game editor** (header: **Open Mini-Game Editor** when a mini-game node is selected):

- **Trait picker** — Pick traits within min/max counts; optional **trait list variable** and per-trait variable patches.
- **Persuasion** — Score, threshold, turns, dialogue lines with deltas; **success** / **failure** branch node ids and optional score/success variables.
- **Choice weighting** — Distribute a fixed **point budget** across options; optional **result variable**, **variable prefix**, and exact-total lock.

## Characters and reference tokens

Define characters once in the full-screen **Characters** workspace (`{ id, name, description, aliases }`).

Insert **`{{character:char_id.name}}`** tokens into block content, choice labels, and chat lines. Renaming a character updates every reference at play time. Tokens tolerate optional whitespace (e.g. `{{character: char_id.name}}`).

Use **Insert character** in text fields for a dropdown that inserts tokens at the cursor and shows a live preview when tokens are present.

## Built-in demo stories

New projects start **blank** (empty canvas). Load a starter from **Example stories** in the header (with confirmation if you already have content):

- `Crossroads` (simple branch)
- `Market Day` (variables + conditional buy + chat)
- `Timed Nerve` (countdown + timeout result)
- `Escape Room` (chat + timed + key logic)
- `Guild Audition` (trait picker → persuasion → choice weighting → gated endings)

## Features

- **Graph canvas** (React Flow): add nodes, drag positions, draw connections from handles to create choices, **search**, **minimap**, **controls**, background grid.
- **Block inspector**: title, `blockType`, collapsible content (narrative / chat / ending / mini-game prompt), timed timer + timeout wiring.
- **Choice editor**: collapsible choice rows (click the row or the blue **▾** arrow to expand). Targets, conditions (`equals`, `notEquals`, numeric compares, …), effects (`set`, `add`, `subtract`, `toggle`). Chat blocks add **chat reply** vs **go to block** choice types.
- **Characters workspace** and **Variables workspace** (full-screen editors for story-wide data).
- **Story diagnostics** (graph health: missing targets, undefined variables in conditions/effects, missing chat NPC responses, etc.).
- **Guided tour** — Nine-step onboarding on first visit (canvas, add block, sidebar, add choices, expand choices, preview, variables, export, templates). The tour seeds example choices and highlights the expand arrow. Replay anytime via **Tutorial** in the header.
- **Play Preview** (sidebar **Quick preview**): start from selected node, follow allowed choices, **Back** (history), **Reset**; supports narrative, chat (staggered reveal, player/NPC reply turns, character token resolution), timed auto-advance, and the three mini-game UIs.
- **Play in new tab**: opens `#/play` player mode and keeps that tab in sync with debounced editor snapshot updates after first launch (includes `characters` for token resolution).
- **Export Game** (header): downloads **StoryPlay export v1** JSON (`schemas/storyplay-export.v1.schema.json`). In **dev** only: `window.__storyplayLogExport()` and `window.__storyplayDownloadExport()` in the console.

## Export

The file includes `formatVersion`, optional `exportedAt`, and `story: { variables, characters, nodes }` (same shape as editor state). By default, reference tokens in text fields are resolved to current character names on export. **Edges** are not stored; they are implied by each node’s `choices[].targetNodeId`. **Import** and bundled/runtime distribution packaging are still planned; see [CHANGELOG.md](CHANGELOG.md) for limitations and next steps.

## Tech stack

React · Vite · React Flow · JavaScript · TypeScript (mini-game block views and `src/types`)

<img src="https://raw.githubusercontent.com/monapdx/StoryPlay/refs/heads/main/diagram.png">

## Running locally

```bash
npm install
npm run dev
npm run build
```

Then open [http://localhost:5173](http://localhost:5173).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and notable changes.

## Planned features

- **Import** v1 JSON into the editor (with validation and clear errors).
- **Runtime** application of **enter effects** on node entry (data exists today; Play Preview does not run them).
- **Richer distribution**: asset bundling, optional runtime-only export, ZIP or single-file player.
- **Additional mini-games** (see “Planned mini-games” badges above).
- **Puzzle widgets** and deeper **inventory** flows.
