import ChoicesEditor from "./ChoicesEditor";
import StoryDiagnostics from "./StoryDiagnostics";

export default function SidebarEditor({
  nodes,
  variables,
  selectedNode,
  updateSelectedNodeField,
  deleteSelectedNode,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  if (!selectedNode) {
    return (
      <div>
        <h2 className="section-title">Block Editor</h2>
        <p className="muted">Select a story block on the canvas.</p>

        <div className="helper-box">
          Tip: click <span className="kbd">+ Add Block</span> to create a new
          story node, drag from one node handle to another to create a choice
          link, or use the search bar to jump to a block.
        </div>

        <StoryDiagnostics nodes={nodes} variables={variables} />
      </div>
    );
  }

  const { title = "", content = "", blockType = "narrative" } =
    selectedNode.data || {};

  return (
    <div>
      <h2 className="section-title">Block Editor</h2>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => updateSelectedNodeField("title", e.target.value)}
          placeholder="Enter block title"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Block Type</label>
        <select
          className="form-select"
          value={blockType}
          onChange={(e) => updateSelectedNodeField("blockType", e.target.value)}
        >
          <option value="narrative">Narrative</option>
          <option value="chat">Chat</option>
          <option value="timed">Timed</option>
          <option value="ending">Ending</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Content</label>
        <textarea
          className="form-textarea"
          value={content}
          onChange={(e) => updateSelectedNodeField("content", e.target.value)}
          placeholder="Write the story text for this block..."
        />
      </div>

      <ChoicesEditor
        selectedNode={selectedNode}
        nodes={nodes}
        variables={variables}
        addChoiceToSelectedNode={addChoiceToSelectedNode}
        updateChoiceOnSelectedNode={updateChoiceOnSelectedNode}
        removeChoiceFromSelectedNode={removeChoiceFromSelectedNode}
      />

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