import React from "react";

const GAME_TYPES = [
  { value: "traitPicker", label: "Trait Picker" },
  { value: "persuasion", label: "Persuasion" },
  { value: "choiceWeighting", label: "Choice Weighting" },
];

export default function MiniGameEditorSidebar({
  game,
  onChange,
  onConfigChange,
}) {
  function updateField(key, value) {
    onChange?.({ [key]: value });
  }

  function updateNumberConfig(key, value) {
    const parsed = Number(value);
    onConfigChange?.({
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    });
  }

  return (
    <aside style={styles.panel}>
      <Section title="Basics">
        <label style={styles.label}>
          Title
          <input
            type="text"
            value={game.title || ""}
            onChange={(e) => updateField("title", e.target.value)}
            style={styles.input}
            placeholder="Mini-game title"
          />
        </label>

        <label style={styles.label}>
          Type
          <select
            value={game.type || "traitPicker"}
            onChange={(e) => updateField("type", e.target.value)}
            style={styles.input}
          >
            {GAME_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Description
          <textarea
            value={game.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            style={styles.textarea}
            rows={4}
            placeholder="Optional author-facing notes"
          />
        </label>
      </Section>

      <Section title="Quick Config">
        <label style={styles.label}>
          Attempts
          <input
            type="number"
            value={game.config?.attempts ?? 1}
            onChange={(e) => updateNumberConfig("attempts", e.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Time Limit (seconds)
          <input
            type="number"
            value={game.config?.timeLimit ?? 0}
            onChange={(e) => updateNumberConfig("timeLimit", e.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={Boolean(game.config?.showInstructions)}
            onChange={(e) =>
              onConfigChange?.({ showInstructions: e.target.checked })
            }
          />
          <span>Show instructions</span>
        </label>
      </Section>

      <Section title="Summary">
        <div style={styles.summaryBox}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Type</span>
            <span style={styles.summaryValue}>{game.type || "traitPicker"}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Variables</span>
            <span style={styles.summaryValue}>
              {Object.keys(game.variables || {}).length}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Conditions</span>
            <span style={styles.summaryValue}>
              {(game.conditions || []).length}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Effects</span>
            <span style={styles.summaryValue}>
              {(game.effects || []).length}
            </span>
          </div>
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

const styles = {
  panel: {
    minWidth: 0,
    background: "#0f172a",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "14px",
    overflow: "auto",
  },
  section: {
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #1f2937",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "14px",
    color: "#f8fafc",
  },
  sectionBody: {
    display: "grid",
    gap: "10px",
  },
  label: {
    display: "grid",
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#cbd5e1",
  },
  input: {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#f8fafc",
    padding: "10px 12px",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#f8fafc",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#e2e8f0",
  },
  summaryBox: {
    display: "grid",
    gap: "8px",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "12px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: "13px",
  },
  summaryValue: {
    color: "#f8fafc",
    fontWeight: 700,
    fontSize: "13px",
  },
};