import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { Condition, ConditionOperator, StoryVariables } from "../../types/storyCore";

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "==" },
  { value: "notEquals", label: "!=" },
  { value: "greaterThan", label: ">" },
  { value: "lessThan", label: "<" },
  { value: "greaterThanOrEqual", label: ">=" },
  { value: "lessThanOrEqual", label: "<=" },
];

/** Choice fields this editor reads/writes — not a full StoryChoice. */
export interface ChoiceConditionsSource {
  conditions?: Condition[] | null;
}

export interface ChoiceConditionsEditorProps {
  choice: ChoiceConditionsSource;
  variables?: StoryVariables;
  onUpdate: (field: "conditions" | string, value: Condition[]) => void;
}

function getDefaultCondition(variables: StoryVariables): Condition {
  const firstVariable = Object.keys(variables || {})[0] || "";

  return {
    variable: firstVariable,
    operator: "equals",
    value: firstVariable ? variables[firstVariable] : "",
  };
}

export default function ChoiceConditionsEditor({
  choice,
  variables = {},
  onUpdate,
}: ChoiceConditionsEditorProps) {
  const variableKeys = Object.keys(variables || {});
  const conditions = choice.conditions || [];
  const previousConditionCountRef = useRef(conditions.length);
  const [expandedConditionIndex, setExpandedConditionIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    const previousCount = previousConditionCountRef.current;
    const currentCount = conditions.length;

    if (currentCount > previousCount && currentCount > 0) {
      setExpandedConditionIndex(currentCount - 1);
    } else if (
      expandedConditionIndex !== null &&
      expandedConditionIndex >= currentCount
    ) {
      setExpandedConditionIndex(null);
    }

    previousConditionCountRef.current = currentCount;
  }, [conditions, expandedConditionIndex]);

  function addCondition() {
    onUpdate("conditions", [...conditions, getDefaultCondition(variables)]);
  }

  function updateCondition(
    index: number,
    field: keyof Condition | string,
    value: unknown
  ) {
    const next = [...conditions];
    const current = next[index] || {};

    next[index] = {
      ...current,
      [field]: value,
    } as Condition;

    if (field === "variable") {
      const nextVariableValue = variables[value as string];
      if (nextVariableValue !== undefined) {
        next[index].value = nextVariableValue;
      }
    }

    onUpdate("conditions", next);
  }

  function removeCondition(index: number) {
    const next = [...conditions];
    next.splice(index, 1);
    onUpdate("conditions", next);
  }

  function renderValueInput(condition: Condition, index: number) {
    const selectedVariable = condition.variable;
    const selectedValue = variables[selectedVariable];
    const selectedType = typeof selectedValue;

    if (selectedType === "boolean") {
      return (
        <select
          className="form-select"
          value={String(condition.value)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            updateCondition(index, "value", e.target.value === "true")
          }
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    return (
      <input
        className="form-input"
        type={selectedType === "number" ? "number" : "text"}
        value={(condition.value ?? "") as string | number}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateCondition(
            index,
            "value",
            selectedType === "number" ? Number(e.target.value) : e.target.value
          )
        }
      />
    );
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Conditions
        </h3>

        <button
          type="button"
          className="toolbar-button"
          onClick={addCondition}
          disabled={variableKeys.length === 0}
        >
          + Add Condition
        </button>
      </div>

      {variableKeys.length === 0 ? (
        <p className="sidebar-hint">Add a variable first.</p>
      ) : conditions.length === 0 ? (
        <p className="sidebar-hint">No conditions.</p>
      ) : (
        <div className="choice-list">
          {conditions.map((condition, index) => {
            const isExpanded = expandedConditionIndex === index;
            const operatorLabel =
              OPERATORS.find((operator) => operator.value === condition.operator)
                ?.label || "==";

            return (
              <div
                key={index}
                className={`choice-row ${isExpanded ? "is-expanded" : ""}`}
              >
                <button
                  type="button"
                  className="collapsible-row-header"
                  onClick={() => setExpandedConditionIndex(index)}
                  aria-expanded={isExpanded}
                >
                  <span>
                    <span className="collapsible-row-title">
                      {condition.variable || "Condition"}
                    </span>
                    <span className="collapsible-row-meta">
                      {operatorLabel} {String(condition.value ?? "")}
                    </span>
                  </span>
                  <span
                    className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Variable</label>
                      <select
                        className="form-select"
                        value={condition.variable || ""}
                        onFocus={() => setExpandedConditionIndex(index)}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateCondition(index, "variable", e.target.value)
                        }
                      >
                        {variableKeys.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Operator</label>
                      <select
                        className="form-select"
                        value={condition.operator || "equals"}
                        onFocus={() => setExpandedConditionIndex(index)}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateCondition(index, "operator", e.target.value)
                        }
                      >
                        {OPERATORS.map((operator) => (
                          <option key={operator.value} value={operator.value}>
                            {operator.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Value</label>
                      {renderValueInput(condition, index)}
                    </div>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeCondition(index)}
                    >
                      Remove Condition
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
