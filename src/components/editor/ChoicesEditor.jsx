import { useEffect, useState } from "react";
import ChoiceRow from "./ChoiceRow";

export default function ChoicesEditor({
  selectedNode,
  nodes,
  variables,
  characters = [],
  onboardingStepId = null,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  const choices = selectedNode?.data?.choices || [];
  const blockType = selectedNode?.data?.blockType || "narrative";
  const selectedNodeId = selectedNode?.id;
  const [expandedChoiceIndex, setExpandedChoiceIndex] = useState(null);
  const showChoiceReveal = onboardingStepId === "choices";
  const highlightChoiceChevron = onboardingStepId === "choice-expand";

  useEffect(() => {
    setExpandedChoiceIndex(null);
  }, [selectedNodeId, blockType]);

  useEffect(() => {
    if (highlightChoiceChevron) {
      setExpandedChoiceIndex(null);
    }
  }, [highlightChoiceChevron]);

  useEffect(() => {
    if (expandedChoiceIndex !== null && expandedChoiceIndex >= choices.length) {
      setExpandedChoiceIndex(null);
    }
  }, [choices.length, expandedChoiceIndex]);

  function handleChoiceExpand(index) {
    setExpandedChoiceIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">Choices</h3>
        <button className="toolbar-button" onClick={addChoiceToSelectedNode}>
          + Add Choice
        </button>
      </div>

      {choices.length === 0 ? (
        <p className="sidebar-hint">No choices yet.</p>
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
              highlightChevron={highlightChoiceChevron && index === 0}
              revealOnboarding={showChoiceReveal}
              revealDelayMs={index * 180}
              onExpand={() => handleChoiceExpand(index)}
              onUpdate={updateChoiceOnSelectedNode}
              onRemove={removeChoiceFromSelectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}