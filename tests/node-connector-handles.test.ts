import { describe, expect, it } from "vitest";
import type { StoryNode } from "../src/types/story";
import {
  addChoiceToNodeInList,
  applyConnectionInList,
  removeChoiceFromNodeInList,
} from "../src/utils/nodeChoiceMutations";
import {
  CONTINUE_HANDLE_ID,
  INPUT_HANDLE_ID,
  makeChoiceHandleId,
} from "../src/utils/nodeGraphLinks";
import { getNodeHandleModel } from "../src/utils/nodeHandleModel";
import { normalizeStoryNodes } from "../src/utils/nodeHelpers";

function node(
  id: string,
  overrides: Record<string, unknown> = {},
  choices: Array<Record<string, unknown>> = []
): StoryNode {
  return {
    id,
    type: "storyNode",
    position: { x: 0, y: 0 },
    data: {
      title: `Title ${id}`,
      content: `Content ${id}`,
      blockType: "narrative",
      choices: choices as StoryNode["data"]["choices"],
      enterEffects: [],
      ...overrides,
    },
  };
}

function byId(nodes: StoryNode[], id: string) {
  return nodes.find((n) => n.id === id);
}

function choicesOf(nodes: StoryNode[], id: string) {
  return byId(nodes, id)?.data?.choices || [];
}

/**
 * The node's two outer connector dots are exactly the target (input) and the
 * generic continuation source. Choice and specialized handles are inline and
 * never counted here.
 */
function outerHandleIds(data: StoryNode["data"]): string[] {
  const model = getNodeHandleModel(data);
  return [model.inputHandleId, model.continueHandleId];
}

describe("outer node handles are constant", () => {
  it("a node with zero choices has one input and one generic source", () => {
    const [a] = normalizeStoryNodes([node("A")]);
    const model = getNodeHandleModel(a.data);

    expect(model.inputHandleId).toBe(INPUT_HANDLE_ID);
    expect(model.continueHandleId).toBe(CONTINUE_HANDLE_ID);
    expect(model.choiceHandles).toHaveLength(0);
    expect(outerHandleIds(a.data)).toEqual([INPUT_HANDLE_ID, CONTINUE_HANDLE_ID]);
  });

  it("a node with one choice still has only two outer handles", () => {
    const [a] = normalizeStoryNodes([
      node("A", {}, [{ id: "c1", label: "one", targetNodeId: "" }]),
    ]);

    expect(outerHandleIds(a.data)).toEqual([INPUT_HANDLE_ID, CONTINUE_HANDLE_ID]);
    expect(getNodeHandleModel(a.data).choiceHandles).toHaveLength(1);
  });

  it("a node with multiple choices still has only two outer handles", () => {
    const [a] = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "" },
        { id: "c3", label: "three", targetNodeId: "" },
      ]),
    ]);

    expect(outerHandleIds(a.data)).toEqual([INPUT_HANDLE_ID, CONTINUE_HANDLE_ID]);
    expect(getNodeHandleModel(a.data).choiceHandles).toHaveLength(3);
  });
});

describe("choice handles are associated with their choice", () => {
  it("each choice handle id maps to the correct choice id", () => {
    const [a] = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "" },
      ]),
    ]);

    const model = getNodeHandleModel(a.data);
    expect(model.choiceHandles).toEqual([
      { id: makeChoiceHandleId("c1"), choiceId: "c1" },
      { id: makeChoiceHandleId("c2"), choiceId: "c2" },
    ]);
  });
});

describe("adding / removing a choice does not change outer handles", () => {
  it("adding a choice adds a choice handle but no outer dot", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [{ id: "c1", label: "one", targetNodeId: "" }]),
    ]);

    const before = getNodeHandleModel(byId(nodes, "A")!.data);
    const after = getNodeHandleModel(
      byId(addChoiceToNodeInList(nodes, "A"), "A")!.data
    );

    // Outer handles are byte-for-byte identical.
    expect([after.inputHandleId, after.continueHandleId]).toEqual([
      before.inputHandleId,
      before.continueHandleId,
    ]);
    // One extra choice handle appeared inline.
    expect(after.choiceHandles).toHaveLength(before.choiceHandles.length + 1);
  });

  it("removing a choice removes its inline handle but keeps outer handles", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "" },
      ]),
    ]);

    const after = getNodeHandleModel(
      byId(removeChoiceFromNodeInList(nodes, "A", 0), "A")!.data
    );

    expect([after.inputHandleId, after.continueHandleId]).toEqual([
      INPUT_HANDLE_ID,
      CONTINUE_HANDLE_ID,
    ]);
    expect(after.choiceHandles).toHaveLength(1);
    expect(after.choiceHandles[0].choiceId).toBe("c2");
  });
});

describe("generic and choice connections stay separate", () => {
  it("connecting a choice handle updates only that choice's targetNodeId", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "" },
      ]),
      node("B"),
    ]);

    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: makeChoiceHandleId("c1"),
    });

    expect(choicesOf(next, "A")[0].targetNodeId).toBe("B");
    expect(choicesOf(next, "A")[1].targetNodeId).toBe("");
    // The direct-continuation field is untouched.
    expect(byId(next, "A")?.data?.continueNodeId ?? "").toBe("");
  });

  it("connecting the generic right-side handle updates only continueNodeId", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [{ id: "c1", label: "one", targetNodeId: "" }]),
      node("B"),
    ]);

    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: CONTINUE_HANDLE_ID,
    });

    expect(byId(next, "A")?.data?.continueNodeId).toBe("B");
    // No choice was mutated or created.
    expect(choicesOf(next, "A")).toHaveLength(1);
    expect(choicesOf(next, "A")[0].targetNodeId).toBe("");
  });
});

describe("specialized (mini-game / timed) handles", () => {
  it("a timed block exposes a labeled timeout handle", () => {
    const [a] = normalizeStoryNodes([node("A", { blockType: "timed" })]);
    const model = getNodeHandleModel(a.data);

    const timeout = model.specialHandles.find((h) => h.id === "timeout");
    expect(timeout).toBeDefined();
    expect(timeout!.label).toBe("Timeout");
  });

  it("a persuasion block exposes labeled success and failure handles", () => {
    const [a] = normalizeStoryNodes([node("A", { blockType: "persuasion" })]);
    const model = getNodeHandleModel(a.data);

    const ids = model.specialHandles.map((h) => h.id);
    expect(ids).toContain("success");
    expect(ids).toContain("failure");
    // Persuasion "choices" never become graph connection handles.
    expect(model.choiceHandles).toHaveLength(0);
  });

  it("multiple specialized handles are visually distinguishable", () => {
    const [a] = normalizeStoryNodes([
      node("A", {
        blockType: "narrative",
        successNodeId: "B",
        failureNodeId: "C",
        timeoutTargetNodeId: "D",
      }),
    ]);

    const model = getNodeHandleModel(a.data);
    const labels = model.specialHandles.map((h) => h.label);
    const ids = model.specialHandles.map((h) => h.id);

    // Distinct ids and distinct human labels — no repeated anonymous dots.
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(["Success", "Failure", "Timeout"]);
  });

  it("specialized handles appear only when a link exists or the block needs them", () => {
    const [plain] = normalizeStoryNodes([node("A")]);
    expect(getNodeHandleModel(plain.data).specialHandles).toHaveLength(0);
  });
});
