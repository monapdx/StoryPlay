export default function MiniGameEditorSidebar({ game, onConfigChange }) {
  return (
    <div style={{ padding: 12 }}>
      <h3>Config</h3>

      <label>
        Attempts
        <input
          type="number"
          value={game.config?.attempts || 1}
          onChange={(e) =>
            onConfigChange({ attempts: Number(e.target.value) })
          }
        />
      </label>
    </div>
  );
}