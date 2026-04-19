import React from "react";
import TraitPickerBlockView from "../blocks/TraitPickerBlockView";
import PersuasionBlockView from "../blocks/PersuasionBlockView";
import ChoiceWeightingBlockView from "../blocks/ChoiceWeightingBlockView";

export default function MiniGameEditorPreview({
  game,
  mode = "edit",
  onComplete,
}) {
  const block = buildPreviewBlock(game);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Preview</div>
          <h3 style={styles.title}>
            {mode === "play" ? "Playable Preview" : "Visual Preview"}
          </h3>
        </div>

        <div style={styles.badge}>{game.type || "traitPicker"}</div>
      </div>

      <div style={styles.previewArea}>
        {renderBlock(game.type, block, onComplete)}
      </div>
    </section>
  );
}

function renderBlock(type, block, onComplete) {
  switch (type) {
    case "persuasion":
      return (
        <PersuasionBlockView
          block={block}
          onComplete={(result) => onComplete?.(result)}
        />
      );

    case "choiceWeighting":
      return (
        <ChoiceWeightingBlockView
          block={block}
          onComplete={(result) => onComplete?.(result)}
        />
      );

    case "traitPicker":
    default:
      return (
        <TraitPickerBlockView
          block={block}
          onComplete={(result) => onComplete?.(result)}
        />
      );
  }
}

function buildPreviewBlock(game) {
  const base = {
    id: game.id || "preview-minigame",
    type: game.type || "traitPicker",
    title: game.title || "Untitled Mini-Game",
    description: game.description || "",
    ...(game.config || {}),
  };

  if (game.config?.block && typeof game.config.block === "object") {
    return {
      ...base,
      ...game.config.block,
      title: game.title || game.config.block.title || "Untitled Mini-Game",
      description:
        game.description ||
        game.config.block.description ||
        game.config.block.prompt ||
        "",
    };
  }

  return base;
}

const styles = {
  panel: {
    minWidth: 0,
    minHeight: 0,
    background: "#0f172a",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
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
    fontSize: "18px",
    color: "#f8fafc",
  },
  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1d4ed8",
    color: "#eff6ff",
    fontSize: "12px",
    fontWeight: 700,
  },
  previewArea: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "18px",
  },
};