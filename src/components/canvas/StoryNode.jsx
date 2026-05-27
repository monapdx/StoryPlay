import { Handle, Position } from "reactflow";
import { renderStoryText } from "../../utils/storyReferences";

const BLOCK_TYPE_ICONS = {
  narrative: "◻",
  chat: "💬",
  timed: "⏱",
  ending: "🏁",
};

function collectIndicators(data = {}) {
  const conditionVars = new Set();
  const effectVars = new Set();
  const enterVars = new Set();

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

  const indicators = [];

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

function buildChoiceTitle(choice) {
  const parts = [];

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

function summarizeGraphIssues(issues = []) {
  const hasError = issues.some((issue) => issue.severity === "error");
  const hasWarning = issues.some((issue) => issue.severity === "warning");
  const labels = [];

  if (hasError) labels.push("error");
  if (hasWarning) labels.push("warning");

  return labels;
}

export default function StoryNode({ id, data, selected }) {
  const renderContext = { characters: data?.characters || [] };
  const title = renderStoryText(data?.title || "Untitled Block", renderContext);
  const content = renderStoryText(data?.content || "", renderContext);
  const blockType = data?.blockType || "narrative";
  const choices = data?.choices || [];
  const icon = BLOCK_TYPE_ICONS[blockType] || "◻";
  const indicators = collectIndicators(data);
  const graphIssueLabels = summarizeGraphIssues(data?.graphIssues || []);
  const playState = data?.playState || "idle";

  const headerClass = `node-card-header ${
    blockType === "chat"
      ? "chat"
      : blockType === "timed"
      ? "timed"
      : blockType === "ending"
      ? "ending"
      : ""
  }`;

  function handleAddChoice(event) {
    event.stopPropagation();
    data?.onAddChoice?.(id);
    data?.onSelectNode?.(id);
  }

  function handleChoiceClick(event, choice) {
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
                {renderStoryText(choice.label || "Untitled choice", renderContext)}
              </button>
            ))}

            {choices.length > 3 && (
              <span className="node-choice-more">+{choices.length - 3} more</span>
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

      <Handle
        type="source"
        position={Position.Right}
        className="story-handle"
        isConnectable={true}
      />
    </div>
  );
}