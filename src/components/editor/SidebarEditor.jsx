import { useEffect, useLayoutEffect, useState } from "react";
import ChoicesEditor from "./ChoicesEditor";
import StoryDiagnostics from "./StoryDiagnostics";
import ReferenceTextarea from "./ReferenceTextarea";
import {
  ONBOARDING_DEMO_NODE,
  isOnboardingChoiceStep,
} from "../../data/onboardingDemo";

export default function SidebarEditor({
  nodes,
  variables,
  characters = [],
  selectedNode,
  onboardingStepId = null,
  ensureOnboardingScaffold,
  updateSelectedNodeField,
  deleteSelectedNode,
  addChoiceToSelectedNode,
  updateChoiceOnSelectedNode,
  removeChoiceFromSelectedNode,
  onOpenMiniGameEditor,
  onOpenVariables,
}) {
  const [isNarrativeContentOpen, setIsNarrativeContentOpen] = useState(false);
  const showOnboardingChoiceDemo = isOnboardingChoiceStep(onboardingStepId);

  useLayoutEffect(() => {
    if (!ensureOnboardingScaffold || !onboardingStepId) return;

    if (onboardingStepId === "sidebar") {
      ensureOnboardingScaffold({ seedChoices: false });
      return;
    }

    if (isOnboardingChoiceStep(onboardingStepId)) {
      ensureOnboardingScaffold({ seedChoices: true });
    }
  }, [ensureOnboardingScaffold, onboardingStepId]);

  useEffect(() => {
    if (!ensureOnboardingScaffold || !isOnboardingChoiceStep(onboardingStepId)) return;
    ensureOnboardingScaffold({ seedChoices: true });
  }, [ensureOnboardingScaffold, onboardingStepId, selectedNode?.id]);

  useEffect(() => {
    setIsNarrativeContentOpen(false);
  }, [selectedNode?.id]);

  if (!selectedNode) {
    if (showOnboardingChoiceDemo) {
      return (
        <div>
          <h2 className="section-title">Block Editor</h2>
          <p className="sidebar-hint">Tutorial Scene — example choices below.</p>

          <div data-onboarding="choices">
            <ChoicesEditor
              selectedNode={ONBOARDING_DEMO_NODE}
              nodes={nodes}
              variables={variables}
              characters={characters}
              onboardingStepId={onboardingStepId}
              isOnboardingDemoPreview
              addChoiceToSelectedNode={addChoiceToSelectedNode}
              updateChoiceOnSelectedNode={updateChoiceOnSelectedNode}
              removeChoiceFromSelectedNode={removeChoiceFromSelectedNode}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="section-title">Block Editor</h2>

        <p className="sidebar-hint" data-onboarding="choices">
          Select a block on the canvas to edit it.
        </p>

        <VariablesWorkspacePromo
          variables={variables}
          onOpenVariables={onOpenVariables}
        />
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

    options = [],
    minSelections = 0,
    maxSelections = 2,
    traitListVariable = "",

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

    totalPoints = 10,
    variablePrefix = "",
    resultVariable = "",
    lockExactTotal = true,

    continueNodeId = "",

    choices = [],
  } = data;

  const isMiniGameBlock = ["traitPicker", "persuasion", "choiceWeighting"].includes(
    blockType
  );

  const miniGameSummary = getMiniGameSummary({
    blockType,
    options,
    minSelections,
    maxSelections,
    traitListVariable,
    targetName,
    startScore,
    minScore,
    maxScore,
    threshold,
    maxTurns,
    visibleMeter,
    scoreVariable,
    successVariable,
    successNodeId,
    failureNodeId,
    totalPoints,
    variablePrefix,
    resultVariable,
    lockExactTotal,
    continueNodeId,
    choices,
  });

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
          <button
            type="button"
            className="collapsible-row-header"
            onClick={() => setIsNarrativeContentOpen((value) => !value)}
            aria-expanded={isNarrativeContentOpen}
          >
            <span>
              <span className="collapsible-row-title">
                {blockType === "chat" ? "Chat Content" : "Content"}
              </span>
              <span className="collapsible-row-meta">
                {content?.trim()
                  ? `${content.trim().slice(0, 80)}${content.trim().length > 80 ? "..." : ""}`
                  : "No content yet"}
              </span>
            </span>
            <span
              className={`collapsible-chevron ${isNarrativeContentOpen ? "is-open" : ""}`}
            >
              ▾
            </span>
          </button>

          {isNarrativeContentOpen && (
            <ReferenceTextarea
              value={content}
              characters={characters}
              onChange={(nextValue) => updateSelectedNodeField("content", nextValue)}
              placeholder={
                blockType === "chat"
                  ? "Name: Opening line\nYou: Player line (optional script)"
                  : "Write the story text for this block..."
              }
            />
          )}
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
        </div>
      )}

      {isMiniGameBlock && (
        <div className="editor-section">
          <div className="editor-section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Mini-Game Settings
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Prompt</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => updateSelectedNodeField("content", e.target.value)}
              placeholder={getMiniGamePromptPlaceholder(blockType)}
            />
          </div>

          <div style={miniGameStyles.card}>
            <div style={miniGameStyles.headerRow}>
              <div>
                <div style={miniGameStyles.title}>
                  {getMiniGameDisplayName(blockType)}
                </div>
                <div style={miniGameStyles.meta}>
                  Options, balance, logic, and live testing.
                </div>
              </div>
            </div>

            <div style={miniGameStyles.summaryGrid}>
              {miniGameSummary.map((item) => (
                <div key={item.label} style={miniGameStyles.summaryRow}>
                  <span style={miniGameStyles.summaryLabel}>{item.label}</span>
                  <span style={miniGameStyles.summaryValue}>{item.value}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="toolbar-button"
              onClick={onOpenMiniGameEditor}
              disabled={!onOpenMiniGameEditor}
              style={
                onOpenMiniGameEditor ? undefined : miniGameStyles.disabledButton
              }
            >
              Open Mini-Game Editor
            </button>
          </div>
        </div>
      )}

      {(blockType === "traitPicker" ||
        blockType === "choiceWeighting" ||
        !isMiniGameBlock) && (
        <>
          {(blockType === "traitPicker" || blockType === "choiceWeighting") && (
            <p className="sidebar-hint" style={{ marginBottom: 12 }}>
              After confirm, use choices below (or auto-advance in mini-game editor).
            </p>
          )}

          <div data-onboarding="choices">
            <ChoicesEditor
              selectedNode={selectedNode}
              nodes={nodes}
              variables={variables}
              characters={characters}
              onboardingStepId={onboardingStepId}
              addChoiceToSelectedNode={addChoiceToSelectedNode}
              updateChoiceOnSelectedNode={updateChoiceOnSelectedNode}
              removeChoiceFromSelectedNode={removeChoiceFromSelectedNode}
            />
          </div>
        </>
      )}

      <VariablesWorkspacePromo
        variables={variables}
        onOpenVariables={onOpenVariables}
      />

      <div style={{ marginTop: 14 }}>
        <button type="button" className="danger-button" onClick={deleteSelectedNode}>
          Delete Block
        </button>
      </div>

      <p className="sidebar-meta-id">ID: {selectedNode.id}</p>

      <StoryDiagnostics nodes={nodes} variables={variables} />
    </div>
  );
}

function getMiniGameDisplayName(blockType) {
  switch (blockType) {
    case "traitPicker":
      return "Trait Picker";
    case "persuasion":
      return "Persuasion";
    case "choiceWeighting":
      return "Choice Weighting";
    default:
      return "Mini-Game";
  }
}

function getMiniGamePromptPlaceholder(blockType) {
  switch (blockType) {
    case "traitPicker":
      return "Select two traits that define your approach.";
    case "persuasion":
      return "You need the guard to let you through the gate.";
    case "choiceWeighting":
      return "Distribute your limited preparation points.";
    default:
      return "Describe the mini-game prompt...";
  }
}

function getMiniGameSummary({
  blockType,
  options,
  minSelections,
  maxSelections,
  traitListVariable,
  targetName,
  startScore,
  minScore,
  maxScore,
  threshold,
  maxTurns,
  visibleMeter,
  scoreVariable,
  successVariable,
  successNodeId,
  failureNodeId,
  totalPoints,
  variablePrefix,
  resultVariable,
  lockExactTotal,
  continueNodeId,
  choices,
}) {
  switch (blockType) {
    case "traitPicker":
      return [
        { label: "Traits", value: String(options.length) },
        { label: "Min", value: String(minSelections) },
        { label: "Max", value: String(maxSelections) },
        { label: "Inventory var", value: traitListVariable || "—" },
        { label: "Auto-advance", value: continueNodeId || "—" },
      ];

    case "persuasion":
      return [
        { label: "Target", value: targetName || "—" },
        { label: "Choices", value: String(choices.length) },
        {
          label: "Score Range",
          value: `${minScore}–${maxScore} (start ${startScore})`,
        },
        { label: "Threshold", value: String(threshold) },
        { label: "Max Turns", value: String(maxTurns) },
        { label: "Meter", value: visibleMeter ? "Visible" : "Hidden" },
        { label: "Score Var", value: scoreVariable || "—" },
        { label: "Success Var", value: successVariable || "—" },
        { label: "Success Node", value: successNodeId || "—" },
        { label: "Failure Node", value: failureNodeId || "—" },
      ];

    case "choiceWeighting":
      return [
        { label: "Options", value: String(options.length) },
        { label: "Total Points", value: String(totalPoints) },
        { label: "Variable Prefix", value: variablePrefix || "—" },
        { label: "Result Variable", value: resultVariable || "—" },
        { label: "Exact Total", value: lockExactTotal ? "Yes" : "No" },
        { label: "Auto-advance", value: continueNodeId || "—" },
      ];

    default:
      return [{ label: "Type", value: "Mini-Game" }];
  }
}

function VariablesWorkspacePromo({ variables, onOpenVariables }) {
  const n = Object.keys(variables || {}).length;

  return (
    <div className="editor-section variables-workspace-promo">
      <div className="editor-section-header">
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Variables
        </h3>
      </div>
      <p className="variables-workspace-promo-meta">
        {n === 0 ? "No variables yet." : `${n} variable${n === 1 ? "" : "s"}.`}
      </p>
      <button
        type="button"
        className="toolbar-button variables-workspace-promo-button"
        onClick={onOpenVariables}
        disabled={!onOpenVariables}
      >
        Open Variables workspace
      </button>
    </div>
  );
}

const miniGameStyles = {
  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "12px",
    background: "rgba(255,255,255,0.03)",
  },
  headerRow: {
    display: "grid",
    gap: "4px",
  },
  title: {
    fontSize: "15px",
    fontWeight: 700,
  },
  meta: {
    fontSize: "12px",
    lineHeight: 1.45,
    opacity: 0.78,
  },
  summaryGrid: {
    display: "grid",
    gap: "8px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "13px",
  },
  summaryLabel: {
    opacity: 0.7,
  },
  summaryValue: {
    fontWeight: 700,
    textAlign: "right",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};