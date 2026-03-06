import ChoiceRow from "./ChoiceRow";

export default function ChoicesEditor({
  selectedNode,
  nodes,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  const choices = selectedNode?.data?.choices || [];

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">Choices</h3>
        <button className="toolbar-button" onClick={addChoiceToSelectedNode}>
          + Add Choice
        </button>
      </div>

      {choices.length === 0 ? (
        <div className="helper-box">No choices yet for this block.</div>
      ) : (
        <div className="choice-list">
          {choices.map((choice) => (
            <ChoiceRow
              key={choice.id}
              choice={choice}
              allNodes={nodes}
              currentNodeId={selectedNode.id}
              onUpdate={updateChoiceOnSelectedNode}
              onRemove={removeChoiceFromSelectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}