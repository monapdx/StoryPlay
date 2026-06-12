import { useEffect, useRef, useState } from "react";

const ACTIONS = [
  { value: "set", label: "set" },
  { value: "add", label: "add" },
  { value: "subtract", label: "subtract" },
  { value: "toggle", label: "toggle" },
];

function getDefaultEffect(variables) {
  const firstVariable = Object.keys(variables || {})[0] || "";
  const firstValue = firstVariable ? variables[firstVariable] : "";

  return {
    variable: firstVariable,
    action: typeof firstValue === "boolean" ? "toggle" : "set",
    value: typeof firstValue === "number" ? 1 : firstValue,
  };
}

export default function ChoiceEffectsEditor({
  choice,
  variables = {},
  onUpdate,
}) {
  const variableKeys = Object.keys(variables || {});
  const effects = choice.effects || [];
  const previousEffectCountRef = useRef(effects.length);
  const [expandedEffectIndex, setExpandedEffectIndex] = useState(null);

  useEffect(() => {
    const previousCount = previousEffectCountRef.current;
    const currentCount = effects.length;

    if (currentCount > previousCount && currentCount > 0) {
      setExpandedEffectIndex(currentCount - 1);
    } else if (expandedEffectIndex !== null && expandedEffectIndex >= currentCount) {
      setExpandedEffectIndex(null);
    }

    previousEffectCountRef.current = currentCount;
  }, [effects, expandedEffectIndex]);

  function addEffect() {
    onUpdate("effects", [...effects, getDefaultEffect(variables)]);
  }

  function updateEffect(index, field, value) {
    const next = [...effects];
    const current = next[index] || {};

    next[index] = {
      ...current,
      [field]: value,
    };

    if (field === "variable") {
      const nextVariableValue = variables[value];
      if (typeof nextVariableValue === "boolean") {
        next[index].action = "toggle";
      } else if (next[index].action === "toggle") {
        next[index].action = "set";
      }

      if (typeof nextVariableValue === "number") {
        next[index].value = 1;
      } else if (typeof nextVariableValue === "boolean") {
        next[index].value = true;
      } else {
        next[index].value = "";
      }
    }

    if (field === "action") {
      const variableValue = variables[current.variable];
      if (value === "toggle") {
        next[index].value = true;
      } else if (typeof variableValue === "number" && current.value === true) {
        next[index].value = 1;
      }
    }

    onUpdate("effects", next);
  }

  function removeEffect(index) {
    const next = [...effects];
    next.splice(index, 1);
    onUpdate("effects", next);
  }

  function renderValueInput(effect, index) {
    const selectedVariable = effect.variable;
    const selectedValue = variables[selectedVariable];
    const selectedType = typeof selectedValue;
    const hidesValue = effect.action === "toggle";

    if (hidesValue) {
      return <p className="sidebar-hint">Toggle needs no value.</p>;
    }

    if (selectedType === "boolean") {
      return (
        <select
          className="form-select"
          value={String(effect.value)}
          onChange={(e) =>
            updateEffect(index, "value", e.target.value === "true")
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
        value={effect.value ?? ""}
        onChange={(e) =>
          updateEffect(
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
          Effects
        </h3>

        <button
          type="button"
          className="toolbar-button"
          onClick={addEffect}
          disabled={variableKeys.length === 0}
        >
          + Add Effect
        </button>
      </div>

      {variableKeys.length === 0 ? (
        <p className="sidebar-hint">Add a variable first.</p>
      ) : effects.length === 0 ? (
        <p className="sidebar-hint">No effects.</p>
      ) : (
        <div className="choice-list">
          {effects.map((effect, index) => {
            const variableType = typeof variables[effect.variable];
            const actionOptions =
              variableType === "boolean"
                ? ACTIONS.filter((action) =>
                    ["set", "toggle"].includes(action.value)
                  )
                : ACTIONS.filter((action) => action.value !== "toggle");

            const isExpanded = expandedEffectIndex === index;

            return (
              <div key={index} className={`choice-row ${isExpanded ? "is-expanded" : ""}`}>
                <button
                  type="button"
                  className="collapsible-row-header"
                  onClick={() => setExpandedEffectIndex(index)}
                  aria-expanded={isExpanded}
                >
                  <span>
                    <span className="collapsible-row-title">
                      {effect.variable || "Effect"}
                    </span>
                    <span className="collapsible-row-meta">
                      {effect.action || "set"}
                      {effect.action === "toggle"
                        ? ""
                        : ` ${String(effect.value ?? "")}`}
                    </span>
                  </span>
                  <span className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}>
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Variable</label>
                      <select
                        className="form-select"
                        value={effect.variable || ""}
                        onFocus={() => setExpandedEffectIndex(index)}
                        onChange={(e) =>
                          updateEffect(index, "variable", e.target.value)
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
                      <label className="form-label">Action</label>
                      <select
                        className="form-select"
                        value={effect.action || "set"}
                        onFocus={() => setExpandedEffectIndex(index)}
                        onChange={(e) =>
                          updateEffect(index, "action", e.target.value)
                        }
                      >
                        {actionOptions.map((action) => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Value</label>
                      {renderValueInput(effect, index)}
                    </div>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeEffect(index)}
                    >
                      Remove Effect
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