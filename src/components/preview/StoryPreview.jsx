import { useMemo } from "react";
import PlayChoiceButton from "./PlayChoiceButton";
import { evaluateConditions } from "../../utils/storyLogic";

export default function StoryPreview({
  nodes,
  selectedNode,
  selectedNodeId,
  currentPlayNode,
  history,
  playVariables,
  startFromNode,
  resetToSelected,
  goToNode,
  goBack,
}) {
  const nodesById = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  const playNodeData = currentPlayNode?.data || null;
  const playChoices = playNodeData?.choices || [];

  const visibleChoices = playChoices.filter((choice) =>
    evaluateConditions(choice.conditions || [], playVariables || {})
  );

  return (
    <div className="preview-story">
      <div className="preview-header-row">
        <h2 className="section-title">Play Preview</h2>

        <div className="preview-toolbar">
          <button
            className="toolbar-button"
            onClick={() => startFromNode(selectedNodeId)}
            disabled={!selectedNodeId}
          >
            Start From Selected
          </button>

          <button
            className="toolbar-button"
            onClick={goBack}
            disabled={!history?.length}
          >
            Back
          </button>

          <button
            className="toolbar-button"
            onClick={resetToSelected}
            disabled={!selectedNodeId}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="helper-box">
        <strong>Variables</strong>
        <div style={{ marginTop: 8 }}>
          {Object.keys(playVariables || {}).length === 0 ? (
            <div className="muted">No variables defined.</div>
          ) : (
            Object.entries(playVariables).map(([key, value]) => (
              <div key={key}>
                {key}: {String(value)}
              </div>
            ))
          )}
        </div>
      </div>

      {!currentPlayNode ? (
        <p className="muted">No story block available to play.</p>
      ) : (
        <div className="preview-block">
          <h3 className="preview-title">
            {playNodeData?.title || "Untitled Block"}
          </h3>

          <div className="preview-content">
            {playNodeData?.content || "No content yet."}
          </div>

          <div className="helper-box" style={{ marginTop: 14 }}>
            <strong>Block type:</strong> {playNodeData?.blockType || "narrative"}
          </div>

          <div className="preview-choice-list">
            {visibleChoices.length === 0 ? (
              <div className="preview-choice">No available choices.</div>
            ) : (
              visibleChoices.map((choice) => (
                <PlayChoiceButton
                  key={choice.id}
                  choice={choice}
                  targetNode={nodesById[choice.targetNodeId]}
                  onChoose={() =>
                    goToNode(choice.targetNodeId, choice.effects || [])
                  }
                />
              ))
            )}
          </div>
        </div>
      )}

      <div className="helper-box">
        <strong>Editing:</strong>{" "}
        {selectedNode?.data?.title || "No block selected"}
        <br />
        <strong>Playing:</strong>{" "}
        {currentPlayNode?.data?.title || "Nothing"}
        <br />
        <strong>History:</strong> {history?.length || 0} step
        {(history?.length || 0) === 1 ? "" : "s"}
      </div>
    </div>
  );
}