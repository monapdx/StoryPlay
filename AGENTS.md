# AGENTS.md

## Project Overview

StoryPlay is a Twine-inspired visual story builder for branching interactive fiction.
It uses a node-based editor, playable preview mode, variables, conditions, and choice effects.

This project should stay:
- visual
- understandable
- demo-friendly
- easy to extend without rewrites

Primary goal:
Preserve StoryPlay as a clear, hackable branching-story builder rather than turning it into an over-engineered framework.

---

## Tech Stack

- React
- Vite
- React Flow
- JavaScript (ES modules)

Verified scripts:
- `npm run dev`
- `npm run build`
- `npm run preview`

---

## High-Level Architecture

The repo is organized around a few clear responsibilities:

- `src/components/canvas/`
  - visual node graph editing
  - custom story nodes
  - custom edges
  - search/navigation within the canvas

- `src/components/editor/`
  - sidebar editing UI
  - node content editing
  - choices editing
  - conditions/effects editing
  - variable editing
  - widget editing

- `src/components/preview/`
  - playable story mode
  - preview rendering
  - choice interaction

- `src/components/widgets/`
  - reusable in-story widgets like health, gold, countdown, and chat

- `src/hooks/`
  - state management for story editing and play state

- `src/utils/`
  - story logic
  - conditions/effects helpers
  - import/export logic
  - node/edge helper functions

- `src/data/sampleStory.js`
  - canonical demo story data
  - useful reference for story shape and expected schema

---

## Current Product Shape

Verified feature areas include:
- node-based visual story editor
- branching narrative design
- play preview mode
- variables
- conditional choices
- choice effects
- node search and zoom

Planned features listed in the repo README include:
- node enter effects
- chat-style story blocks
- countdown timer challenges
- puzzle widgets
- inventory system
- mini-games

Treat planned features as directional, not fully implemented.

---

## Story Data Expectations

Story data currently includes:
- top-level `variables`
- `nodes` array
- each node has an `id`, `type`, `position`, and `data`
- node `data` includes fields like:
  - `title`
  - `content`
  - `blockType`
  - `choices`

Choices may include:
- `id`
- `label`
- `targetNodeId`
- `conditions`
- `effects`

Do not invent a new schema unless the task explicitly requires a schema migration.

When changing story structure:
1. preserve backward compatibility where possible
2. update sample story data
3. update any affected editor, preview, and utility logic together

---

## Core Development Rules

1. Make minimal, surgical changes
2. Follow existing repo structure before creating new patterns
3. Keep editor, canvas, preview, and story logic in sync
4. Do not rewrite major subsystems unless explicitly requested
5. Prefer readability over abstraction
6. Avoid adding dependencies unless clearly justified
7. Preserve the demo/playable nature of the project

---

## Workflow for Any Non-Trivial Task

Before writing code:

1. Identify whether the change affects:
   - canvas rendering
   - editor UI
   - preview/play mode
   - story schema
   - utility logic
   - sample/demo content

2. Summarize current behavior first

3. Propose a short step-by-step plan

4. Implement in small stages

5. After each stage, report:
   - files changed
   - what behavior changed
   - how to test it
   - what remains unverified

Do not jump straight into coding large features.

---

## Change-Type Guidance

### 1. Canvas / Node Graph Changes
Use for:
- node appearance
- edge rendering
- graph layout behavior
- search/zoom improvements
- node connection behavior

Be careful to avoid:
- breaking existing node IDs or edge generation
- changing editor assumptions without updating related code
- changing graph visuals in ways that make the demo harder to understand

### 2. Editor Changes
Use for:
- sidebar editing
- variable editing
- choice editing
- condition/effect UI
- widget configuration

Be careful to avoid:
- updating form UI without updating saved data shape
- introducing fields that preview mode cannot interpret
- duplicating logic already handled in utils

### 3. Preview / Play Changes
Use for:
- story simulation
- choice availability
- variable updates
- rendering special block types

