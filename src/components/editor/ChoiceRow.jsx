export default function ChoiceRow({
  choice,
  allNodes,
  currentNodeId,
  onUpdate,
  onRemove,
}) {
  const availableTargets = allNodes.filter((node) => node.id !== currentNodeId);

  return (
    <div className="choice-row">
      <div className="form-group">
        <label className="form-label">Choice Label</label>
        <input
          className="form-input"
          type="text"
          value={choice.label}
          onChange={(e) => onUpdate(choice.id, "label", e.target.value)}
          placeholder="Enter choice text"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Target Block</label>
        <select
          className="form-select"
          value={choice.targetNodeId || ""}
          onChange={(e) => onUpdate(choice.id, "targetNodeId", e.target.value)}
        >
          <option value="">Select target block</option>
          {availableTargets.map((node) => (
            <option key={node.id} value={node.id}>
              {node.data?.title || `Untitled (${node.id})`}
            </option>
          ))}
        </select>
      </div>

      <button className="danger-button" onClick={() => onRemove(choice.id)}>
        Remove Choice
      </button>
    </div>
  );
}