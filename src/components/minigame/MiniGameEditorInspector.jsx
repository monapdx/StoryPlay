export default function MiniGameEditorInspector({ game, onConfigChange }) {
  return (
    <div style={{ padding: 12 }}>
      <h3>Raw Config</h3>

      <textarea
        defaultValue={JSON.stringify(game.config, null, 2)}
        onChange={(e) => {
          try {
            onConfigChange(JSON.parse(e.target.value));
          } catch {}
        }}
        style={{ width: "100%", height: 200 }}
      />
    </div>
  );
}