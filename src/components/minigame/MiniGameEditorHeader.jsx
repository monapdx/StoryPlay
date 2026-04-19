import React from "react";

export default function MiniGameEditorHeader({
  title,
  mode,
  onBack,
  onSave,
  onSetMode,
}) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <button type="button" style={styles.secondaryButton} onClick={onBack}>
          ← Back
        </button>

        <div>
          <div style={styles.kicker}>Mini-Game Editor</div>
          <h2 style={styles.title}>{title || "Untitled Mini-Game"}</h2>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.modeGroup}>
          <button
            type="button"
            onClick={() => onSetMode?.("edit")}
            style={{
              ...styles.modeButton,
              ...(mode === "edit" ? styles.modeButtonActive : null),
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onSetMode?.("play")}
            style={{
              ...styles.modeButton,
              ...(mode === "play" ? styles.modeButtonActive : null),
            }}
          >
            ▶ Play
          </button>
        </div>

        <button type="button" style={styles.primaryButton} onClick={onSave}>
          Save
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    background: "#0b1220",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minWidth: 0,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  kicker: {
    fontSize: "12px",
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: "4px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    lineHeight: 1.1,
    color: "#f8fafc",
  },
  modeGroup: {
    display: "inline-flex",
    background: "#111827",
    border: "1px solid #263244",
    borderRadius: "12px",
    padding: "4px",
    gap: "4px",
  },
  modeButton: {
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  modeButtonActive: {
    background: "#2563eb",
    color: "#ffffff",
  },
  primaryButton: {
    border: "none",
    background: "#22c55e",
    color: "#06260f",
    fontWeight: 700,
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #334155",
    background: "#111827",
    color: "#e2e8f0",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
};