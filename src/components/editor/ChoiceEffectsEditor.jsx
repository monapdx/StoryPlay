export default function ChoiceEffectsEditor({
  choice,
  variables,
  onUpdate,
}) {
  function addEffect() {
    const next = [
      ...(choice.effects || []),
      {
        variable: Object.keys(variables)[0] || "",
        action: "set",
        value: 1,
      },
    ];

    onUpdate("effects", next);
  }

  function updateEffect(index, field, value) {
    const next = [...(choice.effects || [])];
    next[index] = { ...next[index], [field]: value };
    onUpdate("effects", next);
  }

  function removeEffect(index) {
    const next = [...(choice.effects || [])];
    next.splice(index, 1);
    onUpdate("effects", next);
  }

  return (
    <div className="choice-section">
      <div className="choice-section-title">Effects</div>

      {(choice.effects || []).map((effect, i) => (
        <div key={i} className="condition-row">
          <select
            value={effect.variable}
            onChange={(e) =>
              updateEffect(i, "variable", e.target.value)
            }
          >
            {Object.keys(variables).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>

          <select
            value={effect.action}
            onChange={(e) =>
              updateEffect(i, "action", e.target.value)
            }
          >
            <option value="set">set</option>
            <option value="add">add</option>
            <option value="subtract">subtract</option>
            <option value="toggle">toggle</option>
          </select>

          <input
            value={effect.value}
            onChange={(e) =>
              updateEffect(i, "value", e.target.value)
            }
          />

          <button onClick={() => removeEffect(i)}>✕</button>
        </div>
      ))}

      <button onClick={addEffect}>+ Add Effect</button>
    </div>
  );
}