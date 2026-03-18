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
      <div>
        <h2 className="section-title">Block Editor</h2>

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

  const {
    title = "",
    content = "",
    blockType = "narrative",
    timerSeconds = 10,
    timeoutTargetNodeId = "",
  } = selectedNode.data || {};

  return (
    <div>
      <h2 className="section-title">Block Editor</h2>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
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
        <label className="form-label">
          {blockType === "chat" ? "Chat Content" : "Content"}
        </label>

        <textarea
          className="form-textarea"
          value={content}
          onChange={(e) => updateSelectedNodeField("content", e.target.value)}
          placeholder={
            blockType === "chat"
              ? "Example:\nA message appears on your screen.\nYou: Who is this?\nDon't open the door."
              : "Write the story text for this block..."
          }
        />
      </div>

      {blockType === "chat" && (
        <div className="helper-box">
          Chat blocks render each line as a message bubble.
          <br />
          Use <strong>You:</strong> at the start of a line for outgoing messages.
        </div>
      )}

      {blockType === "timed" && (
        <div className="editor-section">
          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Timer Settings
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Seconds</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={timerSeconds}
              onChange={(e) =>
                updateSelectedNodeField("timerSeconds", Number(e.target.value) || 1)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Timeout Target</label>
            <select
              className="form-select"
              value={timeoutTargetNodeId}
              onChange={(e) =>
                updateSelectedNodeField("timeoutTargetNodeId", e.target.value)
              }
            >
              <option value="">Select a block...</option>
              {nodes
                .filter((node) => node.id !== selectedNode.id)
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.title || node.id}
                  </option>
                ))}
            </select>
          </div>

          <div className="helper-box">
            When the timer hits zero, preview automatically jumps to the selected
            timeout block.
          </div>
        </div>
      )}

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