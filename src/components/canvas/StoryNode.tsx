import { Handle, Position, type NodeProps } from "reactflow";
import type { MouseEvent } from "react";
import type { StoryChoice, StoryNodeData } from "../../types/story";
import type { StoryCharacter } from "../../types/storyCore";
import { renderStoryText } from "../../utils/storyReferences";
import { CONTINUE_HANDLE_ID, INPUT_HANDLE_ID } from "../../utils/nodeGraphLinks";
import { getNodeHandleModel } from "../../utils/nodeHandleModel";

/** Play highlight on canvas nodes (from StoryCanvas playStateMap). */
export type StoryCanvasNodePlayState =
  | "idle"
  | "playing"
  | "reachable"
  | "locked";

/**
 * Hydrated RF node `data` bag passed by StoryCanvas — persisted StoryNodeData
 * plus runtime characters, playState, and editor callbacks.
 * Not a persisted story schema type.
 */
export type StoryCanvasNodeData = StoryNodeData & {
  characters?: StoryCharacter[];
  isSelected?: boolean;
  playState?: StoryCanvasNodePlayState;
  onSelectNode?: (nodeId: string) => void;
  onAddChoice?: (nodeId: string) => void;
  onCenterNode?: (nodeId: string) => void;
};

export type StoryNodeProps = NodeProps<StoryCanvasNodeData>;

const BLOCK_TYPE_ICONS: Record<string, string> = {
  narrative: "◻",
  chat: "💬",
  timed: "⏱",
  ending: "🏁",
};

interface NodeIndicator {
  type: "requires" | "effects" | "enter";
  label: string;
}

function collectIndicators(
  data: StoryCanvasNodeData | Record<string, never> = {}
): NodeIndicator[] {
  const conditionVars = new Set<string>();
  const effectVars = new Set<string>();
  const enterVars = new Set<string>();

  for (const choice of data.choices || []) {
    for (const condition of choice.conditions || []) {
      if (condition.variable) conditionVars.add(condition.variable);
    }

    for (const effect of choice.effects || []) {
      if (effect.variable) effectVars.add(effect.variable);
    }
  }

  for (const effect of data.enterEffects || []) {
    if (effect.variable) enterVars.add(effect.variable);
  }

  const indicators: NodeIndicator[] = [];

  for (const variable of [...conditionVars].slice(0, 2)) {
    indicators.push({
      type: "requires",
      label: `req: ${variable}`,
    });
  }

  for (const variable of [...effectVars].slice(0, 2)) {
    indicators.push({
      type: "effects",
      label: `sets: ${variable}`,
    });
  }

  for (const variable of [...enterVars].slice(0, 2)) {
    indicators.push({
      type: "enter",
      label: `enter: ${variable}`,
    });
  }

  return indicators.slice(0, 4);
}

function buildChoiceTitle(choice: StoryChoice): string {
  const parts: string[] = [];

  if (choice?.label) parts.push(choice.label);

  const conditionVars = (choice.conditions || [])
    .map((c) => c.variable)
    .filter(Boolean);

  const effectVars = (choice.effects || [])
    .map((e) => e.variable)
    .filter(Boolean);

  if (conditionVars.length) {
    parts.push(`requires: ${conditionVars.join(", ")}`);
  }

  if (effectVars.length) {
    parts.push(`effects: ${effectVars.join(", ")}`);
  }

  return parts.join(" • ");
}

/** graphIssues stays unknown[] on StoryNodeData; only severity is read here. */
function summarizeGraphIssues(
  issues: ReadonlyArray<{ severity?: string }> = []
): string[] {
  const hasError = issues.some((issue) => issue.severity === "error");
  const hasWarning = issues.some((issue) => issue.severity === "warning");
  const labels: string[] = [];

  if (hasError) labels.push("error");
  if (hasWarning) labels.push("warning");

  return labels;
}

