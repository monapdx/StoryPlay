import React from "react";

export default function MiniGameEditorInspector({
  game,
  onChange,
  onConfigChange,
}) {
  function updateVariables(raw) {
    try {
      const parsed = JSON.parse(raw);
      onChange?.({ variables: parsed });
    } catch {
      // intentionally ignore invalid JSON while typing
    }
  }

  function updateConditions(raw) {
    try {
      const parsed = JSON.parse(raw);
      onChange?.({ conditions: Array.isArray(parsed) ? parsed : [] });
    } catch {
      // intentionally ignore invalid JSON while typing
    }
  }

  function updateEffects(raw) {
    try {
      const parsed = JSON.parse(raw);
      onChange?.({ effects: Array.isArray(parsed) ? parsed : [] });
    } catch {
      // intentionally ignore invalid JSON while typing
    }
  }

  function updateConfigRaw(raw) {
    try {
      const parsed = JSON.parse(raw);
      onConfigChange?.(parsed);
    } catch {
      // intentionally ignore invalid JSON while typing
    }
  }

  return (
    <aside style={styles.panel}>
      <Section
        title="Variables"
        description="Story-facing values this mini-game reads or writes."
      >
        <textarea
          defaultValue={JSON.stringify(game.variables || {}, null, 2)}
          onChange={(e) => updateVariables(e.target.value)}
          style={styles.codeArea}
          rows={8}
        />
      </Section>

      <Section
        title="Conditions"
        description="Optional rules for gating success, failure, or availability."
      >
        <textarea
          defaultValue={JSON.stringify(game.conditions || [], null, 2)}
          onChange={(e) => updateConditions(e.target.value)}
          style={styles.codeArea}
          rows={8}
        />
      </Section>

      <Section
        title="Effects"
        description="What should happen in the story when the mini-game resolves."
      >
        <textarea
          defaultValue={JSON.stringify(game.effects || [], null, 2)}
          onChange={(e) => updateEffects(e.target.value)}
          style={styles.codeArea}
          rows={8}
        />
      </Section>

      <Section
        title="Raw Config"
        description="Use this to pass the exact block shape needed by the playable component."
      >
        <textarea
          defaultValue={JSON.stringify(game.config || {}, null, 2)}
          onChange={(e) => updateConfigRaw(e.target.value)}
          style={styles.codeArea}
          rows={10}
        />
      </Section>
    </aside>
  );
}

function Section({ title, description, children }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <p style={styles.sectionDescription}>{description}</p>
      {children}
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
    marginBottom: "18px",
    paddingBottom: "18px",
    borderBottom: "1px solid #1f2937",
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "14px",
    color: "#f8fafc",
  },
  sectionDescription: {
    margin: "0 0 10px",
    fontSize: "12px",
    lineHeight: 1.45,
    color: "#94a3b8",
  },
  codeArea: {
    width: "100%",
    resize: "vertical",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#020617",
    color: "#dbeafe",
    padding: "12px",
    fontSize: "13px",
    lineHeight: 1.45,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
};