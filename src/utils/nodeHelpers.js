export function createNewNode(index = 0) {
  const id = crypto.randomUUID();

  return {
    id,
    type: "storyNode",
    position: {
      x: 180 + (index % 3) * 220,
      y: 140 + (index % 4) * 120,
    },
    data: {
      title: "New Block",
      content: "Write your story text here.",
      blockType: "narrative",
      choices: [],
    },
  };
}

export function createNewChoice() {
  return {
    id: crypto.randomUUID(),
    label: "New choice",
    targetNodeId: "",
  };
}