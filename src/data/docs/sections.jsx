/**
 * Per-section documentation content. Each renderer is keyed by catalog id.
 */

function DocP({ children }) {
  return <p className="docs-p">{children}</p>;
}

function DocH3({ children }) {
  return <h3 className="docs-h3">{children}</h3>;
}

function DocUl({ children }) {
  return <ul className="docs-ul">{children}</ul>;
}

function DocOl({ children }) {
  return <ol className="docs-ol">{children}</ol>;
}

function DocCode({ children }) {
  return <code className="docs-inline-code">{children}</code>;
}

function DocPre({ children, title }) {
  return (
    <figure className="docs-code-block">
      {title ? <figcaption className="docs-code-block__title">{title}</figcaption> : null}
      <pre>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

function DocCallout({ title, children }) {
  return (
    <aside className="docs-callout">
      {title ? <p className="docs-callout__title">{title}</p> : null}
      <div className="docs-callout__body">{children}</div>
    </aside>
  );
}

const SECTION_RENDERERS = {
  "getting-started": () => (
    <>
      <DocP>
        StoryPlay is a visual editor for branching interactive fiction—think Twine with a
        node graph, built-in game systems, and a live play mode. You design scenes as{" "}
        <strong>blocks</strong> on a canvas, connect them with <strong>choices</strong>, and
        preview the story without leaving the app.
      </DocP>
      <DocH3>What you need</DocH3>
      <DocUl>
        <li>A modern browser (Chrome, Firefox, Edge, or Safari).</li>
        <li>No coding required for basic stories—use the sidebar to edit text and choices.</li>
      </DocUl>
      <DocH3>First visit</DocH3>
      <DocP>
        New projects start <strong>blank</strong>. The canvas shows a welcome card with{" "}
        <strong>Add your first block</strong>, <strong>Open tutorial</strong>, or{" "}
        <strong>Load example story</strong>. The guided tour walks through the main controls;
        replay it anytime with <DocCode>Tutorial</DocCode> in the editor header.
      </DocP>
      <DocH3>Main areas</DocH3>
      <DocUl>
        <li>
          <strong>Canvas</strong> — story map; drag blocks, draw connections, search and zoom.
        </li>
        <li>
          <strong>Sidebar</strong> — edit the selected block&apos;s title, text, choices, and
          conditions.
        </li>
        <li>
          <strong>Variables / Characters</strong> — full-screen workspaces for story-wide data.
        </li>
        <li>
          <strong>Preview</strong> — quick play panel or <DocCode>Play in new tab</DocCode> for
          full-screen testing.
        </li>
      </DocUl>
    </>
  ),

  "your-first-story": () => (
    <>
      <DocCallout title="Quick path">
        Follow these six steps to go from empty canvas to a playable export.
      </DocCallout>
      <DocOl>
        <li>
          <strong>Add a block</strong> — Click <DocCode>Add Block</DocCode> on the canvas toolbar
          (or use the empty-state card). A new narrative block appears.
        </li>
        <li>
          <strong>Write scene text</strong> — Select the block. In the sidebar, set a title and
          type your opening paragraph in the content field.
        </li>
        <li>
          <strong>Add choices</strong> — Scroll to <DocCode>Choices</DocCode> in the sidebar and
          click <DocCode>+ Add choice</DocCode>. Give each choice a short label the player will
          see.
        </li>
        <li>
          <strong>Connect choices to other blocks</strong> — Add a second block for another scene.
          Drag from a choice&apos;s handle on the canvas to the target block, or pick a target from
          the choice&apos;s <DocCode>Go to block</DocCode> dropdown.
        </li>
        <li>
          <strong>Preview the story</strong> — Open <DocCode>Preview</DocCode> in the header or{" "}
          <DocCode>Play in new tab</DocCode>. Pick choices and confirm the flow feels right.
        </li>
        <li>
          <strong>Export the game</strong> — Click <DocCode>Export Game</DocCode> to download a
          StoryPlay JSON file you can back up or re-import later.
        </li>
      </DocOl>
      <DocP>
        Tip: mark one block as your starting scene by selecting it before previewing, or load an
        example from <DocCode>Example stories</DocCode> to see a complete graph.
      </DocP>
    </>
  ),

  "building-stories": () => (
    <>
      <DocP>
        A StoryPlay project is a <strong>graph</strong> of blocks (nodes) linked by player
        choices. The canvas shows the big picture; the sidebar edits one block at a time.
      </DocP>
      <DocH3>Blocks (nodes)</DocH3>
      <DocP>
        Each block has an id, position on the canvas, and a <DocCode>data</DocCode> object with
        title, content, block type, and choices. Select a block to edit it; drag to rearrange.
      </DocP>
      <DocH3>Choices</DocH3>
      <DocP>
        Choices are how the player moves through the story. Each choice has a label, an optional
        target block id, and optional <strong>conditions</strong> (when the choice is available)
        and <strong>effects</strong> (what changes when picked).
      </DocP>
      <DocH3>Connections</DocH3>
      <DocP>
        Draw an edge from a choice handle to another block, or set the target in the sidebar.
        Mini-game blocks can also branch via success/failure/continue fields—see{" "}
        <DocCode>Mini-Games</DocCode>.
      </DocP>
      <DocH3>Diagnostics</DocH3>
      <DocP>
        Story diagnostics flag missing targets, undefined variables, and other issues so you can
        fix them before export.
      </DocP>
    </>
  ),

  "block-types": () => (
    <>
      <DocH3>Narrative</DocH3>
      <DocP>
        Standard scene text plus branching choices. The workhorse block for most story beats.
      </DocP>
      <DocH3>Chat</DocH3>
      <DocP>
        Line-based script shown as chat bubbles. Use <DocCode>Name: message</DocCode> per line;
        <DocCode>You:</DocCode> lines are outgoing. See <DocCode>Chat Conversations</DocCode> for
        reply vs go-to choices.
      </DocP>
      <DocH3>Timed</DocH3>
      <DocP>
        Countdown challenge. When time runs out, the story can jump to a timeout block and apply
        timeout effects on variables.
      </DocP>
      <DocH3>Ending</DocH3>
      <DocP>Terminal beat—usually no choices. Use for credits, epilogues, or game over.</DocP>
      <DocH3>Mini-game</DocH3>
      <DocP>
        Interactive mechanics: trait picker, persuasion dialogue, or choice weighting. Edited in the
        full-screen mini-game editor; see <DocCode>Mini-Games</DocCode>.
      </DocP>
    </>
  ),

  variables: () => (
    <>
      <DocP>
        Variables are story-wide values—gold, health, flags, scores. Open the{" "}
        <DocCode>Variables</DocCode> workspace from the header to add and edit them.
      </DocP>
      <DocH3>Conditions and effects</DocH3>
      <DocP>
        On any choice you can require conditions (e.g. <DocCode>gold &gt;= 10</DocCode>) and apply
        effects when picked (<DocCode>add</DocCode>, <DocCode>set</DocCode>,{" "}
        <DocCode>subtract</DocCode>, <DocCode>toggle</DocCode>).
      </DocP>
      <DocH3>Player-facing stats</DocH3>
      <DocP>
        Use <DocCode>playerLabel</DocCode> and <DocCode>playerDescription</DocCode> in variable
        metadata so preview and <DocCode>#/play</DocCode> show friendly stat cards instead of raw
        variable names. Stats stay hidden until they matter.
      </DocP>
      <DocH3>Example</DocH3>
      <DocPre title="Choice effect (conceptual)">{`{
  "label": "Buy the map (10 gold)",
  "targetNodeId": "node_shop_success",
  "conditions": [{ "variable": "gold", "operator": "gte", "value": 10 }],
  "effects": [{ "variable": "gold", "operation": "subtract", "value": 10 }]
}`}</DocPre>
    </>
  ),

  characters: () => (
    <>
      <DocP>
        Characters are reusable entities with an id, display name, description, and aliases. Define
        them once in the <DocCode>Characters</DocCode> workspace, then reference them in any text
        field.
      </DocP>
      <DocH3>Reference tokens</DocH3>
      <DocP>
        Insert <DocCode>{"{{character:char_001.name}}"}</DocCode> into block content, choice
        labels, or chat lines. At play time the token resolves to the current character name—rename
        a character and every reference updates automatically.
      </DocP>
      <DocP>
        Whitespace inside tokens is tolerated:{" "}
        <DocCode>{"{{character: char_001.name}}"}</DocCode>. Use <DocCode>Insert character</DocCode>{" "}
        in text fields for a dropdown that inserts tokens at the cursor.
      </DocP>
      <DocH3>Export note</DocH3>
      <DocP>
        By default, export resolves tokens to plain names in the JSON file. Re-import still works
        with your character registry intact.
      </DocP>
    </>
  ),

  "chat-conversations": () => (
    <>
      <DocP>
        Chat blocks play out as a threaded conversation. Opening lines use{" "}
        <DocCode>Speaker: text</DocCode> format—one line per bubble.
      </DocP>
      <DocH3>Chat reply choices</DocH3>
      <DocP>
        Keep the player in the same block. Set a <strong>reply button</strong> label, optional{" "}
        <strong>player message</strong> (what appears in the player bubble), and{" "}
        <strong>NPC response</strong> lines after the pick. Leave <DocCode>After Reply, Go To</DocCode>{" "}
        empty to continue talking in-thread.
      </DocP>
      <DocH3>Go-to-block choices</DocH3>
      <DocP>
        Leave the chat UI and jump to another block—useful when the conversation ends or the scene
        changes location.
      </DocP>
      <DocCallout title="Example opening script">
        <DocPre>{`Guard: Halt! State your business.
You: I'm looking for the merchant.
Guard: She's in the square.`}</DocPre>
      </DocCallout>
    </>
  ),

  "mini-games": () => (
    <>
      <DocP>
        Mini-game blocks add interactive beats between narrative scenes. Select a mini-game block
        and click <DocCode>Open Mini-Game Editor</DocCode> for the full-screen editor.
      </DocP>
      <DocH3>Trait picker</DocH3>
      <DocP>
        Player selects traits within min/max limits. Optional trait list variable and per-trait
        variable patches on confirm.
      </DocP>
      <DocH3>Persuasion</DocH3>
      <DocP>
        Score-based dialogue with turns, threshold, and success/failure branch targets. Note:
        persuasion uses <DocCode>choices</DocCode> for dialogue lines with score deltas—not story
        navigation choices.
      </DocP>
      <DocH3>Choice weighting</DocH3>
      <DocP>
        Distribute a fixed point budget across options. Optional result variable and exact-total
        lock.
      </DocP>
      <DocP>
        Use <DocCode>Back</DocCode> in the mini-game editor to save draft changes to the block;
        <DocCode>Save</DocCode> commits when you are done editing.
      </DocP>
    </>
  ),

  templates: () => (
    <>
      <DocP>
        New sessions start with a <strong>blank project</strong>. Load a starter from{" "}
        <DocCode>Example stories</DocCode> in the header when you want a ready-made graph.
      </DocP>
      <DocH3>Built-in examples</DocH3>
      <DocUl>
        <li>
          <strong>Crossroads</strong> — simple branch.
        </li>
        <li>
          <strong>Market Day</strong> — variables, conditional buy, chat.
        </li>
        <li>
          <strong>Timed Nerve</strong> — countdown and timeout.
        </li>
        <li>
          <strong>Escape Room</strong> — chat, timed, key logic.
        </li>
        <li>
          <strong>Guild Audition</strong> — trait picker → persuasion → choice weighting → endings.
        </li>
      </DocUl>
      <DocP>
        Loading a template replaces your current project after confirmation if you already have
        content.
      </DocP>
    </>
  ),

  "import-export": () => (
    <>
      <DocH3>Export</DocH3>
      <DocP>
        Click <DocCode>Export Game</DocCode> to download a <DocCode>.json</DocCode> file (StoryPlay
        export v1). Keep backups, share with collaborators, or archive milestones.
      </DocP>
      <DocH3>Import</DocH3>
      <DocP>
        Click <DocCode>Import Project</DocCode>, choose a StoryPlay JSON file, review the
        validation summary (node, variable, and character counts), then confirm to replace the
        current project.
      </DocP>
      <DocH3>Auto-save</DocH3>
      <DocP>
        The editor also auto-saves your working project to browser storage (~1.5s after edits) so a
        refresh does not lose work. Export is still recommended for durable backups.
      </DocP>
      <DocH3>What is not in the file</DocH3>
      <DocP>
        Canvas <strong>edges</strong> are not stored separately—they are rebuilt from each choice&apos;s{" "}
        <DocCode>targetNodeId</DocCode> (and mini-game branch fields) on import.
      </DocP>
    </>
  ),

  "json-format": () => (
    <>
      <DocP>
        StoryPlay export v1 is a JSON document with <DocCode>formatVersion</DocCode>, optional{" "}
        <DocCode>exportedAt</DocCode>, and a <DocCode>story</DocCode> object. The full schema lives
        in <DocCode>schemas/storyplay-export.v1.schema.json</DocCode>.
      </DocP>
      <DocCallout title="Simplified example — not a complete file">
        <DocPre>{`{
  "formatVersion": 1,
  "exportedAt": "2026-06-29T12:00:00.000Z",
  "story": {
    "variables": { "gold": 20, "hasKey": false },
    "variableMeta": {
      "gold": { "playerLabel": "Gold", "icon": "🪙" }
    },
    "characters": [
      { "id": "char_guard", "name": "Guard", "description": "", "aliases": [] }
    ],
    "nodes": [
      {
        "id": "node_start",
        "type": "storyNode",
        "position": { "x": 0, "y": 0 },
        "data": {
          "title": "Town Gate",
          "blockType": "narrative",
          "content": "The guard blocks the road.",
          "choices": [
            {
              "id": "choice_1",
              "label": "Talk to the guard",
              "targetNodeId": "node_chat"
            }
          ]
        }
      }
    ]
  }
}`}</DocPre>
      </DocCallout>
      <DocP>
        Every node should include <DocCode>type: "storyNode"</DocCode>. Positions are editor layout
        hints; play logic uses ids and choice targets.
      </DocP>
    </>
  ),

  "keyboard-shortcuts": () => (
    <>
      <DocH3>Undo / redo (editor)</DocH3>
      <DocUl>
        <li>
          <DocCode>Ctrl+Z</DocCode> / <DocCode>Cmd+Z</DocCode> — undo
        </li>
        <li>
          <DocCode>Ctrl+Y</DocCode> or <DocCode>Ctrl+Shift+Z</DocCode> /{" "}
          <DocCode>Cmd+Shift+Z</DocCode> — redo
        </li>
      </DocUl>
      <DocP>
        Shortcuts apply on the canvas and apply to story-wide history (blocks, choices, variables,
        characters). They are skipped while focus is in a text field. Undo/redo buttons also appear
        on the canvas toolbar.
      </DocP>
      <DocH3>Mini-game editor</DocH3>
      <DocP>
        Separate undo/redo for in-progress mini-game edits before saving back to the block.
      </DocP>
    </>
  ),

  faq: () => (
    <>
      <DocH3>Do I need to code?</DocH3>
      <DocP>
        No. The sidebar covers text, choices, variables, and block types. JSON export is optional
        for backups or advanced workflows.
      </DocP>
      <DocH3>How do I test my story?</DocH3>
      <DocP>
        Use header <DocCode>Preview</DocCode> for a docked panel, or <DocCode>Play in new tab</DocCode>{" "}
        for full-screen <DocCode>#/play</DocCode> mode that stays in sync with the editor.
      </DocP>
      <DocH3>Why is a choice missing in play?</DocH3>
      <DocP>
        Check <strong>conditions</strong> on that choice—failed conditions hide the option. Also
        confirm the target block exists (see diagnostics).
      </DocP>
      <DocH3>Can I share my game as a standalone app?</DocH3>
      <DocP>
        Not yet. Today you export JSON and play inside StoryPlay. Standalone player export is on the
        roadmap.
      </DocP>
    </>
  ),

  roadmap: () => (
    <>
      <DocP>Near-future directions (not all scheduled):</DocP>
      <DocUl>
        <li>
          <strong>Asset bundling</strong> — images and audio packaged with the story.
        </li>
        <li>
          <strong>Standalone player export</strong> — shareable HTML or runtime bundle.
        </li>
        <li>
          <strong>Richer runtime validation</strong> — clearer errors at play time.
        </li>
        <li>
          <strong>More block types</strong> — puzzles, inventory, additional mini-games.
        </li>
        <li>
          <strong>Reusable templates</strong> — author-saved starters beyond built-in examples.
        </li>
        <li>
          <strong>Node enter effects</strong> — apply variable changes when entering a block.
        </li>
      </DocUl>
    </>
  ),
};

export function renderDocSection(sectionId) {
  const render = SECTION_RENDERERS[sectionId];
  return render ? render() : null;
}
