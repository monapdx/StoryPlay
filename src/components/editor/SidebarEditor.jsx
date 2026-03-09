import ChoicesEditor from "./ChoicesEditor";
import StoryDiagnostics from "./StoryDiagnostics";
import VariableEditor from "./VariableEditor";

export default function SidebarEditor({
  nodes,
  variables,
  setVariables,
  selectedNode,
  updateSelectedNodeField,
  deleteSelectedNode,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  if (!selectedNode) {
    return (
      <div className="sidebar">
        <h2>Block Editor</h2>

        <div className="helper-box">
          Select a story block on the canvas.
          <br />
          <br />
          Tip: click + Add Block to create a new story node, drag from one node
          handle to another to create a choice link, or use the search bar to
          jump to a block.
        </div>

        <VariableEditor variables={variables} setVariables={setVariables} />

        <StoryDiagnostics nodes={nodes} variables={variables} />
      </div>
    );
  }

  const { title = "", content = "", blockType = "narrative" } =
    selectedNode.data || {};

  return (
    <div className="sidebar">
      <h2>Block Editor</h2>

      <label className="field-label">Title</label>
      <input
        className="text-input"
        value={title}
        onChange={(e) => updateSelectedNodeField("title", e.target.value)}
        placeholder="Enter block title"
      />

      <label className="field-label">Block Type</label>
      <select
        className="select-input"
        value={blockType}
        onChange={(e) => updateSelectedNodeField("blockType", e.target.value)}
      >
        <option value="narrative">Narrative</option>
        <option value="chat">Chat</option>
        <option value="timed">Timed</option>
        <option value="ending">Ending</option>
      </select>

      <label className="field-label">Content</label>
      <textarea
        className="textarea-input"
        value={content}
        onChange={(e) => updateSelectedNodeField("content", e.target.value)}
        placeholder="Write the story text for this block..."
      />

      <ChoicesEditor
        selectedNode={selectedNode}
        nodes={nodes}
        variables={variables}
        addChoiceToSelectedNode={addChoiceToSelectedNode}
        updateChoiceOnSelectedNode={updateChoiceOnSelectedNode}
        removeChoiceFromSelectedNode={removeChoiceFromSelectedNode}
      />

      <VariableEditor variables={variables} setVariables={setVariables} />

      <div className="helper-box">
        <strong>Selected node ID:</strong> {selectedNode.id}
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="danger-button" onClick={deleteSelectedNode}>
          Delete Block
        </button>
      </div>

      <StoryDiagnostics nodes={nodes} variables={variables} />
    </div>
  );
}