Be careful to avoid:
- preview behavior drifting away from editor assumptions
- silently ignoring invalid conditions/effects
- introducing game logic without a visible way to author it in the editor

### 4. Schema / Logic Changes
Use for:
- conditions
- effects
- node types
- import/export
- story validation

Be careful to avoid:
- changing schema in only one layer
- breaking old sample stories
- making import/export incompatible without documenting it

---

## File Reading Priorities

For most tasks, inspect these first:

### For feature work
- `src/App.jsx`
- `src/hooks/useStoryState.js`
- `src/hooks/usePlayState.js`
- related component folder for the task
- related utility files in `src/utils/`

### For editor issues
- `src/components/editor/SidebarEditor.jsx`
- related editor subcomponents
- relevant utilities for conditions/effects/node helpers

### For preview issues
- `src/components/preview/StoryPreview.jsx`
- preview subcomponents
- `usePlayState`
- story logic utilities

### For graph issues
- `src/components/canvas/StoryCanvas.jsx`
- `StoryNode.jsx`
- `StoryEdge.jsx`
- edge/node helper utilities

### For schema/debugging
- `src/data/sampleStory.js`
- import/export utilities
- conditions/effects/story logic utilities

---

## Testing Expectations

When making changes, always verify as many of these as apply:

### Basic
- app starts with `npm run dev`
- app builds with `npm run build`

### Editor
- selecting nodes still works
- editing content still persists
- adding/removing choices still works
- variable editing still works

### Canvas
- nodes still render correctly
- edges still connect correctly
- search/zoom behavior still works

### Preview
- sample story still plays
- conditional choices behave correctly
- choice effects modify variables correctly
- endings or terminal nodes still behave sensibly

### Data Integrity
- sample story still loads
- import/export still works if touched
- no accidental schema mismatch between editor and preview

If a change touches story logic, test with at least one branching path and one condition/effect path.

---

## UI / UX Guidance

StoryPlay should feel:
- clean
- legible
- visual
- approachable for non-programmers

Prefer:
- obvious controls
- clear labels
- minimal clutter
- helpful defaults

Avoid:
- dense developer-centric UI
- hidden behavior
- unexplained schema fields
- flashy design that hurts readability

---

## Demo Content Rules

This repo includes a demo story and should always remain easy to try immediately.

When adding features:
- update demo/sample content when useful
- ensure the feature is actually visible in the sample story if appropriate
- keep the sample understandable and not overly large

Do not turn the default sample into a confusing stress test.

---

## Dependency Rules

Before adding any package:
1. check whether existing React/Vite/React Flow patterns can solve it
2. prefer local utilities/components first
3. justify the dependency in plain English

Do not add libraries for:
- trivial formatting
- simple state helpers
- minor UI conveniences
unless there is a strong reason

---

## Output Format Expected from AI

For any coding task, always return:

1. Summary of current behavior
2. Proposed implementation plan
3. Files changed
4. What was implemented
5. How to test it
6. Known limitations or risks
7. Recommended next step

---

## Safe Defaults for AI Agents

When uncertain:
- inspect relevant files first
- prefer preserving current behavior
- make the smallest reasonable change
- say what is unverified

Never:
- fabricate file contents
- assume schema details without checking
- perform broad rewrites without request
- change unrelated UI while fixing a targeted issue

---

## Good Task Framing Examples

### Good
- "Inspect how choices are stored and add a duplicate-choice action with minimal UI changes."
- "Map how conditional choices are evaluated, then add support for a new operator."
- "Improve preview rendering for chat blocks without changing the story schema."
- "Add a new widget type by following existing widget patterns."

### Bad
- "Rebuild the entire architecture."
- "Convert everything to a more scalable system."
- "Refactor the whole app before making this tiny fix."

---

## Project Priorities

In order of importance:

1. working story editor
2. working playable preview
3. understandable story schema
4. easy demo/onboarding experience
5. extensibility for future story/game features

Optimize for continuity and clarity, not cleverness.