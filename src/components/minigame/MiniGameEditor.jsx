import React, { useEffect, useMemo, useState } from "react";
import MiniGameEditorHeader from "./MiniGameEditorHeader";
import MiniGameEditorSidebar from "./MiniGameEditorSidebar";
import MiniGameEditorPreview from "./MiniGameEditorPreview";
import MiniGameEditorInspector from "./MiniGameEditorInspector";

const DEFAULT_GAME = {
  id: "",
  title: "Untitled Mini-Game",
  type: "traitPicker",
  description: "",
  config: {},
  variables: {},
  conditions: [],
  effects: [],
};

export default function MiniGameEditor({
  open = false,
  game = null,
  onClose,
  onSave,
}) {
  const initialGame = useMemo(() => {
    return {
      ...DEFAULT_GAME,
      ...(game || {}),
      config: {
        ...DEFAULT_GAME.config,
        ...(game?.config || {}),
      },
      variables: {
        ...DEFAULT_GAME.variables,
        ...(game?.variables || {}),
      },
      conditions: Array.isArray(game?.conditions) ? game.conditions : [],
      effects: Array.isArray(game?.effects) ? game.effects : [],
    };
  }, [game]);

  const [draft, setDraft] = useState(initialGame);
  const [mode, setMode] = useState("edit");
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    setDraft(initialGame);
    setLastResult(null);
    setMode("edit");
  }, [initialGame]);

  if (!open) return null;

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateConfig(patch) {
    setDraft((prev) => ({
      ...prev,
      config: {
        ...(prev.config || {}),
        ...patch,
      },
    }));
  }

  function handleSave() {
    onSave?.(draft);
  }

  function handlePreviewComplete(result) {
    setLastResult(result);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.shell}>
        <MiniGameEditorHeader
          title={draft.title}
          mode={mode}
          onBack={onClose}
          onSave={handleSave}
          onSetMode={setMode}
        />

        <div style={styles.body}>
          <MiniGameEditorSidebar
            game={draft}
            onChange={updateDraft}
            onConfigChange={updateConfig}
          />

          <div style={styles.centerColumn}>
            <MiniGameEditorPreview
              game={draft}
              mode={mode}
              onComplete={handlePreviewComplete}
            />

            <div style={styles.resultPanel}>
              <div style={styles.resultHeader}>Last play result</div>
              <pre style={styles.resultPre}>
                {lastResult
                  ? JSON.stringify(lastResult, null, 2)
                  : "Play the mini-game to see output here."}
              </pre>
            </div>
          </div>

          <MiniGameEditorInspector
            game={draft}
            onChange={updateDraft}
            onConfigChange={updateConfig}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 12, 18, 0.72)",
    backdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
  },
  shell: {
    width: "100%",
    height: "100%",
    background: "#111827",
    color: "#f9fafb",
    display: "flex",
    flexDirection: "column",
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "280px 1fr 340px",
    gap: "16px",
    padding: "16px",
  },
  centerColumn: {
    minWidth: 0,
    display: "grid",
    gridTemplateRows: "1fr 220px",
    gap: "16px",
  },
  resultPanel: {
    background: "#0f172a",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "12px",
    minHeight: 0,
    overflow: "hidden",
  },
  resultHeader: {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#93c5fd",
    marginBottom: "8px",
  },
  resultPre: {
    margin: 0,
    height: "calc(100% - 24px)",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "13px",
    lineHeight: 1.45,
    color: "#dbeafe",
  },
};