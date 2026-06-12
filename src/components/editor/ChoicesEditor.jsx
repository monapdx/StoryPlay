import { useEffect, useRef, useState } from "react";
import ChoiceRow from "./ChoiceRow";

export default function ChoicesEditor({
  selectedNode,
  nodes,
  variables,
  characters = [],
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  const choices = selectedNode?.data?.choices || [];
  const blockType = selectedNode?.data?.blockType || "narrative";
  const isChatBlock = blockType === "chat";
  const previousChoiceCountRef = useRef(choices.length);
  const [expandedChoiceIndex, setExpandedChoiceIndex] = useState(null);

  useEffect(() => {
    const previousChoiceCount = previousChoiceCountRef.current;
    const currentChoiceCount = choices.length;

    if (currentChoiceCount > previousChoiceCount && currentChoiceCount > 0) {
      setExpandedChoiceIndex(currentChoiceCount - 1);
    }

    previousChoiceCountRef.current = currentChoiceCount;
  }, [choices]);

  useEffect(() => {
    if (expandedChoiceIndex === null) return;
    if (expandedChoiceIndex >= choices.length) {
      setExpandedChoiceIndex(null);
    }
  }, [choices, expandedChoiceIndex]);

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">Choices</h3>
        <button className="toolbar-button" onClick={addChoiceToSelectedNode}>
          + Add Choice
        </button>
      </div>

      {isChatBlock && (
        <div className="helper-box" style={{ marginBottom: 12 }}>
          <strong>Chat reply</strong> choices appear as player messages inside the
          thread. <strong>Go to block</strong> choices leave the chat and jump to
          another scene.
        </div>
      )}

      {choices.length === 0 ? (
        <div className="helper-box">No choices yet for this block.</div>
      ) : (
        <div className="choice-list">
          {choices.map((choice, index) => (
            <ChoiceRow
              key={`${selectedNode.id}-choice-${index}`}
              choiceIndex={index}
              choice={choice}
              blockType={blockType}
              allNodes={nodes}
              variables={variables}
              characters={characters}
              currentNodeId={selectedNode.id}
              isExpanded={expandedChoiceIndex === index}
              onExpand={() => setExpandedChoiceIndex(index)}
              onUpdate={updateChoiceOnSelectedNode}
              onRemove={removeChoiceFromSelectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}