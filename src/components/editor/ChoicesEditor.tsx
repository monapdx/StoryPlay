import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import ChoiceRow, {
  type ChoiceRowRemoveHandler,
  type ChoiceRowSource,
  type ChoiceRowUpdateHandler,
} from "./ChoiceRow";
import {
  ONBOARDING_DEMO_CHOICES,
  isOnboardingChoiceStep,
} from "../../data/onboardingDemo";
import {
  CHOICE_PATH_MAX,
  CHOICE_PATH_MIN,
} from "../../utils/choicePathGenerator";
import type { StoryChoice, StoryNode } from "../../types/story";
import type { StoryCharacter, StoryVariables } from "../../types/storyCore";
import type {
  ChoicePathToolResult,
  UseStoryStateResult,
} from "../../hooks/useStoryState";

/**
 * Node shape ChoicesEditor reads — StoryNode or onboarding demo scaffold.
 * Choices may be incomplete legacy/demo rows (ChoiceRowSource), not only StoryChoice.
 */
export interface ChoicesEditorNodeSource {
  id: string;
  data?: {
    blockType?: string;
    choices?: readonly ChoiceRowSource[] | ChoiceRowSource[] | StoryChoice[] | null;
  } | null;
}

export type ChoicesEditorPathStatus = string | null;

export type ChoicesEditorPathToolResult = ChoicePathToolResult;

export interface ChoicesEditorSharedProps {
  selectedNode: ChoicesEditorNodeSource;
  nodes: StoryNode[];
  variables: StoryVariables;
  characters?: StoryCharacter[];
  onboardingStepId?: string | null;
  addMultipleChoicesToSelectedNode?: UseStoryStateResult["addMultipleChoicesToSelectedNode"];
  generateDestinationNodesForSelectedNode?: UseStoryStateResult["generateDestinationNodesForSelectedNode"];
  generateChoicePathsForSelectedNode?: UseStoryStateResult["generateChoicePathsForSelectedNode"];
  addChoiceToSelectedNode: UseStoryStateResult["addChoiceToSelectedNode"];
  updateChoiceOnSelectedNode: ChoiceRowUpdateHandler;
  removeChoiceFromSelectedNode: ChoiceRowRemoveHandler;
}

/** Onboarding demo preview — mutation UI hidden; path tools off via readOnly. */
export interface ChoicesEditorReadOnlyProps extends ChoicesEditorSharedProps {
  isOnboardingDemoPreview: true;
}

/** Normal editing — mutation handlers required (Sidebar always supplies them). */
export interface ChoicesEditorEditableProps extends ChoicesEditorSharedProps {
  isOnboardingDemoPreview?: false;
}

export type ChoicesEditorProps =
  | ChoicesEditorReadOnlyProps
  | ChoicesEditorEditableProps;

export default function ChoicesEditor(props: ChoicesEditorProps) {
  const {
    selectedNode,
    nodes,
    variables,
    characters = [],
    onboardingStepId = null,
    isOnboardingDemoPreview = false,
    addChoiceToSelectedNode,
    addMultipleChoicesToSelectedNode,
    generateDestinationNodesForSelectedNode,
    generateChoicePathsForSelectedNode,
    updateChoiceOnSelectedNode,
    removeChoiceFromSelectedNode,
  } = props;

  const blockType = selectedNode?.data?.blockType || "narrative";
  const isChatBlock = blockType === "chat";
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
  const showPathTools =
    !readOnly &&
    blockType === "narrative" &&
    typeof addMultipleChoicesToSelectedNode === "function";

  const [expandedChoiceIndex, setExpandedChoiceIndex] = useState<number | null>(
    null
  );
  const [choiceCountInput, setChoiceCountInput] = useState("3");
  const [pathStatus, setPathStatus] = useState<ChoicesEditorPathStatus>(null);
  const showChoiceReveal = onboardingStepId === "choices";
  const highlightChoiceChevron = onboardingStepId === "choice-expand";

  useEffect(() => {
    setExpandedChoiceIndex(null);
    setPathStatus(null);
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

  function handleChoiceExpand(index: number) {
    setExpandedChoiceIndex((current) => (current === index ? null : index));
  }

  function handleAddMultipleChoices() {
    if (!addMultipleChoicesToSelectedNode) return;
    const result = addMultipleChoicesToSelectedNode(choiceCountInput);
    setPathStatus(result?.message || null);
  }

  function handleGenerateDestinations() {
    if (!generateDestinationNodesForSelectedNode) return;
    const result = generateDestinationNodesForSelectedNode();
    setPathStatus(result?.message || null);
  }

  function handleGenerateChoicePaths() {
    if (!generateChoicePathsForSelectedNode) return;
    const result = generateChoicePathsForSelectedNode(choiceCountInput);
    setPathStatus(result?.message || null);
  }

  const hasChoices = storyChoices.length > 0;
  const countInputId = `choice-path-count-${selectedNodeId || "none"}`;

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">{isChatBlock ? "Chat Replies" : "Choices"}</h3>
        {!readOnly && (
          <button
            type="button"
            className="toolbar-button"
            onClick={addChoiceToSelectedNode}
          >
            {isChatBlock ? "+ Add Reply" : "+ Add Choice"}
          </button>
        )}
      </div>

      {showPathTools && (
        <div className="choice-path-generator" aria-label="Choice path generator">
          <div className="choice-path-generator__row">
            <label className="form-label" htmlFor={countInputId}>
              Number of choices
            </label>
            <input
              id={countInputId}
              className="form-input choice-path-generator__count"
              type="number"
              inputMode="numeric"
              min={CHOICE_PATH_MIN}
              max={CHOICE_PATH_MAX}
              step={1}
              value={choiceCountInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setChoiceCountInput(event.target.value);
                setPathStatus(null);
              }}
              title={`Whole number from ${CHOICE_PATH_MIN} to ${CHOICE_PATH_MAX}`}
            />
            <button
              type="button"
              className="toolbar-button"
              onClick={handleAddMultipleChoices}
              title={`Add ${CHOICE_PATH_MIN}–${CHOICE_PATH_MAX} new choices without destinations`}
            >
              Add choices
            </button>
          </div>

          <div className="choice-path-generator__actions">
            <button
              type="button"
              className="toolbar-button"
              onClick={handleGenerateDestinations}
              disabled={!hasChoices}
              title={
                hasChoices
                  ? "Create a destination block for each choice that has no target"
                  : "Add at least one choice first"
              }
            >
              Generate destination nodes
            </button>
            <button
              type="button"
              className="toolbar-button"
              onClick={handleGenerateChoicePaths}
              title="Add the requested choices and create a destination for each new choice"
            >
              Generate choice paths
            </button>
          </div>

          {pathStatus ? (
            <p className="sidebar-hint choice-path-generator__status" role="status">
              {pathStatus}
            </p>
          ) : (
            <p className="form-hint">
              Add multiple choices, then generate destinations for unconnected ones—
              or generate choice paths in one step.
            </p>
          )}
        </div>
      )}

      {visibleChoices.length === 0 ? (
        <p className="sidebar-hint">
          {isChatBlock ? "No replies yet." : "No choices yet."}
        </p>
      ) : (
        <div className="choice-list">
          {visibleChoices.map((choice, index) =>
            props.isOnboardingDemoPreview ? (
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
                readOnly
                onExpand={() => handleChoiceExpand(index)}
              />
            ) : (
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
                onUpdate={updateChoiceOnSelectedNode}
                onRemove={removeChoiceFromSelectedNode}
                onExpand={() => handleChoiceExpand(index)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
