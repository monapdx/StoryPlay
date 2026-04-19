export default function MiniGameEditorHeader({
  title,
  mode,
  onBack,
  onSave,
  onSetMode,
}) {
  return (
    <div style={{ padding: 12, borderBottom: "1px solid #333" }}>
      <button onClick={onBack}>Back</button>
      <strong style={{ marginLeft: 10 }}>{title}</strong>

      <button onClick={() => onSetMode("edit")}>Edit</button>
      <button onClick={() => onSetMode("play")}>Play</button>

      <button onClick={onSave} style={{ float: "right" }}>
        Save
      </button>
    </div>
  );
}