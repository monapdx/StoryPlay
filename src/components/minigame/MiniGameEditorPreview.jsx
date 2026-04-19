export default function MiniGameEditorPreview({ game }) {
  return (
    <div style={{ padding: 20 }}>
      <h3>Preview</h3>
      <pre>{JSON.stringify(game, null, 2)}</pre>
    </div>
  );
}