import { describe, expect, it } from "vitest";
import type { StoryNode } from "../src/types/story";
import {
  applyConnectionInList,
  connectDefaultTransitionInList,
  connectExistingChoiceInList,
  removeEdgeFromList,
  setSpecialNodeLinkInList,
} from "../src/utils/nodeChoiceMutations";
import {
  buildStoryEdgesFromNodes,
  makeChoiceHandleId,
} from "../src/utils/nodeGraphLinks";
import { normalizeStoryNodes } from "../src/utils/nodeHelpers";
import { createStoryUndoHistory } from "../src/utils/storyUndoHistory";

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

function scene(): StoryNode[] {
  return normalizeStoryNodes([
    node("A", {}, [{ id: "c1", label: "Pick left", targetNodeId: "" }]),
    node("B"),
    node("C"),
  ]);
}

function byId(nodes: StoryNode[], id: string) {
  return nodes.find((n) => n.id === id);
}

function choicesOf(nodes: StoryNode[], id: string) {
  return byId(nodes, id)?.data?.choices || [];
}

describe("generic node connector (default transition)", () => {
  it("sets the source node's continueNodeId", () => {
    const nodes = scene();
    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: "continue",
    });

    expect(byId(next, "A")?.data?.continueNodeId).toBe("B");
  });

  it("does not change the source node's choices length", () => {
    const nodes = scene();
    const before = choicesOf(nodes, "A").length;
    const next = connectDefaultTransitionInList(nodes, "A", "B");

    expect(choicesOf(next, "A")).toHaveLength(before);
  });

  it("does not change the target node's choices length", () => {
    const nodes = scene();
    const before = choicesOf(nodes, "B").length;
    const next = connectDefaultTransitionInList(nodes, "A", "B");

    expect(choicesOf(next, "B")).toHaveLength(before);
  });

  it("does not invent a 'Go to' choice", () => {
    const nodes = scene();
    const next = connectDefaultTransitionInList(nodes, "A", "B");

    const labels = choicesOf(next, "A").map((c) => String(c.label || ""));
    expect(labels.some((label) => /^go to/i.test(label))).toBe(false);
    // The continue target must not appear as a choice destination either.
    expect(choicesOf(next, "A").some((c) => c.targetNodeId === "B")).toBe(false);
  });

  it("does not alter either node's title or content", () => {
    const nodes = scene();
    const next = connectDefaultTransitionInList(nodes, "A", "B");

    expect(byId(next, "A")?.data?.title).toBe("Title A");
    expect(byId(next, "A")?.data?.content).toBe("Content A");
    expect(byId(next, "B")?.data?.title).toBe("Title B");
    expect(byId(next, "B")?.data?.content).toBe("Content B");
  });
});

