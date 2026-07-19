import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeStoryGraph } from "../src/utils/graphHealth";
import { validateStoryPlaySemantics } from "../src/utils/storySemanticValidation";

function validFixture(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "tests/fixtures/valid-all-blocks.v1.json"),
      "utf8"
    )
  ) as Record<string, unknown>;
}

function fixtureNodes(project: Record<string, unknown>): Array<Record<string, unknown>> {
  const story = project.story as { nodes: Array<Record<string, unknown>> };
  return story.nodes;
}

describe("StoryPlay semantic validation", () => {
  it("rejects duplicate node ids", () => {
    const project = validFixture();
    const nodes = fixtureNodes(project);
    nodes.push({ ...nodes[0] });

    expect(validateStoryPlaySemantics(project).errors).toContain(
      'Duplicate node id "start".'
    );
  });

  it.each([
    "continueNodeId",
    "successNodeId",
    "failureNodeId",
    "timeoutTargetNodeId",
  ])("rejects a dangling %s", (field) => {
    const project = validFixture();
    const node = fixtureNodes(project)[0];
    const data = node.data as Record<string, unknown>;
    data[field] = "missing";

    expect(validateStoryPlaySemantics(project).errors.join(" ")).toContain(
      `"${field}" points to missing node "missing"`
    );
  });

  it("rejects dangling choice and start-node references", () => {
    const project = validFixture();
    const nodes = fixtureNodes(project);
    const startData = nodes[0].data as {
      choices: Array<Record<string, unknown>>;
    };
    startData.choices[0].targetNodeId = "missing-choice-target";
    (project.meta as Record<string, unknown>).startNodeId = "missing-start";

    const errors = validateStoryPlaySemantics(project).errors.join(" ");
    expect(errors).toContain("missing-choice-target");
    expect(errors).toContain("missing-start");
  });
});

describe("Story diagnostics", () => {
  it("reports impossible score and selection ranges", () => {
    const nodes = [
      {
        id: "traits",
        data: {
          blockType: "traitPicker",
          title: "Traits",
          minSelections: 3,
          maxSelections: 1,
          options: [{ id: "one", label: "One" }],
          continueNodeId: "pitch",
        },
      },
      {
        id: "pitch",
        data: {
          blockType: "persuasion",
          title: "Pitch",
          minScore: 10,
          maxScore: 5,
          startScore: 20,
          threshold: 30,
          maxTurns: 0,
          choices: [],
        },
      },
    ];

    const codes = analyzeStoryGraph(nodes, {}).map((issue) => issue.code);
    expect(codes).toContain("invalid-selection-limits");
    expect(codes).toContain("impossible-score-range");
  });

  it("reports malformed and undefined variable references", () => {
    const issues = analyzeStoryGraph(
      [
        {
          id: "start",
          data: {
            blockType: "ending",
            title: "Result",
            content:
              "Known {{variable:score.value}}, missing {{variable:nope.value}}, broken {{variable:score}}",
            choices: [],
          },
        },
      ],
      { score: 1 }
    );

    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("malformed-reference");
    expect(codes).toContain("undefined-variable-reference");
  });
});
