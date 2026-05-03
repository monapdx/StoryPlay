import { useEffect, useState } from "react";

function detectType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function coerceValue(type, rawValue) {
  if (type === "boolean") return rawValue === "true" || rawValue === true;

  if (type === "number") {
    const n = Number(rawValue);
    return Number.isNaN(n) ? 0 : n;
  }

  return rawValue;
}

export default function VariableEditor({ variables = {}, setVariables }) {
  const entries = Object.entries(variables || {});
  const [expandedVariableKey, setExpandedVariableKey] = useState(null);

  useEffect(() => {
    if (!expandedVariableKey) return;
    if (!(expandedVariableKey in (variables || {}))) {
      setExpandedVariableKey(null);
    }
  }, [variables, expandedVariableKey]);

  function addVariable() {
    let name = "variable";
    let i = 1;

    while (variables[name + i] !== undefined) i++;

    const newKey = name + i;

    setVariables({
      ...variables,
      [newKey]: ""
    });
    setExpandedVariableKey(newKey);
  }

  function removeVariable(key) {
    const next = { ...variables };
    delete next[key];
    setVariables(next);
  }

  function renameVariable(oldKey, newKey) {
    const trimmed = newKey.trim();

    if (!trimmed || trimmed === oldKey) return;
    if (variables[trimmed] !== undefined) return;

    const next = {};

    for (const [k, v] of Object.entries(variables)) {
      if (k === oldKey) next[trimmed] = v;
      else next[k] = v;
    }

    setVariables(next);

    if (expandedVariableKey === oldKey) {
      setExpandedVariableKey(trimmed);
    }
  }

  function updateVariableValue(key, value) {
    setVariables({
      ...variables,
      [key]: value
    });
  }

  function changeVariableType(key, type) {
    const value = variables[key];

    let newValue = "";

    if (type === "boolean") newValue = Boolean(value);
    else if (type === "number") newValue = Number(value) || 0;
    else newValue = value?.toString() ?? "";

    setVariables({
      ...variables,
      [key]: newValue
    });
  }

  return (
    <div className="editor-section">

      <div className="editor-section-header">
        <h3>Variables</h3>

        <button
          className="toolbar-button"
          onClick={addVariable}
        >
          + Add Variable
        </button>
      </div>

      {entries.length === 0 && (
        <div className="helper-box">
          No variables yet.  
          Try creating <b>health</b>, <b>gold</b>, or <b>hasKey</b>.
        </div>
      )}

      <div className="choice-list">

        {entries.map(([key, value]) => {

          const type = detectType(value);
          const isExpanded = expandedVariableKey === key;

          return (
            <div key={key} className={`choice-row ${isExpanded ? "is-expanded" : ""}`}>
              <button
                type="button"
                className="collapsible-row-header"
                onClick={() => setExpandedVariableKey(key)}
                aria-expanded={isExpanded}
              >
                <span>
                  <span className="collapsible-row-title">{key}</span>
                  <span className="collapsible-row-meta">
                    {type}: {String(value)}
                  </span>
                </span>
                <span className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}>
                  ▾
                </span>
              </button>

              {isExpanded && (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>

                    <input
                      className="form-input"
                      defaultValue={key}
                      onFocus={() => setExpandedVariableKey(key)}
                      onBlur={(e) => renameVariable(key, e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type</label>

                    <select
                      className="form-select"
                      value={type}
                      onFocus={() => setExpandedVariableKey(key)}
                      onChange={(e) => changeVariableType(key, e.target.value)}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Value</label>

                    {type === "boolean" ? (
                      <select
                        className="form-select"
                        value={String(value)}
                        onFocus={() => setExpandedVariableKey(key)}
                        onChange={(e) =>
                          updateVariableValue(
                            key,
                            coerceValue("boolean", e.target.value)
                          )
                        }
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        type={type === "number" ? "number" : "text"}
                        value={value}
                        onFocus={() => setExpandedVariableKey(key)}
                        onChange={(e) =>
                          updateVariableValue(
                            key,
                            coerceValue(type, e.target.value)
                          )
                        }
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => removeVariable(key)}
                  >
                    Delete Variable
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}