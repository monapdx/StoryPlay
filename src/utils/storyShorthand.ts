import type { Story, StoryChoice, StoryNode } from "../types/story";

/**
 * First building block for the dual-editor redesign.
 *
 * A line beginning with "ch:" declares a choice and its destination:
 *   ch: Refuse ---> Failure
 *
 * The helper updates the same Story model used by the visual editor and player.
 * It never changes existing choice conditions or effects.
 */
export interface ChoiceDeclaration {
  label: string;
  destination: string;
}

export function parseChoiceDeclaration(line: string): ChoiceDeclaration | null {
  const match = /^\s*ch:\s*(.*?)\s*--->\s*(.*?)\s*$/i.exec(line);
  if (!match || !match[1].trim() || !match[2].trim()) return null;
  return { label: match[1].trim(), destination: match[2].trim() };
}

function uniqueId(prefix: string, used: Set<string>): string {
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index++;
  const id = `${prefix}-${index}`;
  used.add(id);
  return id;
}

export interface ApplyChoiceDeclarationOptions {
  /** Node currently open in the writing editor. */
  sourceNodeId: string;
  /** Existing choice id when editing a formatted declaration. */
  choiceId?: string;
}

/**
 * Apply one declaration without mutating the input story.
 * Existing destination titles are resolved case-insensitively; new ones
 * create blank narrative nodes. Node ids, not titles, remain the references.
 */
export function applyChoiceDeclaration(
  story: Story,
  declaration: ChoiceDeclaration,
  options: ApplyChoiceDeclarationOptions
): Story {
  const source = story.nodes.find(node => node.id === options.sourceNodeId);
  if (!source) throw new Error(`Unknown source node: ${options.sourceNodeId}`);

  const nodes: StoryNode[] = story.nodes.map(node => ({
    ...node,
    data: { ...node.data, choices: node.data.choices?.map(choice => ({ ...choice })) },
  }));
  const sourceCopy = nodes.find(node => node.id === options.sourceNodeId)!;
  const usedNodeIds = new Set(nodes.map(node => node.id));
  let destination = nodes.find(
    node => node.data.title?.trim().toLocaleLowerCase() === declaration.destination.trim().toLocaleLowerCase()
  );
  if (!destination) {
    const id = uniqueId("story-node", usedNodeIds);
    destination = {
      id,
      type: "storyNode",
      position: {
        x: (source.position?.x ?? 0) + 320,
        y: (source.position?.y ?? 0) + nodes.length * 100,
      },
      data: { title: declaration.destination.trim(), content: "", blockType: "narrative", choices: [] },
    };
    nodes.push(destination);
  }

  const choices = [...(sourceCopy.data.choices ?? [])];
  const existingIndex = options.choiceId
    ? choices.findIndex(choice => choice.id === options.choiceId)
    : -1;
  if (options.choiceId && existingIndex < 0) {
    throw new Error(`Unknown choice: ${options.choiceId}`);
  }
  if (existingIndex >= 0) {
    choices[existingIndex] = {
      ...choices[existingIndex],
      label: declaration.label,
      targetNodeId: destination.id,
    };
  } else {
    const usedChoiceIds = new Set(
      nodes.flatMap(node => (node.data.choices ?? []).map(choice => choice.id).filter((id): id is string => !!id))
    );
    const choice: StoryChoice = {
      id: uniqueId("choice", usedChoiceIds),
      label: declaration.label,
      targetNodeId: destination.id,
      conditions: [],
      effects: [],
    };
    choices.push(choice);
  }
  sourceCopy.data.choices = choices;
  return { ...story, nodes };
}
