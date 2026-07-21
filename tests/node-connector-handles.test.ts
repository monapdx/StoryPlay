import { describe, expect, it } from "vitest";
import type { StoryNode } from "../src/types/story";
import {
  addChoiceToNodeInList,
  applyConnectionInList,
  removeChoiceFromNodeInList,
} from "../src/utils/nodeChoiceMutations";
import {
  buildStoryEdgesFromNodes,
  CONTINUE_HANDLE_ID,
  INPUT_HANDLE_ID,
  makeChoiceHandleId,
} from "../src/utils/nodeGraphLinks";
import { getNodeHandleModel } from "../src/utils/nodeHandleModel";
import { normalizeStoryNodes } from "../src/utils/nodeHelpers";
import { analyzeStoryGraph } from "../src/utils/graphHealth";

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

function modelFor(node: StoryNode) {
  return getNodeHandleModel(node.data);
}

describe("narrative continuation vs branching", () => {
  it("a node with zero choices shows one input and one generic output", () => {
    const [a] = normalizeStoryNodes([node("A")]);
    const model = modelFor(a);

    expect(model.inputHandleId).toBe(INPUT_HANDLE_ID);
    expect(model.continueHandle).not.toBeNull();
    expect(model.continueHandle?.id).toBe(CONTINUE_HANDLE_ID);
    expect(model.continueHandle?.isConflict).toBe(false);
    expect(model.choiceHandles).toHaveLength(0);
    expect(model.specialHandles).toHaveLength(0);
  });

  it("a node with one choice shows one choice handle and no generic output", () => {
    const [a] = normalizeStoryNodes([
      node("A", {}, [{ id: "c1", label: "one", targetNodeId: "" }]),
    ]);
    const model = modelFor(a);

    expect(model.inputHandleId).toBe(INPUT_HANDLE_ID);
    expect(model.choiceHandles).toHaveLength(1);
    expect(model.choiceHandles[0].id).toBe(makeChoiceHandleId("c1"));
    expect(model.continueHandle).toBeNull();
  });

  it("a node with multiple choices shows one handle per choice, no generic output", () => {
    const [a] = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "" },
        { id: "c3", label: "three", targetNodeId: "" },
      ]),
    ]);
    const model = modelFor(a);

    expect(model.choiceHandles.map((h) => h.choiceId)).toEqual([
      "c1",
      "c2",
      "c3",
    ]);
    expect(model.continueHandle).toBeNull();
  });
});

describe("ending nodes", () => {
  it("expose no source handles at all", () => {
    const [a] = normalizeStoryNodes([node("A", { blockType: "ending" })]);
    const model = modelFor(a);

    expect(model.continueHandle).toBeNull();
    expect(model.choiceHandles).toHaveLength(0);
    expect(model.specialHandles).toHaveLength(0);
  });

  it("still expose no output even if legacy data left a continueNodeId", () => {
    const [a] = normalizeStoryNodes([
      node("A", { blockType: "ending", continueNodeId: "B" }),
    ]);
    expect(modelFor(a).continueHandle).toBeNull();
  });
});

describe("adding / removing choices toggles the generic continuation", () => {
  it("adding the first choice hides the generic continuation handle", () => {
    const nodes = normalizeStoryNodes([node("A")]);
    expect(modelFor(byId(nodes, "A")!).continueHandle).not.toBeNull();

    const after = addChoiceToNodeInList(nodes, "A");
    const model = modelFor(byId(after, "A")!);

    expect(model.continueHandle).toBeNull();
    expect(model.choiceHandles).toHaveLength(1);
  });

  it("removing the final choice restores the generic continuation handle", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [{ id: "c1", label: "one", targetNodeId: "" }]),
    ]);
    expect(modelFor(byId(nodes, "A")!).continueHandle).toBeNull();

    const after = removeChoiceFromNodeInList(nodes, "A", 0);
    const model = modelFor(byId(after, "A")!);

    expect(model.choiceHandles).toHaveLength(0);
    expect(model.continueHandle).not.toBeNull();
    expect(model.continueHandle?.isConflict).toBe(false);
  });
});

describe("generic and choice connections stay separate", () => {
  it("connecting a choice handle updates only the matching choice", () => {
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
    expect(byId(next, "A")?.data?.continueNodeId ?? "").toBe("");
  });

  it("connecting the generic handle works on a node without choices", () => {
    const nodes = normalizeStoryNodes([node("A"), node("B")]);

    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: CONTINUE_HANDLE_ID,
    });

    expect(byId(next, "A")?.data?.continueNodeId).toBe("B");
    expect(choicesOf(next, "A")).toHaveLength(0);
  });
});

