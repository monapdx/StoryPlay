function detectType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function coerceValue(type, rawValue) {
  if (type === "boolean") {
    return rawValue === "true" || rawValue === true;
  }

  if (type === "number") {
    const n = Number(rawValue);
    return Number.isNaN(n) ? 0 : n;
  }

  return rawValue;
}

export default function VariableEditor({ variables = {}, setVariables }) {
  const entries = Object.entries(variables);

  function addVariable() {
    let baseName = "newVariable";
    let nextName = baseName;
    let count = 1;

    while (Object.prototype.hasOwnProperty.call(variables, nextName)) {
      count += 1;
      nextName = `${baseName}${count}`;
    }

    setVariables({
      ...variables,
      [nextName]: "",
    });
  }

  function removeVariable(key) {
    const next = { ...variables };
    delete next[key];
    setVariables(next);
  }

  function renameVariable(oldKey, newKey) {
    const trimmed = newKey.trim();

    if (!trimmed || trimmed === oldKey) return;
    if (Object.prototype.hasOwnProperty.call(variables, trimmed)) return;

    const next = {};
    for (const [key, value] of Object.entries(variables)) {
      if (key === oldKey) {
        next[trimmed] = value;
      } else {
        next[key] = value;
      }
    }

    setVariables(next);
  }

  function updateVariableValue(key, value) {
    setVariables({
      ...variables,
      [key]: value,
    });
  }

  function changeVariableType(key, nextType) {
    const currentValue = variables[key];
    let nextValue = "";

    if (nextType === "boolean") {
      nextValue = Boolean(currentValue);
    } else if (nextType === "number") {
      nextValue = Number(currentValue);
      if (Number.isNaN(nextValue)) nextValue = 0;
    } else {
      nextValue =
        currentValue === null || currentValue === undefined
          ? ""
          : String(currentValue);
    }

    setVariables({
      ...variables,
      [key]: nextValue,
    });
  }

  return (
    <div className="sidebar-section">
      <div className="section-header">
        <h3>Variables</h3>
        <button className="secondary-button" onClick={addVariable}>
          + Add Variable
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="helper-box">
          No variables yet. Add things like <strong>health</strong>,{" "}
          <strong>gold</strong>, or <strong>hasKey</strong>.
        </div>
      ) : (
        <div className="variable-list">
          {entries.map(([key, value]) => {
            const type = detectType(value);

            return (
              <div key={key} className="choice-card variable-card">
                <div className="variable-row">
                  <label className="field-label">Name</label>
                  <input
                    className="text-input"
                    defaultValue={key}
                    onBlur={(e) => renameVariable(key, e.target.value)}
                    placeholder="Variable name"
                  />
                </div>

                <div className="variable-row">
                  <label className="field-label">Type</label>
                  <select
                    className="select-input"
                    value={type}
                    onChange={(e) => changeVariableType(key, e.target.value)}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                </div>

                <div className="variable-row">
                  <label className="field-label">Value</label>

                  {type === "boolean" ? (
                    <select
                      className="select-input"
                      value={String(value)}
                      onChange={(e) =>
                        updateVariableValue(key, coerceValue("boolean", e.target.value))
                      }
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      className="text-input"
                      type={type === "number" ? "number" : "text"}
                      value={value}
                      onChange={(e) =>
                        updateVariableValue(
                          key,
                          coerceValue(type, e.target.value)
                        )
                      }
                    />
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    className="danger-button"
                    onClick={() => removeVariable(key)}
                  >
                    Delete Variable
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}