describe("choice-specific connector", () => {
  it("updates only the targeted choice's targetNodeId", () => {
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
  });

  it("does not alter sibling choices", () => {
    const nodes = normalizeStoryNodes([
      node("A", {}, [
        { id: "c1", label: "one", targetNodeId: "" },
        { id: "c2", label: "two", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const next = connectExistingChoiceInList(nodes, "A", "c1", "B");

    expect(choicesOf(next, "A")).toHaveLength(2);
    expect(choicesOf(next, "A")[0].targetNodeId).toBe("B");
    expect(choicesOf(next, "A")[1].targetNodeId).toBe("C");
    expect(choicesOf(next, "A")[1].label).toBe("two");
  });
});

describe("specialized connectors", () => {
  it("success handle updates only successNodeId", () => {
    const nodes = scene();
    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "B",
      sourceHandle: "success",
    });

    const data = byId(next, "A")?.data;
    expect(data?.successNodeId).toBe("B");
    expect(data?.failureNodeId ?? "").toBe("");
    expect(data?.timeoutTargetNodeId ?? "").toBe("");
    expect(data?.continueNodeId ?? "").toBe("");
    expect(choicesOf(next, "A")).toHaveLength(1);
  });

  it("failure handle updates only failureNodeId", () => {
    const nodes = scene();
    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "C",
      sourceHandle: "failure",
    });

    const data = byId(next, "A")?.data;
    expect(data?.failureNodeId).toBe("C");
    expect(data?.successNodeId ?? "").toBe("");
    expect(data?.timeoutTargetNodeId ?? "").toBe("");
  });

  it("timeout handle updates only timeoutTargetNodeId", () => {
    const nodes = scene();
    const next = applyConnectionInList(nodes, {
      source: "A",
      target: "C",
      sourceHandle: "timeout",
    });

    const data = byId(next, "A")?.data;
    expect(data?.timeoutTargetNodeId).toBe("C");
    expect(data?.successNodeId ?? "").toBe("");
    expect(data?.failureNodeId ?? "").toBe("");
  });

  it("setSpecialNodeLinkInList only writes the given field", () => {
    const nodes = scene();
    const next = setSpecialNodeLinkInList(nodes, "A", "successNodeId", "B");
    expect(byId(next, "A")?.data?.successNodeId).toBe("B");
    expect(byId(next, "A")?.data?.continueNodeId ?? "").toBe("");
  });
});

describe("edge generation distinguishes link kinds", () => {
  it("emits distinct continuation and choice edges", () => {
    const nodes = normalizeStoryNodes([
      node("A", { continueNodeId: "B" }, [
        { id: "c1", label: "choose C", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const edges = buildStoryEdgesFromNodes(nodes).filter(
      (edge) => edge.source === "A"
    );

    const continueEdge = edges.find((e) => e.data.linkKind === "continue");
    const choiceEdge = edges.find((e) => e.data.linkKind === "choice");

    expect(continueEdge).toBeDefined();
    expect(choiceEdge).toBeDefined();
    expect(continueEdge!.id).not.toBe(choiceEdge!.id);
    expect(continueEdge!.id.startsWith("continue_")).toBe(true);
    expect(choiceEdge!.id.startsWith("choice_")).toBe(true);
    expect(continueEdge!.sourceHandle).toBe("continue");
    expect(choiceEdge!.sourceHandle).toBe(makeChoiceHandleId("c1"));
  });
});

describe("edge deletion", () => {
  it("deleting a continuation edge clears only continueNodeId", () => {
    const nodes = normalizeStoryNodes([
      node("A", { continueNodeId: "B" }, [
        { id: "c1", label: "choose C", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const continueEdge = buildStoryEdgesFromNodes(nodes).find(
      (e) => e.data.linkKind === "continue"
    )!;
    const next = removeEdgeFromList(nodes, continueEdge.id);

    expect(byId(next, "A")?.data?.continueNodeId).toBe("");
    // The choice is untouched.
    expect(choicesOf(next, "A")).toHaveLength(1);
    expect(choicesOf(next, "A")[0].targetNodeId).toBe("C");
  });

  it("deleting a choice edge clears the choice destination but keeps the choice", () => {
    const nodes = normalizeStoryNodes([
      node("A", { continueNodeId: "B" }, [
        { id: "c1", label: "choose C", targetNodeId: "C" },
      ]),
      node("B"),
      node("C"),
    ]);

    const choiceEdge = buildStoryEdgesFromNodes(nodes).find(
      (e) => e.data.linkKind === "choice"
    )!;
    const next = removeEdgeFromList(nodes, choiceEdge.id);

    expect(choicesOf(next, "A")).toHaveLength(1);
    expect(choicesOf(next, "A")[0].targetNodeId).toBe("");
    expect(choicesOf(next, "A")[0].label).toBe("choose C");
    // Continuation link is untouched.
    expect(byId(next, "A")?.data?.continueNodeId).toBe("B");
  });
});

describe("undo / redo of a default transition", () => {
  it("restores prior link state without adding or removing choices", () => {
    const history = createStoryUndoHistory<{ nodes: StoryNode[] }>();

    const initial = scene();
    history.recordBeforeMutation({ nodes: initial }, { immediate: true });

    const connected = connectDefaultTransitionInList(initial, "A", "B");
    expect(byId(connected, "A")?.data?.continueNodeId).toBe("B");
    expect(choicesOf(connected, "A")).toHaveLength(1);

    const undone = history.undo({ nodes: connected });
    expect(undone).not.toBeNull();
    expect(byId(undone!.nodes, "A")?.data?.continueNodeId ?? "").toBe("");
    expect(choicesOf(undone!.nodes, "A")).toHaveLength(1);

    const redone = history.redo({ nodes: undone!.nodes });
    expect(redone).not.toBeNull();
    expect(byId(redone!.nodes, "A")?.data?.continueNodeId).toBe("B");
    expect(choicesOf(redone!.nodes, "A")).toHaveLength(1);
  });
});

describe("persistence and player-visible options", () => {
  it("preserves direct transitions across save/reload", () => {
    const nodes = connectDefaultTransitionInList(scene(), "A", "B");

    const reloaded = normalizeStoryNodes(
      JSON.parse(JSON.stringify(nodes)) as unknown[]
    );

    expect(byId(reloaded, "A")?.data?.continueNodeId).toBe("B");
  });

  it("keeps the direct transition out of the choices list", () => {
    const nodes = connectDefaultTransitionInList(scene(), "A", "B");
    const choices = choicesOf(nodes, "A");

    // Player-visible options are exactly the authored choices; the continue
    // target is not represented as (or hidden inside) a choice.
    expect(choices).toHaveLength(1);
    expect(choices.some((c) => c.targetNodeId === "B")).toBe(false);
    expect(byId(nodes, "A")?.data?.continueNodeId).toBe("B");
  });
});