describe("choices + default continuation conflict", () => {
  it("surfaces a labeled fallback handle without destroying data", () => {
    const [a] = normalizeStoryNodes([
      node("A", { continueNodeId: "B" }, [
        { id: "c1", label: "branch", targetNodeId: "C" },
      ]),
    ]);
    const model = modelFor(a);

    // Both surfaces exist; nothing was deleted from the data.
    expect(a.data?.continueNodeId).toBe("B");
    expect(a.data?.choices).toHaveLength(1);

    expect(model.choiceHandles).toHaveLength(1);
    expect(model.continueHandle).not.toBeNull();
    expect(model.continueHandle?.isConflict).toBe(true);
    expect(model.continueHandle?.label).toBe("Default");
    expect(model.hasContinuationConflict).toBe(true);
  });

  it("emits a graph diagnostic when both exist", () => {
    const nodes = normalizeStoryNodes([
      node("A", { isStart: true, continueNodeId: "B" }, [
        { id: "c1", label: "branch", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const codes = analyzeStoryGraph(nodes, {}).map((issue) => issue.code);
    expect(codes).toContain("choices-and-default-continuation");
  });

  it("does not flag a plain linear node", () => {
    const nodes = normalizeStoryNodes([
      node("A", { isStart: true, continueNodeId: "B" }),
      node("B"),
    ]);

    const codes = analyzeStoryGraph(nodes, {}).map((issue) => issue.code);
    expect(codes).not.toContain("choices-and-default-continuation");
  });
});

describe("specialized block handles", () => {
  it("a persuasion block exposes labeled success and failure, no choices", () => {
    const [a] = normalizeStoryNodes([
      node("A", { blockType: "persuasion" }, [
        { id: "line1", text: "flatter", delta: 10 },
      ]),
    ]);
    const model = modelFor(a);

    expect(model.specialHandles.map((h) => h.id)).toEqual([
      "success",
      "failure",
    ]);
    expect(model.choiceHandles).toHaveLength(0);
    expect(model.continueHandle).toBeNull();
  });

  it("a timed block exposes a labeled timeout plus its choice handles", () => {
    const [a] = normalizeStoryNodes([
      node("A", { blockType: "timed", timeoutTargetNodeId: "Z" }, [
        { id: "c1", label: "run", targetNodeId: "" },
      ]),
    ]);
    const model = modelFor(a);

    expect(model.specialHandles.map((h) => h.id)).toContain("timeout");
    expect(model.choiceHandles).toHaveLength(1);
    // Branches through choices, so no generic continuation.
    expect(model.continueHandle).toBeNull();
  });

  it("trait/weighting mini-games advance via a single continuation output", () => {
    const [trait] = normalizeStoryNodes([node("A", { blockType: "traitPicker" })]);
    const [weight] = normalizeStoryNodes([
      node("B", { blockType: "choiceWeighting" }),
    ]);

    expect(modelFor(trait).continueHandle?.label).toBe("Continue");
    expect(modelFor(trait).specialHandles).toHaveLength(0);
    expect(modelFor(weight).continueHandle?.label).toBe("Continue");
    expect(modelFor(weight).specialHandles).toHaveLength(0);
  });

  it("specialized connectors remain functional and isolated", () => {
    const nodes = normalizeStoryNodes([
      node("A", { blockType: "persuasion" }),
      node("B"),
      node("C"),
    ]);

    const withSuccess = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: "success",
    });
    const withBoth = applyConnectionInList(withSuccess, {
      source: "A",
      target: "C",
      sourceHandle: "failure",
    });

    expect(byId(withBoth, "A")?.data?.successNodeId).toBe("B");
    expect(byId(withBoth, "A")?.data?.failureNodeId).toBe("C");
  });

  it("multiple specialized handles are visually distinguishable", () => {
    const [a] = normalizeStoryNodes([
      node("A", {
        successNodeId: "B",
        failureNodeId: "C",
        timeoutTargetNodeId: "D",
      }),
    ]);
    const model = modelFor(a);
    const ids = model.specialHandles.map((h) => h.id);
    const labels = model.specialHandles.map((h) => h.label);

    expect(new Set(ids).size).toBe(ids.length);
    expect(labels).toEqual(["Success", "Failure", "Timeout"]);
  });
});

describe("edge labels stay attached to their choices", () => {
  it("each choice edge carries that choice's label", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "Pick left", targetNodeId: "B" },
        { id: "c2", label: "Pick right", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const edges = buildStoryEdgesFromNodes(nodes).filter(
      (edge) => edge.source === "A" && edge.data.linkKind === "choice"
    );

    const left = edges.find(
      (edge) => edge.sourceHandle === makeChoiceHandleId("c1")
    );
    const right = edges.find(
      (edge) => edge.sourceHandle === makeChoiceHandleId("c2")
    );

    expect(left?.data.label).toBe("Pick left");
    expect(right?.data.label).toBe("Pick right");
  });
});
