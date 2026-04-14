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

  const data = selectedNode.data || {};

  const {
    title = "",
    content = "",
    blockType = "narrative",
    timerSeconds = 10,
    timeoutTargetNodeId = "",

    // shared mini-game fields
    options = [],

    // trait picker
    minSelections = 0,
    maxSelections = 2,
    traitListVariable = "",

    // persuasion
    targetName = "",
    startScore = 50,
    minScore = 0,
    maxScore = 100,
    threshold = 75,
    maxTurns = 3,
    visibleMeter = true,
    scoreVariable = "",
    successVariable = "",
    successNodeId = "",
    failureNodeId = "",

    // choice weighting
    totalPoints = 10,
    variablePrefix = "",
    resultVariable = "",
    lockExactTotal = true,

    // persuasion choices reuse the existing "choices" field
    choices = [],
  } = data;

  function updateArrayItem(field, index, key, value) {
    const arr = [...(data[field] || [])];
    arr[index] = { ...arr[index], [key]: value };
    updateSelectedNodeField(field, arr);
  }

  function addArrayItem(field, item) {
    const arr = [...(data[field] || []), item];
    updateSelectedNodeField(field, arr);
  }

  function removeArrayItem(field, index) {
    const arr = [...(data[field] || [])];
    arr.splice(index, 1);
    updateSelectedNodeField(field, arr);
  }

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
          <option value="traitPicker">Trait Picker</option>
          <option value="persuasion">Persuasion</option>
          <option value="choiceWeighting">Choice Weighting</option>
          <option value="ending">Ending</option>
        </select>
      </div>

      {(blockType === "narrative" ||
        blockType === "chat" ||
        blockType === "ending") && (
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
      )}

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

      {blockType === "traitPicker" && (
        <div className="editor-section">
          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Trait Picker Settings
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Prompt</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => updateSelectedNodeField("content", e.target.value)}
              placeholder="Select two traits that define your approach."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Selections</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={minSelections}
              onChange={(e) =>
                updateSelectedNodeField("minSelections", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Selections</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={maxSelections}
              onChange={(e) =>
                updateSelectedNodeField("maxSelections", Number(e.target.value) || 1)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trait List Variable</label>
            <input
              className="form-input"
              value={traitListVariable}
              onChange={(e) =>
                updateSelectedNodeField("traitListVariable", e.target.value)
              }
              placeholder="player_traits"
            />
          </div>

          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Traits
            </h3>
          </div>

          {options.length === 0 ? (
            <div className="helper-box">No traits yet. Add one below.</div>
          ) : (
            options.map((option, index) => (
              <div key={index} className="helper-box" style={{ marginBottom: 10 }}>
                <div className="form-group">
                  <label className="form-label">Trait Label</label>
                  <input
                    className="form-input"
                    value={option.label || ""}
                    onChange={(e) =>
                      updateArrayItem("options", index, "label", e.target.value)
                    }
                    placeholder="Charming"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trait ID</label>
                  <input
                    className="form-input"
                    value={option.id || ""}
                    onChange={(e) =>
                      updateArrayItem("options", index, "id", e.target.value)
                    }
                    placeholder="charming"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    value={option.description || ""}
                    onChange={(e) =>
                      updateArrayItem("options", index, "description", e.target.value)
                    }
                    placeholder="Better at persuasion and first impressions."
                  />
                </div>

                <button
                  className="danger-button"
                  type="button"
                  onClick={() => removeArrayItem("options", index)}
                >
                  Remove Trait
                </button>
              </div>
            ))
          )}

          <button
            className="toolbar-button"
            type="button"
            onClick={() =>
              addArrayItem("options", {
                id: `trait_${Date.now()}`,
                label: "",
                description: "",
              })
            }
          >
            Add Trait
          </button>
        </div>
      )}

      {blockType === "persuasion" && (
        <div className="editor-section">
          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Persuasion Settings
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Prompt</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => updateSelectedNodeField("content", e.target.value)}
              placeholder="You need the guard to let you through the gate."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Name</label>
            <input
              className="form-input"
              value={targetName}
              onChange={(e) => updateSelectedNodeField("targetName", e.target.value)}
              placeholder="Guard"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Score</label>
            <input
              className="form-input"
              type="number"
              value={startScore}
              onChange={(e) =>
                updateSelectedNodeField("startScore", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Score</label>
            <input
              className="form-input"
              type="number"
              value={minScore}
              onChange={(e) =>
                updateSelectedNodeField("minScore", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Score</label>
            <input
              className="form-input"
              type="number"
              value={maxScore}
              onChange={(e) =>
                updateSelectedNodeField("maxScore", Number(e.target.value) || 100)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Threshold</label>
            <input
              className="form-input"
              type="number"
              value={threshold}
              onChange={(e) =>
                updateSelectedNodeField("threshold", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Turns</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={maxTurns}
              onChange={(e) =>
                updateSelectedNodeField("maxTurns", Number(e.target.value) || 1)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Show Meter</label>
            <select
              className="form-select"
              value={visibleMeter ? "true" : "false"}
              onChange={(e) =>
                updateSelectedNodeField("visibleMeter", e.target.value === "true")
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Score Variable</label>
            <input
              className="form-input"
              value={scoreVariable}
              onChange={(e) =>
                updateSelectedNodeField("scoreVariable", e.target.value)
              }
              placeholder="guard_persuasion_score"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Success Variable</label>
            <input
              className="form-input"
              value={successVariable}
              onChange={(e) =>
                updateSelectedNodeField("successVariable", e.target.value)
              }
              placeholder="guard_convinced"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Success Target Node</label>
            <select
              className="form-select"
              value={successNodeId}
              onChange={(e) =>
                updateSelectedNodeField("successNodeId", e.target.value)
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

          <div className="form-group">
            <label className="form-label">Failure Target Node</label>
            <select
              className="form-select"
              value={failureNodeId}
              onChange={(e) =>
                updateSelectedNodeField("failureNodeId", e.target.value)
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

          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Persuasion Choices
            </h3>
          </div>

          {choices.length === 0 ? (
            <div className="helper-box">No persuasion choices yet.</div>
          ) : (
            choices.map((choice, index) => (
              <div key={index} className="helper-box" style={{ marginBottom: 10 }}>
                <div className="form-group">
                  <label className="form-label">Choice Text</label>
                  <input
                    className="form-input"
                    value={choice.text || ""}
                    onChange={(e) =>
                      updateArrayItem("choices", index, "text", e.target.value)
                    }
                    placeholder="Appeal to duty"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Choice ID</label>
                  <input
                    className="form-input"
                    value={choice.id || ""}
                    onChange={(e) =>
                      updateArrayItem("choices", index, "id", e.target.value)
                    }
                    placeholder="duty"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delta</label>
                  <input
                    className="form-input"
                    type="number"
                    value={choice.delta ?? 0}
                    onChange={(e) =>
                      updateArrayItem(
                        "choices",
                        index,
                        "delta",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Response</label>
                  <input
                    className="form-input"
                    value={choice.response || ""}
                    onChange={(e) =>
                      updateArrayItem("choices", index, "response", e.target.value)
                    }
                    placeholder="The guard seems to consider your point."
                  />
                </div>

                <button
                  className="danger-button"
                  type="button"
                  onClick={() => removeArrayItem("choices", index)}
                >
                  Remove Choice
                </button>
              </div>
            ))
          )}

          <button
            className="toolbar-button"
            type="button"
            onClick={() =>
              addArrayItem("choices", {
                id: `choice_${Date.now()}`,
                text: "",
                delta: 0,
                response: "",
              })
            }
          >
            Add Persuasion Choice
          </button>
        </div>
      )}

      {blockType === "choiceWeighting" && (
        <div className="editor-section">
          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Choice Weighting Settings
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Prompt</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => updateSelectedNodeField("content", e.target.value)}
              placeholder="Distribute your limited preparation points."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Points</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={totalPoints}
              onChange={(e) =>
                updateSelectedNodeField("totalPoints", Number(e.target.value) || 1)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variable Prefix</label>
            <input
              className="form-input"
              value={variablePrefix}
              onChange={(e) =>
                updateSelectedNodeField("variablePrefix", e.target.value)
              }
              placeholder="prep_"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Result Variable</label>
            <input
              className="form-input"
              value={resultVariable}
              onChange={(e) =>
                updateSelectedNodeField("resultVariable", e.target.value)
              }
              placeholder="journey_prep_allocation"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Require Exact Total</label>
            <select
              className="form-select"
              value={lockExactTotal ? "true" : "false"}
              onChange={(e) =>
                updateSelectedNodeField("lockExactTotal", e.target.value === "true")
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Weighting Options
            </h3>
          </div>

          {options.length === 0 ? (
            <div className="helper-box">No weighting options yet.</div>
          ) : (
            options.map((option, index) => (
              <div key={index} className="helper-box" style={{ marginBottom: 10 }}>
                <div className="form-group">
                  <label className="form-label">Option Label</label>
                  <input
                    className="form-input"
                    value={option.label || ""}
                    onChange={(e) =>
                      updateArrayItem("options", index, "label", e.target.value)
                    }
                    placeholder="Food"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Option ID</label>
                  <input
                    className="form-input"
                    value={option.id || ""}
                    onChange={(e) =>
                      updateArrayItem("options", index, "id", e.target.value)
                    }
                    placeholder="food"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum</label>
                  <input
                    className="form-input"
                    type="number"
                    value={option.min ?? 0}
                    onChange={(e) =>
                      updateArrayItem(
                        "options",
                        index,
                        "min",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum</label>
                  <input
                    className="form-input"
                    type="number"
                    value={option.max ?? totalPoints}
                    onChange={(e) =>
                      updateArrayItem(
                        "options",
                        index,
                        "max",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <button
                  className="danger-button"
                  type="button"
                  onClick={() => removeArrayItem("options", index)}
                >
                  Remove Option
                </button>
              </div>
            ))
          )}

          <button
            className="toolbar-button"
            type="button"
            onClick={() =>
              addArrayItem("options", {
                id: `option_${Date.now()}`,
                label: "",
                min: 0,
                max: totalPoints,
              })
            }
          >
            Add Weighting Option
          </button>
        </div>
      )}

      {!["traitPicker", "persuasion", "choiceWeighting"].includes(blockType) && (
        <ChoicesEditor
          selectedNode={selectedNode}
          nodes={nodes}
          variables={variables}
          addChoiceToSelectedNode={addChoiceToSelectedNode}
          updateChoiceOnSelectedNode={updateChoiceOnSelectedNode}
          removeChoiceFromSelectedNode={removeChoiceFromSelectedNode}
        />
      )}

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