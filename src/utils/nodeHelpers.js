import { createNode, createChoice } from "./storyModel";

export function createNewNode(index = 0) {
  return createNode({
    position: {
      x: 180 + (index % 3) * 220,
      y: 140 + (index % 4) * 120,
    },
  });
}

export function createNewChoice() {
  return createChoice();
}