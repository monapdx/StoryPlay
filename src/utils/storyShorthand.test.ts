import { describe, expect, it } from "vitest";
import type { Story } from "../types/story";
import { applyChoiceDeclaration, parseChoiceDeclaration } from "./storyShorthand";

const baseStory = (): Story => ({
  variables: {},
  nodes: [
    {
      id: "start",
      position: { x: 0, y: 0 },
      data: { title: "The Decision", blockType: "narrative", content: "Choose.", choices: [] },
    },
    {
      id: "victory",
      position: { x: 400, y: 0 },
      data: { title: "Victory", blockType: "ending", content: "You win." },
    },
  ],
});

describe("story choice shorthand", () => {
  it("parses a complete choice and rejects ordinary prose or incomplete commands", () => {
    expect(parseChoiceDeclaration("ch: Agree ---> Victory")).toEqual({
      label: "Agree",
      destination: "Victory",
    });
    expect(parseChoiceDeclaration("The character said ch: Agree ---> Victory")).toBeNull();
    expect(parseChoiceDeclaration("ch: Agree ---> ")).toBeNull();
  });

  it("links to an existing destination without duplicating it", () => {
    const original = baseStory();
    const result = applyChoiceDeclaration(original, { label: "Agree", destination: "victory" }, { sourceNodeId: "start" });
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].data.choices?.[0].targetNodeId).toBe("victory");
    expect(original.nodes[0].data.choices).toEqual([]);
  });

  it("creates a missing destination and a linked choice", () => {
    const result = applyChoiceDeclaration(baseStory(), { label: "Refuse", destination: "Failure" }, { sourceNodeId: "start" });
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[2].data.title).toBe("Failure");
    expect(result.nodes[0].data.choices?.[0].targetNodeId).toBe(result.nodes[2].id);
  });

  it("edits a choice while preserving its conditions and effects", () => {
    const original = baseStory();
    original.nodes[0].data.choices = [{
      id: "existing",
      label: "Agree",
      targetNodeId: "victory",
      conditions: [{ variable: "gold", operator: "gte", value: 10 }],
      effects: [{ variable: "gold", operation: "subtract", value: 10 }],
    }];
    const result = applyChoiceDeclaration(
      original,
      { label: "Refuse", destination: "Failure" },
      { sourceNodeId: "start", choiceId: "existing" }
    );
    const choice = result.nodes[0].data.choices![0];
    expect(choice.id).toBe("existing");
    expect(choice.label).toBe("Refuse");
    expect(choice.targetNodeId).toBe(result.nodes[2].id);
    expect(choice.conditions).toEqual(original.nodes[0].data.choices[0].conditions);
    expect(choice.effects).toEqual(original.nodes[0].data.choices[0].effects);
  });
});
