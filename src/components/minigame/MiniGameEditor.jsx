import { useEffect, useState } from "react";
import MiniGameEditorHeader from "./MiniGameEditorHeader";
import MiniGameEditorSidebar from "./MiniGameEditorSidebar";
import MiniGameEditorPreview from "./MiniGameEditorPreview";
import MiniGameEditorInspector from "./MiniGameEditorInspector";

export default function MiniGameEditor({ open, game, onClose, onSave }) {
  const [draft, setDraft] = useState(game || { type: "traitPicker", config: {} });
  const [mode, setMode] = useState("edit");

  useEffect(() => {
    setDraft(game || { type: "traitPicker", config: {} });
  }, [game]);

  if (!open) return null;

  function handleSave() {
    onSave?.(draft);
  }

  function updateConfig(patch) {
    setDraft((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        ...patch,
      },
    }));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a" }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <MiniGameEditorHeader
          title={draft.type}
          mode={mode}
          onBack={onClose}
          onSave={handleSave}
          onSetMode={setMode}
        />

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "250px 1fr 300px" }}>
          <MiniGameEditorSidebar game={draft} onConfigChange={updateConfig} />
          <MiniGameEditorPreview game={draft} mode={mode} />
          <MiniGameEditorInspector game={draft} onConfigChange={updateConfig} />
        </div>
      </div>
    </div>
  );
}