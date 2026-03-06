export default function ChoiceConditionsEditor({
  choice,
  variables,
  onUpdate,
}) {
  function addCondition() {
    const next = [
      ...(choice.conditions || []),
      {
        variable: Object.keys(variables)[0] || "",
        operator: "equals",
        value: true,
      },
    ];

    onUpdate("conditions", next);
  }

  function updateCondition(index, field, value) {
    const next = [...(choice.conditions || [])];
    next[index] = { ...next[index], [field]: value };
    onUpdate("conditions", next);
  }

  function removeCondition(index) {
    const next = [...(choice.conditions || [])];
    next.splice(index, 1);
    onUpdate("conditions", next);
  }

  return (
    <div className="choice-section">
      <div className="choice-section-title">Conditions</div>

      {(choice.conditions || []).map((cond, i) => (
        <div key={i} className="condition-row">
          <select
            value={cond.variable}
            onChange={(e) =>
              updateCondition(i, "variable", e.target.value)
            }
          >
            {Object.keys(variables).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>

          <select
            value={cond.operator}
            onChange={(e) =>
              updateCondition(i, "operator", e.target.value)
            }
          >
            <option value="equals">==</option>
            <option value="notEquals">!=</option>
            <option value="greaterThan">{">"}</option>
            <option value="lessThan">{"<"}</option>
            <option value="greaterThanOrEqual">{">="}</option>
            <option value="lessThanOrEqual">{"<="}</option>
          </select>

          <input
            value={cond.value}
            onChange={(e) =>
              updateCondition(i, "value", e.target.value)
            }
          />

          <button onClick={() => removeCondition(i)}>✕</button>
        </div>
      ))}

      <button onClick={addCondition}>+ Add Condition</button>
    </div>
  );
}