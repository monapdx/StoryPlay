import { getChoiceKind, CHOICE_KIND } from "./choiceKinds";

export interface StorySemanticValidationResult {
  errors: string[];
  warnings: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function describeNode(node: Record<string, unknown>, index: number): string {
  const data = isPlainObject(node.data) ? node.data : {};
  if (typeof data.title === "string" && data.title.trim()) return data.title;
  if (typeof node.id === "string" && node.id.trim()) return node.id;
  return `index ${index}`;
}

/**
 * Validate relationships that JSON Schema cannot express. These checks protect
 * graph identity and navigation while leaving softer authoring concerns to
 * graphHealth diagnostics.
 */
export function validateStoryPlaySemantics(
  project: unknown
): StorySemanticValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(project) || !isPlainObject(project.story)) {
    return { errors, warnings };
  }

  const nodes = Array.isArray(project.story.nodes)
    ? project.story.nodes
    : [];
  const nodeIds = new Set<string>();

  nodes.forEach((node, index) => {
    if (!isPlainObject(node) || typeof node.id !== "string") return;
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id "${node.id}".`);
    } else {
      nodeIds.add(node.id);
    }
  });

  const meta = isPlainObject(project.meta) ? project.meta : null;
  if (meta && meta.startNodeId != null && meta.startNodeId !== "") {
    if (typeof meta.startNodeId !== "string") {
      errors.push('"meta.startNodeId" must be a string when set.');
    } else if (!nodeIds.has(meta.startNodeId)) {
      errors.push(
        `"meta.startNodeId" points to missing node "${meta.startNodeId}".`
      );
    }
  }

  function validateDestination(
    nodeLabel: string,
    field: string,
    value: unknown
  ): void {
    if (value == null || value === "") return;
    if (typeof value !== "string") {
      errors.push(`Node "${nodeLabel}": "${field}" must be a string when set.`);
    } else if (!nodeIds.has(value)) {
      errors.push(
        `Node "${nodeLabel}": "${field}" points to missing node "${value}".`
      );
    }
  }

  nodes.forEach((node, nodeIndex) => {
    if (!isPlainObject(node)) return;
    const data = isPlainObject(node.data) ? node.data : {};
    const nodeLabel = describeNode(node, nodeIndex);
    const blockType =
      typeof data.blockType === "string" ? data.blockType : "narrative";

    for (const field of [
      "continueNodeId",
      "successNodeId",
      "failureNodeId",
      "timeoutTargetNodeId",
    ]) {
      validateDestination(nodeLabel, field, data[field]);
    }

    if (blockType === "persuasion" || !Array.isArray(data.choices)) return;

    data.choices.forEach((choice, choiceIndex) => {
      if (!isPlainObject(choice)) return;
      if (
        blockType === "chat" &&
        getChoiceKind(choice, blockType) === CHOICE_KIND.CHAT_REPLY
      ) {
        return;
      }

      const target = choice.targetNodeId;
      if (target == null || target === "") return;
      const choiceLabel =
        typeof choice.label === "string" && choice.label
          ? choice.label
          : String(choiceIndex + 1);
      if (typeof target !== "string") {
        errors.push(
          `Node "${nodeLabel}": choice "${choiceLabel}" has an invalid targetNodeId.`
        );
      } else if (!nodeIds.has(target)) {
        errors.push(
          `Node "${nodeLabel}": choice "${choiceLabel}" points to missing node "${target}".`
        );
      }
    });
  });

  return { errors, warnings };
}
