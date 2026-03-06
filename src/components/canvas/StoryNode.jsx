import { Handle, Position } from "reactflow";

const BLOCK_TYPE_ICONS = {
  narrative: "📖",
  chat: "💬",
  timed: "⏱",
  ending: "🏁",
};

export default function StoryNode({ id, data, selected }) {
  const title = data?.title || "Untitled Block";
  const content = data?.content || "";
  const blockType = data?.blockType || "narrative";
  const choices = data?.choices || [];
  const icon = BLOCK_TYPE_ICONS[blockType] || "📄";

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
    <div className={`node-card ${selected ? "selected" : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="story-handle"
      />

      <div className={headerClass}>
        <span style={{ marginRight: 8 }}>{icon}</span>
        <span>{title}</span>
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

        <div className="node-choice-strip">
          {choices.slice(0, 3).map((choice) => (
            <button
              key={choice.id}
              className="node-choice-chip"
              onClick={(event) => handleChoiceClick(event, choice)}
              title={choice.label || "Choice"}
            >
              {choice.label || "Untitled choice"}
            </button>
          ))}

          {choices.length > 3 && (
            <div className="node-choice-more">+{choices.length - 3} more</div>
          )}
        </div>

        <button className="node-add-choice-button" onClick={handleAddChoice}>
          + Choice
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="story-handle"
      />
    </div>
  );
}