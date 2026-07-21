import { Handle, Position, type NodeProps } from "reactflow";
import type { CSSProperties, MouseEvent } from "react";
import type { StoryChoice, StoryNodeData } from "../../types/story";
import type { StoryCharacter } from "../../types/storyCore";
import { renderStoryText } from "../../utils/storyReferences";
import {
  CONTINUE_HANDLE_ID,
  INPUT_HANDLE_ID,
  makeChoiceHandleId,
} from "../../utils/nodeGraphLinks";

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

  const isMiniGameBlock =
    blockType === "traitPicker" ||
    blockType === "persuasion" ||
    blockType === "choiceWeighting";
  const showChoiceHandles = blockType !== "persuasion";
  const showSuccessHandle =
    isMiniGameBlock || !!String(data?.successNodeId || "").trim();
  const showFailureHandle =
    isMiniGameBlock || !!String(data?.failureNodeId || "").trim();
  const showTimeoutHandle =
    blockType === "timed" || !!String(data?.timeoutTargetNodeId || "").trim();

  // Every source handle has an explicit, stable id so connection routing can
  // tell a generic transition drag apart from a specific choice/link drag.
  const sourceHandles: Array<{ id: string; className: string }> = [
    { id: CONTINUE_HANDLE_ID, className: "story-handle story-handle--continue" },
  ];
  if (showChoiceHandles) {
    choices.forEach((choice) => {
      if (!choice?.id) return;
      sourceHandles.push({
        id: makeChoiceHandleId(choice.id),
        className: "story-handle story-handle--choice",
      });
    });
  }
  if (showSuccessHandle) {
    sourceHandles.push({
      id: "success",
      className: "story-handle story-handle--success",
    });
  }
  if (showFailureHandle) {
    sourceHandles.push({
      id: "failure",
      className: "story-handle story-handle--failure",
    });
  }
  if (showTimeoutHandle) {
    sourceHandles.push({
      id: "timeout",
      className: "story-handle story-handle--timeout",
    });
  }

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
            {choices.slice(0, 3).map((choice, index) => (
              <button
                key={`${choice.label || "choice"}-${choice.targetNodeId || "none"}-${index}`}
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
            ))}

            {choices.length > 3 && (
              <span className="node-choice-more">
                +{choices.length - 3} more
              </span>
            )}
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

      {sourceHandles.map((handle, index) => {
        const style: CSSProperties = {
          top: `${((index + 1) / (sourceHandles.length + 1)) * 100}%`,
        };
        return (
          <Handle
            key={handle.id}
            id={handle.id}
            type="source"
            position={Position.Right}
            className={handle.className}
            style={style}
            isConnectable={true}
          />
        );
      })}
    </div>
  );
}
