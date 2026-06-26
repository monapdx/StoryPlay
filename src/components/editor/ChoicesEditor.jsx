import { useEffect, useMemo, useState } from "react";
import ChoiceRow from "./ChoiceRow";
import {
  ONBOARDING_DEMO_CHOICES,
  isOnboardingChoiceStep,
} from "../../data/onboardingDemo";

export default function ChoicesEditor({
  selectedNode,
  nodes,
  variables,
  characters = [],
  onboardingStepId = null,
  isOnboardingDemoPreview = false,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
}) {
  const blockType = selectedNode?.data?.blockType || "narrative";
  const selectedNodeId = selectedNode?.id;
  const storyChoices = selectedNode?.data?.choices || [];
  const showOnboardingChoiceDemo = isOnboardingChoiceStep(onboardingStepId);
  const visibleChoices = useMemo(() => {
    if (showOnboardingChoiceDemo && storyChoices.length === 0) {
      return ONBOARDING_DEMO_CHOICES;
    }
    return storyChoices;
  }, [showOnboardingChoiceDemo, storyChoices]);
  const readOnly = isOnboardingDemoPreview;

  const [expandedChoiceIndex, setExpandedChoiceIndex] = useState(null);
  const showChoiceReveal = onboardingStepId === "choices";
  const highlightChoiceChevron = onboardingStepId === "choice-expand";

  useEffect(() => {
    setExpandedChoiceIndex(null);
  }, [selectedNodeId, blockType, onboardingStepId]);

  useEffect(() => {
    if (!highlightChoiceChevron) return;

    setExpandedChoiceIndex(null);

    const frameId = window.requestAnimationFrame(() => {
      const row = document.querySelector('[data-onboarding="choice-expand-demo"]');
      row?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [highlightChoiceChevron, visibleChoices.length]);

  useEffect(() => {
    if (expandedChoiceIndex !== null && expandedChoiceIndex >= visibleChoices.length) {
      setExpandedChoiceIndex(null);
    }
  }, [visibleChoices.length, expandedChoiceIndex]);

  function handleChoiceExpand(index) {
    setExpandedChoiceIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">Choices</h3>
        {!readOnly && (
          <button className="toolbar-button" onClick={addChoiceToSelectedNode}>
            + Add Choice
          </button>
        )}
      </div>

      {visibleChoices.length === 0 ? (
        <p className="sidebar-hint">No choices yet.</p>
      ) : (
        <div className="choice-list">
          {visibleChoices.map((choice, index) => (
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
              readOnly={readOnly}
              onExpand={() => handleChoiceExpand(index)}
              onUpdate={readOnly ? undefined : updateChoiceOnSelectedNode}
              onRemove={readOnly ? undefined : removeChoiceFromSelectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
