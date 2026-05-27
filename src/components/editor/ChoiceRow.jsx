import ChoiceConditionsEditor from "./ChoiceConditionsEditor";
import ChoiceEffectsEditor from "./ChoiceEffectsEditor";
import ReferenceTextarea from "./ReferenceTextarea";
import { renderStoryText } from "../../utils/storyReferences";

export default function ChoiceRow({
  choiceIndex,
  choice,
  allNodes,
  variables,
  characters = [],
  currentNodeId,
  isExpanded,
  onExpand,
  onUpdate,
  onRemove,
}) {
  const storyState = { characters };
  const displayLabel =
    renderStoryText(choice.label, storyState)?.trim() || "Untitled choice";
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
          <span className="collapsible-row-title">{displayLabel}</span>
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
            <ReferenceTextarea
              className="form-textarea choice-row__label-field"
              value={choice.label || ""}
              characters={characters}
              onChange={(nextValue) => onUpdate(choiceIndex, "label", nextValue)}
              placeholder="Enter choice text"
              insertLabel="Insert character"
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