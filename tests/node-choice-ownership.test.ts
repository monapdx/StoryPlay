import { describe, expect, it } from "vitest";
import type { StoryNode } from "../src/types/story";
import {
  addChoiceToNodeInList,
  removeChoiceFromNodeInList,
  removeEdgeFromList,
  updateChoiceOnNodeInList,
} from "../src/utils/nodeChoiceMutations";
import { buildStoryEdgesFromNodes } from "../src/utils/nodeGraphLinks";
import { normalizeStoryNodes } from "../src/utils/nodeHelpers";
import { createStoryUndoHistory } from "../src/utils/storyUndoHistory";

function narrativeNode(
  id: string,
  choices: Array<Record<string, unknown>> = []
): StoryNode {
  return {
    id,
    type: "storyNode",
    position: { x: 0, y: 0 },
    data: {
      title: id,
      content: "",
      blockType: "narrative",
      choices: choices as StoryNode["data"]["choices"],
      enterEffects: [],
    },
  };
}

function baseNodes(): StoryNode[] {
  // Node A already has one choice so index collisions are meaningful.
  return normalizeStoryNodes([
    narrativeNode("A", [{ label: "A choice 0", targetNodeId: "" }]),
    narrativeNode("B", [{ label: "B choice 0", targetNodeId: "" }]),
  ]);
}

function choicesOf(nodes: StoryNode[], id: string) {
  return nodes.find((node) => node.id === id)?.data?.choices || [];
}

describe("node-id-based choice ownership", () => {
  it("adds a choice only to the target node, regardless of selection", () => {
    const nodes = baseNodes();
    // Simulate "node A is selected" — the mutation must ignore that and use B.
    const next = addChoiceToNodeInList(nodes, "B");

    expect(choicesOf(next, "A")).toHaveLength(1);
    expect(choicesOf(next, "B")).toHaveLength(2);
    expect(choicesOf(next, "A")[0].label).toBe("A choice 0");
  });

  it("routes rapid consecutive adds to the exact clicked node", () => {
    // Mirror the hook's functional updates: setNodes(prev => addChoice(prev, id)).
    let nodes = baseNodes();
    nodes = addChoiceToNodeInList(nodes, "B");
    nodes = addChoiceToNodeInList(nodes, "A");
    nodes = addChoiceToNodeInList(nodes, "B");

    // A: original + 1, B: original + 2 — nothing leaked to a stale selection.
    expect(choicesOf(nodes, "A")).toHaveLength(2);
    expect(choicesOf(nodes, "B")).toHaveLength(3);
  });

  it("updates a choice on B without touching the same index on A", () => {
    const nodes = baseNodes();
    const next = updateChoiceOnNodeInList(nodes, "B", 0, "label", "changed");

    expect(choicesOf(next, "B")[0].label).toBe("changed");
    expect(choicesOf(next, "A")[0].label).toBe("A choice 0");
  });

  it("removes a choice from B without removing one from A", () => {
    const nodes = baseNodes();
    const next = removeChoiceFromNodeInList(nodes, "B", 0);

    expect(choicesOf(next, "B")).toHaveLength(0);
    expect(choicesOf(next, "A")).toHaveLength(1);
  });

  it("keeps existing connections stable when a choice is added elsewhere", () => {
    let nodes = normalizeStoryNodes([
      narrativeNode("A", [{ label: "to B", targetNodeId: "B" }]),
      narrativeNode("B"),
      narrativeNode("C"),
    ]);

    const edgeBefore = buildStoryEdgesFromNodes(nodes).find(
      (edge) => edge.source === "A" && edge.target === "B"
    );

    nodes = addChoiceToNodeInList(nodes, "C");

    const edgeAfter = buildStoryEdgesFromNodes(nodes).find(
      (edge) => edge.source === "A" && edge.target === "B"
    );

    expect(edgeBefore?.id).toBeDefined();
    expect(edgeAfter?.id).toBe(edgeBefore?.id);
  });
});

