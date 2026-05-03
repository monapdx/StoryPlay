import ChoiceConditionsEditor from "./ChoiceConditionsEditor";
import ChoiceEffectsEditor from "./ChoiceEffectsEditor";

export default function ChoiceRow({
  choiceIndex,
  choice,
  allNodes,
  variables,
  currentNodeId,
  isExpanded,
  onExpand,
  onUpdate,
  onRemove,
}) {
  const availableTargets = allNodes.filter((node) => node.id !== currentNodeId);
  const targetLabel = availableTargets.find(
    (node) => node.id === choice.targetNodeId
  )?.data?.title;

  return (
    <div className={`choice-row ${isExpanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="collapsible-row-header"
        onClick={onExpand}
        aria-expanded={isExpanded}
      >
        <span>
          <span className="collapsible-row-title">
            {choice.label?.trim() || "Untitled choice"}
          </span>
          <span className="collapsible-row-meta">
            {targetLabel || choice.targetNodeId || "No target selected"}
          </span>
        </span>
        <span className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <>
          <div className="form-group">
            <label className="form-label">Choice Label</label>
            <input
              className="form-input"
              type="text"
              value={choice.label}
              onChange={(e) => onUpdate(choiceIndex, "label", e.target.value)}
              placeholder="Enter choice text"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Block</label>
            <select
              className="form-select"
              value={choice.targetNodeId || ""}
              onChange={(e) =>
                onUpdate(choiceIndex, "targetNodeId", e.target.value)
              }
            >
              <option value="">Select target block</option>
              {availableTargets.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data?.title || `Untitled (${node.id})`}
                </option>
              ))}
            </select>
          </div>

          <ChoiceConditionsEditor
            choice={choice}
            variables={variables}
            onUpdate={(field, value) => onUpdate(choiceIndex, field, value)}
          />

          <ChoiceEffectsEditor
            choice={choice}
            variables={variables}
            onUpdate={(field, value) => onUpdate(choiceIndex, field, value)}
          />

          <button
            type="button"
            className="danger-button"
            onClick={() => onRemove(choiceIndex)}
          >
            Remove Choice
          </button>
        </>
      )}
    </div>
  );
}