export default function StoryNode({ id, data, selected }: StoryNodeProps) {
  const renderContext = { characters: data?.characters || [] };
  const title = renderStoryText(data?.title || "Untitled Block", renderContext);
  const content = renderStoryText(data?.content || "", renderContext);
  const blockType = data?.blockType || "narrative";
  const choices = data?.choices || [];
  const icon = BLOCK_TYPE_ICONS[blockType] || "◻";
  const indicators = collectIndicators(data);
  const graphIssueLabels = summarizeGraphIssues(
    (data?.graphIssues || []) as ReadonlyArray<{ severity?: string }>
  );
  const playState = data?.playState || "idle";

  // Outer handles are always just input (left) + continue (right). Choice and
  // specialized handles are rendered inline next to what they control, so the
  // node border never sprouts a variable number of anonymous dots.
  const handleModel = getNodeHandleModel(data);
  const choiceHandleById = new Map(
    handleModel.choiceHandles.map((handle) => [handle.choiceId, handle.id])
  );

  const headerClass = `node-card-header ${
    blockType === "chat"
      ? "chat"
      : blockType === "timed"
      ? "timed"
      : blockType === "ending"
      ? "ending"
      : ""
  }`;

  function handleAddChoice(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    data?.onAddChoice?.(id);
    data?.onSelectNode?.(id);
  }

  function handleChoiceClick(
    event: MouseEvent<HTMLButtonElement>,
    choice: StoryChoice
  ) {
    event.stopPropagation();

    if (choice?.targetNodeId) {
      data?.onSelectNode?.(choice.targetNodeId);
      if (data?.onCenterNode) {
        data.onCenterNode(choice.targetNodeId);
      }
    } else {
      data?.onSelectNode?.(id);
    }
  }

  return (
    <div
      className={[
        "node-card",
        selected ? "selected" : "",
        playState === "playing" ? "playing" : "",
        playState === "reachable" ? "reachable" : "",
        playState === "locked" ? "locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Handle
        id={INPUT_HANDLE_ID}
        type="target"
        position={Position.Left}
        className="story-handle"
        isConnectable={true}
      />

      <div className={headerClass}>
        {icon} {title}
      </div>

      <div className="node-card-body">
        <div className="node-card-content">
          {content.length > 90 ? `${content.slice(0, 90)}…` : content}
        </div>

        <div className="node-card-meta">
          <span>{blockType}</span>
          <span>
            {choices.length} choice{choices.length === 1 ? "" : "s"}
          </span>
        </div>

        {graphIssueLabels.length > 0 && (
          <div className="node-issue-strip">
            {graphIssueLabels.map((label) => (
              <span
                key={label}
                className={`node-issue-badge ${
                  label === "error" ? "node-issue-error" : "node-issue-warning"
                }`}
              >
                {label === "error" ? "✕ issue" : "⚠ issue"}
              </span>
            ))}
          </div>
        )}

        {indicators.length > 0 && (
          <div className="node-indicator-strip">
            {indicators.map((indicator, index) => (
              <span
                key={`${indicator.type}-${indicator.label}-${index}`}
                className={`node-indicator node-indicator-${indicator.type}`}
              >
                {indicator.label}
              </span>
            ))}
          </div>
        )}

        {choices.length > 0 && (
          <div className="node-choice-strip">
            {choices.map((choice, index) => {
              const choiceHandleId = choice.id
                ? choiceHandleById.get(choice.id)
                : undefined;

              return (
                <div
                  className="node-choice-item"
                  key={choice.id || `${choice.label || "choice"}-${index}`}
                >
                  <button
                    className="node-choice-chip"
                    onClick={(event) => handleChoiceClick(event, choice)}
                    title={buildChoiceTitle(choice)}
                    type="button"
                  >
                    {renderStoryText(
                      choice.label || "Untitled choice",
                      renderContext
                    )}
                  </button>

                  {choiceHandleId && (
                    <Handle
                      id={choiceHandleId}
                      type="source"
                      position={Position.Right}
                      className="story-handle story-handle--choice"
                      isConnectable={true}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {handleModel.specialHandles.length > 0 && (
          <div className="node-link-rows">
            {handleModel.specialHandles.map((handle) => (
              <div
                className={`node-link-item node-link-item--${handle.id}`}
                key={handle.id}
              >
                <span className="node-link-label">{handle.label}</span>
                <Handle
                  id={handle.id}
                  type="source"
                  position={Position.Right}
                  className={`story-handle story-handle--${handle.id}`}
                  isConnectable={true}
                />
              </div>
            ))}
          </div>
        )}

        <button
          className="node-add-choice-button"
          onClick={handleAddChoice}
          type="button"
        >
          + Choice
        </button>
      </div>

      {/* The single generic continuation output — one of the two outer dots. */}
      <Handle
        id={CONTINUE_HANDLE_ID}
        type="source"
        position={Position.Right}
        className="story-handle story-handle--continue"
        isConnectable={true}
      />
    </div>
  );
}