describe("edge identity and deletion", () => {
  it("produces unique edge ids for multiple choices to the same target", () => {
    const nodes = normalizeStoryNodes([
      narrativeNode("A", [
        { label: "first", targetNodeId: "B" },
        { label: "second", targetNodeId: "B" },
      ]),
      narrativeNode("B"),
    ]);

    const edges = buildStoryEdgesFromNodes(nodes).filter(
      (edge) => edge.source === "A" && edge.target === "B"
    );

    expect(edges).toHaveLength(2);
    expect(edges[0].id).not.toBe(edges[1].id);
    expect(new Set(edges.map((edge) => edge.id)).size).toBe(2);
  });

  it("clears only the targeted choice's destination and preserves the choice", () => {
    const nodes = normalizeStoryNodes([
      narrativeNode("A", [
        { label: "first", targetNodeId: "B" },
        { label: "second", targetNodeId: "B" },
      ]),
      narrativeNode("B"),
    ]);

    const edges = buildStoryEdgesFromNodes(nodes).filter(
      (edge) => edge.source === "A"
    );
    const next = removeEdgeFromList(nodes, edges[0].id);

    // Both choices remain — an edge and a choice are not the same entity.
    const remaining = choicesOf(next, "A");
    expect(remaining).toHaveLength(2);
    expect(remaining[0].label).toBe("first");
    expect(remaining[0].targetNodeId).toBe("");
    expect(remaining[1].label).toBe("second");
    expect(remaining[1].targetNodeId).toBe("B");
  });
});

describe("legacy normalization and persistence", () => {
  it("assigns stable ids to imported legacy choices without altering data", () => {
    const legacy = [
      {
        id: "legacy-A",
        data: {
          title: "A",
          blockType: "narrative",
          choices: [
            {
              label: "Legacy label",
              targetNodeId: "legacy-B",
              conditions: [{ variable: "gold", op: "gte", value: 1 }],
              effects: [{ variable: "seen", op: "set", value: true }],
            },
          ],
        },
      },
      { id: "legacy-B", data: { title: "B", blockType: "narrative", choices: [] } },
    ];

    const normalized = normalizeStoryNodes(legacy);
    const choice = choicesOf(normalized, "legacy-A")[0];

    expect(typeof choice.id).toBe("string");
    expect((choice.id as string).length).toBeGreaterThan(0);
    // Everything else is preserved verbatim.
    expect(choice.label).toBe("Legacy label");
    expect(choice.targetNodeId).toBe("legacy-B");
    expect(choice.conditions).toEqual([
      { variable: "gold", op: "gte", value: 1 },
    ]);
    expect(choice.effects).toEqual([
      { variable: "seen", op: "set", value: true },
    ]);
  });

  it("preserves choice ownership and connections across save/reload", () => {
    const nodes = normalizeStoryNodes([
      narrativeNode("A", [
        { label: "to B", targetNodeId: "B" },
        { label: "to C", targetNodeId: "C" },
      ]),
      narrativeNode("B"),
      narrativeNode("C"),
    ]);

    // Round-trip through JSON (localStorage) then normalize again on load.
    const reloaded = normalizeStoryNodes(
      JSON.parse(JSON.stringify(nodes)) as unknown[]
    );

    expect(choicesOf(reloaded, "A").map((c) => c.id)).toEqual(
      choicesOf(nodes, "A").map((c) => c.id)
    );

    const edgesBefore = buildStoryEdgesFromNodes(nodes)
      .map((edge) => edge.id)
      .sort();
    const edgesAfter = buildStoryEdgesFromNodes(reloaded)
      .map((edge) => edge.id)
      .sort();

    expect(edgesAfter).toEqual(edgesBefore);
  });
});

describe("undo/redo choice ownership", () => {
  it("restores the correct source node for each choice", () => {
    const history = createStoryUndoHistory<{ nodes: StoryNode[] }>();

    const initial = baseNodes();
    // Record before mutating (matches recordHistory({ immediate: true })).
    history.recordBeforeMutation({ nodes: initial }, { immediate: true });

    const mutated = addChoiceToNodeInList(initial, "B");
    expect(choicesOf(mutated, "B")).toHaveLength(2);
    expect(choicesOf(mutated, "A")).toHaveLength(1);

    const undone = history.undo({ nodes: mutated });
    expect(undone).not.toBeNull();
    expect(choicesOf(undone!.nodes, "B")).toHaveLength(1);
    expect(choicesOf(undone!.nodes, "A")).toHaveLength(1);

    const redone = history.redo({ nodes: undone!.nodes });
    expect(redone).not.toBeNull();
    expect(choicesOf(redone!.nodes, "B")).toHaveLength(2);
    expect(choicesOf(redone!.nodes, "A")).toHaveLength(1);
  });
});
