import ChoiceConditionsEditor from "./ChoiceConditionsEditor";
import ChoiceEffectsEditor from "./ChoiceEffectsEditor";

export default function ChoiceRow({
  choice,
  allNodes,
  variables,
  currentNodeId,
  onUpdate,
  onRemove,
}) {
  const availableTargets = allNodes.filter((node) => node.id !== currentNodeId);
  const choiceId = choice?.id;

  function handleChoiceFieldUpdate(field, value) {
    onUpdate(choiceId, field, value);
  }

  return (
    <div className="choice-row">
      <div className="form-group">
        <label className="form-label">Label</label>
        <input
          className="form-input"
          type="text"
          value={choice?.label || ""}
          onChange={(event) =>
            handleChoiceFieldUpdate("label", event.target.value)
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">Target</label>
        <select
          className="form-select"
          value={choice?.targetNodeId || ""}
          onChange={(event) =>
            handleChoiceFieldUpdate("targetNodeId", event.target.value)
          }
        >
          <option value="">Select target block</option>
          {availableTargets.map((node) => (
            <option key={node.id} value={node.id}>
              {node?.data?.title || node.id}
            </option>
          ))}
        </select>
      </div>

      <ChoiceConditionsEditor
        choice={choice}
        variables={variables}
        onUpdate={(field, value) => handleChoiceFieldUpdate(field, value)}
      />

      <ChoiceEffectsEditor
        choice={choice}
        variables={variables}
        onUpdate={(field, value) => handleChoiceFieldUpdate(field, value)}
      />

      <button
        type="button"
        className="danger-button"
        onClick={() => onRemove(choiceId)}
      >
        Remove Choice
      </button>
    </div>
  );
}