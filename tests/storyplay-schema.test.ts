import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_STORIES } from "../src/data/demoStoriesCatalog";
import { prepareStoryPlayImport } from "../src/utils/importStoryPlayProject";
import { serializeStoryPlayExportV1 } from "../src/utils/serializeStoryPlayExport";
import { validateStoryPlayExportV1Schema } from "../src/utils/storyPlaySchemaValidation";

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
}

interface FixtureNode {
  id: string;
  data: Record<string, unknown>;
}

interface FixtureProject extends Record<string, unknown> {
  story: {
    nodes: FixtureNode[];
  };
}

const standaloneProjects = [
  "storyplay-import-block-type-tour.json",
  "exported-stories/storyplay-export-2026-06-29T11-38-34.345Z.json",
  "exported-stories/storyplay-export-2026-07-07T13-19-19.930Z.json",
  "exported-stories/storyplay-export-digital-death.json",
];

describe("StoryPlay v1 JSON Schema", () => {
  it("accepts a fixture containing every block type", () => {
    const fixture = readJson("tests/fixtures/valid-all-blocks.v1.json");
    expect(validateStoryPlayExportV1Schema(fixture)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each(standaloneProjects)("accepts existing project %s", (projectPath) => {
    const project = readJson(projectPath);
    const result = validateStoryPlayExportV1Schema(project);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);

    const imported = prepareStoryPlayImport(JSON.stringify(project));
    expect(imported.errors).toEqual([]);
    expect(imported.ok).toBe(true);
  });

  it.each(DEMO_STORIES)("accepts serialized demo $id", (entry) => {
    const doc = serializeStoryPlayExportV1({
      nodes: entry.story.nodes,
      variables: entry.story.variables,
      variableMeta:
        entry.story.variableMeta &&
        typeof entry.story.variableMeta === "object" &&
        !Array.isArray(entry.story.variableMeta)
          ? entry.story.variableMeta
          : {},
      characters: Array.isArray(entry.story.characters)
        ? entry.story.characters
        : [],
      includeExportedAt: false,
      resolveReferences: false,
    });

    expect(validateStoryPlayExportV1Schema(doc).errors).toEqual([]);
  });

  it("rejects malformed block-specific data", () => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as FixtureProject;
    const persuasion = fixture.story.nodes.find(
      (node) => node.data.blockType === "persuasion"
    );
    const lines = persuasion?.data.choices as Array<Record<string, unknown>>;
    delete lines[0].delta;

    const result = validateStoryPlayExportV1Schema(fixture);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it.each([
    ["traitPicker", "options", [{ id: "missing-label" }]],
    ["choiceWeighting", "options", [{ label: "Missing id" }]],
    ["persuasion", "choices", [{ id: "missing-delta", text: "Line" }]],
    [
      "chat",
      "choices",
      [{ choiceKind: "chatReply", label: "Reply", npcResponse: 42 }],
    ],
  ])("rejects malformed %s rows", (blockType, field, rows) => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as FixtureProject;
    const node = fixture.story.nodes.find(
      (candidate) => candidate.data.blockType === blockType
    );
    if (!node) throw new Error(`Missing fixture node ${blockType}`);
    node.data[field] = rows;

    expect(validateStoryPlayExportV1Schema(fixture).valid).toBe(false);
  });

  it("requires primitive condition values but permits JSON effect values", () => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as FixtureProject;
    const start = fixture.story.nodes[0];
    const choices = start.data.choices as Array<Record<string, unknown>>;
    choices[0].effects = [
      {
        variable: "allocation",
        action: "set",
        value: { focus: 2 },
      },
    ];
    choices[0].conditions = [
      {
        variable: "score",
        operator: "equals",
        value: ["not", "primitive"],
      },
    ];

    expect(validateStoryPlayExportV1Schema(fixture).valid).toBe(false);
    (choices[0].conditions as Array<Record<string, unknown>>)[0].value = 1;
    expect(validateStoryPlayExportV1Schema(fixture).errors).toEqual([]);
  });

  it("preserves forward-compatible unknown node data", () => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as FixtureProject;
    fixture.story.nodes.push({
      id: "future",
      data: {
        blockType: "futurePuzzle",
        customPayload: { answer: 42 },
      },
    });

    expect(validateStoryPlayExportV1Schema(fixture).errors).toEqual([]);
  });
});

describe("StoryPlay v1 import/export", () => {
  it.each(DEMO_STORIES)("round-trips demo $id canonically", (entry) => {
    const first = serializeStoryPlayExportV1({
      nodes: entry.story.nodes,
      variables: entry.story.variables,
      variableMeta:
        entry.story.variableMeta &&
        typeof entry.story.variableMeta === "object" &&
        !Array.isArray(entry.story.variableMeta)
          ? entry.story.variableMeta
          : {},
      characters: Array.isArray(entry.story.characters)
        ? entry.story.characters
        : [],
      includeExportedAt: false,
      cleanGraphIssues: false,
      resolveReferences: false,
    });

    const imported = prepareStoryPlayImport(JSON.stringify(first));
    expect(imported.errors).toEqual([]);
    expect(imported.story).not.toBeNull();

    const second = serializeStoryPlayExportV1({
      ...imported.story!,
      includeExportedAt: false,
      cleanGraphIssues: false,
      resolveReferences: false,
    });

    expect(second).toEqual(first);
  });

  it("rejects unknown format versions", () => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as Record<string, unknown>;
    fixture.formatVersion = 2;

    const result = prepareStoryPlayImport(JSON.stringify(fixture));
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("Unsupported StoryPlay format version 2");
  });

  it("accepts legacy v1 projects without characters", () => {
    const fixture = readJson(
      "tests/fixtures/valid-all-blocks.v1.json"
    ) as FixtureProject;
    const story = fixture.story as FixtureProject["story"] & {
      characters?: unknown[];
    };
    delete story.characters;

    const imported = prepareStoryPlayImport(JSON.stringify(fixture));
    expect(imported.errors).toEqual([]);
    expect(imported.story?.characters).toEqual([]);
  });
});
