# StoryPlay

| Logo | Description |
|---|---|
| <img src="product.png" width="402"> | StoryPlay is a **Twine-inspired visual story builder** for branching interactive fiction: a **node graph** editor (**React Flow**), **global variables**, **conditional choices** with effects, a **Play Preview**, three **mini-game** block types with a dedicated editor, and **JSON export** (v1) of the current story. |

[![Chrome Extension](https://img.shields.io/badge/%F0%9F%93%8CChrome%20Extension-111111?style=for-the-badge)](#)

## Story blocks

[![Narrative](https://img.shields.io/badge/%F0%9F%93%96%20Narrative-111111?style=for-the-badge)](#block-types) [![Chats](https://img.shields.io/badge/%F0%9F%92%AC%20Chats-111111?style=for-the-badge)](#block-types) [![Timed](https://img.shields.io/badge/%F0%9F%95%90%20Timed-111111?style=for-the-badge)](#block-types) [![Ending](https://img.shields.io/badge/%F0%9F%8F%81%20Ending-111111?style=for-the-badge)](#block-types)

## Screenshot

<img src="https://raw.githubusercontent.com/monapdx/StoryPlay/refs/heads/main/screenshot.png" alt="StoryPlay editor screenshot">

## Mini-game blocks

[![Trait Picker](https://img.shields.io/badge/%F0%9F%91%89Trait%20Picker-111111?style=for-the-badge)](#block-types) [![Persuasion](https://img.shields.io/badge/%E2%9C%A8Persuasion-111111?style=for-the-badge)](#block-types) [![Choice Weighting](https://img.shields.io/badge/%E2%9A%96%EF%B8%8FChoice%20Weighting-111111?style=for-the-badge)](#block-types)

## Planned mini-games

[![Word Jumbles](https://img.shields.io/badge/%F0%9F%94%A4%20Word%20Jumbles-111111?style=for-the-badge)](#) [![Riddles](https://img.shields.io/badge/%E2%9D%93Riddles-111111?style=for-the-badge)](#) [![Alchemy](https://img.shields.io/badge/%F0%9F%94%A5%20Alchemy-111111?style=for-the-badge)](#) [![City Builder](https://img.shields.io/badge/%F0%9F%8F%A1%20City%20Builder-111111?style=for-the-badge)](#) [![Cards](https://img.shields.io/badge/%E2%99%A3%EF%B8%8F%20Cards-111111?style=for-the-badge)](#)

## Contents

- [StoryPlay](#storyplay)
  - [Block types](#block-types)
  - [Features](#features)
  - [Export](#export)
  - [Tech stack](#tech-stack)
  - [Running locally](#running-locally)
  - [Changelog](#changelog)
  - [Planned features](#planned-features)

## Block types

### Story blocks

- **Narrative** — Body text plus branching **choices** (label, target node, optional **conditions** and **effects** on variables).
- **Chat** — Line-based script rendered as bubbles; lines starting with `You:` are outgoing. After the scripted sequence, the player picks from the block’s **choices** as replies.
- **Timed** — **Countdown**; at zero the preview can jump to a **timeout target** node and apply **timeout effects** (same effect model as choices).
- **Ending** — Typically has no choices; used as a terminal beat.

### Mini-game blocks

Edited in the sidebar summary plus a **full-screen mini-game editor** (header: **Open Mini-Game Editor** when a mini-game node is selected):

- **Trait picker** — Pick traits within min/max counts; optional **trait list variable** and per-trait variable patches.
- **Persuasion** — Score, threshold, turns, dialogue lines with deltas; **success** / **failure** branch node ids and optional score/success variables.
- **Choice weighting** — Distribute a fixed **point budget** across options; optional **result variable**, **variable prefix**, and exact-total lock.

## Features

- **Graph canvas** (React Flow): add nodes, drag positions, draw connections from handles to create choices, **search**, **minimap**, **controls**, background grid.
- **Block inspector**: title, `blockType`, content (narrative / chat / ending / mini-game prompt), timed timer + timeout wiring.
- **Choice editor**: targets, conditions (`equals`, `notEquals`, numeric compares, …), effects (`set`, `add`, `subtract`, `toggle`).
- **Variables** panel (global defaults) and **story diagnostics** (graph health: missing targets, undefined variables in conditions/effects, etc.).
- **Play Preview**: start from selected node, follow allowed choices, **Back** (history), **Reset**; supports narrative, chat (staggered reveal), timed auto-advance, and the three mini-game UIs.
- **Export Game** (header): downloads **StoryPlay export v1** JSON (`schemas/storyplay-export.v1.schema.json`). In **dev** only: `window.__storyplayLogExport()` and `window.__storyplayDownloadExport()` in the console.

## Export

The file includes `formatVersion`, optional `exportedAt`, and `story: { variables, nodes }` (same shape as editor state). **Edges** are not stored; they are implied by each node’s `choices[].targetNodeId`. **Import**, bundled **assets**, and a standalone **player** package are not implemented yet; see [CHANGELOG.md](CHANGELOG.md) for limitations and next steps.

## Tech stack

React · Vite · React Flow · JavaScript · TypeScript (mini-game block views and `src/types`)

## Running locally

```bash
npm install
npm run dev
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
