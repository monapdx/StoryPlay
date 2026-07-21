import { useEffect, useMemo, useRef, useState } from "react";
import PlayChoiceButton from "./PlayChoiceButton";
import { evaluateConditions } from "../../utils/storyLogic";
import { renderStoryText } from "../../utils/storyReferences";
import {
  getChatPrefaceLines,
  parseChatLines,
  runChatLineRevealSequence,
  type ChatLine,
} from "../../utils/chatPlay";
import { isChatReplyChoice, isGoToChoice } from "../../utils/choiceKinds";
import ChatReplyPicker from "./ChatReplyPicker";
import ChatBubbleContent from "./ChatBubbleContent";
import TraitPickerBlockView from "../blocks/TraitPickerBlockView";
import PersuasionBlockView from "../blocks/PersuasionBlockView";
import ChoiceWeightingBlockView from "../blocks/ChoiceWeightingBlockView";
import PlayerStatsPanel from "./PlayerStatsPanel";
import { buildRuntimeMiniGameBlock } from "../../utils/miniGameFromNode";
import type {
  PlayHistoryEntry,
  UsePlayStateResult,
} from "../../hooks/usePlayState";
import type {
  StoryChoice,
  StoryNode,
  StoryNodeData,
} from "../../types/story";
import type {
  StoryCharacter,
  StoryVariables,
  VariableMetaMap,
  Effect,
} from "../../types/storyCore";
import type { VariablePatch } from "../../types/storyBlocks";
import type {
  StoryPlayMiniGameResult,
} from "../../types/minigames";

export type StoryPreviewVariant = "default" | "dock" | "player";

/**
 * Props for dock (editor) and standalone player preview.
 * Callers typically spread usePlayState result plus story/snapshot fields.
 */
export interface StoryPreviewProps {
  nodes: StoryNode[];
  characters?: StoryCharacter[];
  selectedNode?: StoryNode | null;
  selectedNodeId?: string | null;
  currentPlayNode?: UsePlayStateResult["currentPlayNode"];
  history?: PlayHistoryEntry[];
  playVariables?: StoryVariables;
  changedVariableKeys?: string[];
  revealedVariableKeys?: string[];
  initialVariables?: StoryVariables;
  variableMeta?: VariableMetaMap;
  startFromNode: UsePlayStateResult["startFromNode"];
  resetToSelected: UsePlayStateResult["resetToSelected"];
  goToNode: UsePlayStateResult["goToNode"];
  goBack: UsePlayStateResult["goBack"];
  /** "dock" = compact inline editor preview; "player" = standalone #/play tab */
  variant?: StoryPreviewVariant;
}

/** Option row fields resolved for mini-game / display preview. */
interface PreviewOptionSource {
  label?: unknown;
  description?: unknown;
  [key: string]: unknown;
}

/**
 * Node data after reference-token resolution for preview rendering.
 * Still node-data shaped — not a canonical StoryPlayMiniGameBlock.
 */
type ResolvedPlayNodeData = StoryNodeData & {
  options?: PreviewOptionSource[];
  choices?: StoryChoice[];
};

function variablePatchToEffects(
  variablePatch: VariablePatch = {}
): Effect[] {
  return Object.entries(variablePatch || {}).map(([variable, value]) => ({
    variable,
    action: "set",
    value,
  }));
}

export default function StoryPreview({
  nodes,
  characters = [],
  selectedNode,
  selectedNodeId,
  currentPlayNode,
  history,
  playVariables,
  changedVariableKeys,
  revealedVariableKeys = [],
  initialVariables = {},
  variableMeta = {},
  startFromNode,
  resetToSelected,
  goToNode,
  goBack,
  variant = "default",
}: StoryPreviewProps) {
  const isDock = variant === "dock";
  const isPlayer = variant === "player";
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [chatThreadLines, setChatThreadLines] = useState<ChatLine[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [chatTurnReady, setChatTurnReady] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [showPlayMeta, setShowPlayMeta] = useState(false);
  /** After trait / choice-weighting confirm without auto-advance, show branching choices. */
  const [setterGateOpen, setSetterGateOpen] = useState(false);
  const [previewSessionNonce, setPreviewSessionNonce] = useState(0);

  const chatTimersRef = useRef<number[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  function clearChatTimers() {
    chatTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    chatTimersRef.current = [];
  }

  const nodesById = useMemo(() => {
    const map: Record<string, StoryNode> = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  const playNodeData = currentPlayNode?.data || null;

  const storyRenderState = useMemo(
    () => ({ characters, variables: playVariables }),
    [characters, playVariables]
  );

  const resolvedPlayNodeData = useMemo((): ResolvedPlayNodeData | null => {
    if (!playNodeData) return null;

    return {
      ...playNodeData,
      title: renderStoryText(playNodeData.title, storyRenderState),
      content: renderStoryText(playNodeData.content, storyRenderState),
      prompt: renderStoryText(playNodeData.prompt, storyRenderState),
      options: (playNodeData.options || []).map((rawOption) => {
        const option = rawOption as PreviewOptionSource;
        return {
          ...option,
          label: renderStoryText(option.label, storyRenderState),
          description: renderStoryText(option.description, storyRenderState),
        };
      }),
      choices: (playNodeData.choices || []).map((choice) => ({
        ...choice,
        text: renderStoryText(choice.text, storyRenderState),
        response: renderStoryText(choice.response, storyRenderState),
      })),
    };
  }, [playNodeData, storyRenderState]);

  const playChoices = playNodeData?.choices || [];
  const visibleChoices = playChoices.filter((choice) =>
    evaluateConditions(choice.conditions || [], playVariables || {})
  );

  const blockType = playNodeData?.blockType || "narrative";
  const isTimed = blockType === "timed";
  const isChat = blockType === "chat";
  const isMiniGame = ["traitPicker", "persuasion", "choiceWeighting"].includes(
    blockType
  );

  const showNarrativeChoiceList =
    !isChat &&
    (!isMiniGame ||
      (setterGateOpen &&
        (blockType === "traitPicker" || blockType === "choiceWeighting")));

  // Direct/default transition for a narrative block. Rendered as a distinct
  // "Continue" control — never synthesized into a player choice chip.
  const narrativeContinueNodeId = String(
    playNodeData?.continueNodeId || ""
  ).trim();
  const canNarrativeContinue =
    blockType === "narrative" &&
    !!narrativeContinueNodeId &&
    !!nodesById[narrativeContinueNodeId];

  useEffect(() => {
    setSetterGateOpen(false);
  }, [currentPlayNode?.id]);

  function bumpPreviewSession() {
    setPreviewSessionNonce((n) => n + 1);
    setSetterGateOpen(false);
  }

  const timerSeconds = Number(playNodeData?.timerSeconds ?? 0);
  const timeoutTargetNodeId = playNodeData?.timeoutTargetNodeId || "";
  const timeoutEffects = playNodeData?.timeoutEffects || [];

  const chatLines = useMemo(() => {
    if (!isChat) return [];
    return parseChatLines(playNodeData?.content || "");
  }, [isChat, playNodeData?.content]);

  const chatReplyChoices = useMemo(
    () =>
      visibleChoices.filter((choice) => isChatReplyChoice(choice, blockType)),
    [visibleChoices, blockType]
  );

  const goToChoices = useMemo(
    () => visibleChoices.filter((choice) => isGoToChoice(choice, blockType)),
    [visibleChoices, blockType]
  );

  const hasChatReplyChoices = isChat && chatReplyChoices.length > 0;

  useEffect(() => {
    if (
      !isTimed ||
      !currentPlayNode?.id ||
      timerSeconds <= 0 ||
      !timeoutTargetNodeId
    ) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(timerSeconds);
  }, [isTimed, currentPlayNode?.id, timerSeconds, timeoutTargetNodeId]);

  useEffect(() => {
    if (!isTimed || timeLeft === null) return;
    if (!timeoutTargetNodeId) return;

    if (timeLeft <= 0) {
      goToNode(timeoutTargetNodeId, timeoutEffects);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isTimed, timeLeft, timeoutTargetNodeId, timeoutEffects, goToNode]);

  useEffect(() => {
    clearChatTimers();

    setChatThreadLines([]);
    setChatTurnReady(false);
    setChatBusy(false);
    setShowTyping(false);

    if (!isChat || !currentPlayNode?.id) {
      return;
    }

    const prefaceLines = getChatPrefaceLines(chatLines, hasChatReplyChoices);

    if (prefaceLines.length === 0) {
      setChatTurnReady(true);
      return;
    }

    setChatBusy(true);

    const cleanup = runChatLineRevealSequence({
      lines: prefaceLines,
      timers: chatTimersRef.current,
      onTyping: setShowTyping,
      onReveal: (line) => {
        setChatThreadLines((prev) => [...prev, line]);
      },
      onDone: () => {
        setChatBusy(false);
        setChatTurnReady(true);
      },
    });

    return () => {
      cleanup();
      clearChatTimers();
    };
    // Only restart the chat thread when entering a chat block or resetting preview —
    // not when variables/content re-render mid-conversation (that was cancelling NPC replies).
  }, [isChat, currentPlayNode?.id, previewSessionNonce]);

  const chatAwaitingReply =
    hasChatReplyChoices && chatTurnReady && !chatBusy;

  const showChatGoToChoices =
    isChat && chatTurnReady && !chatBusy && goToChoices.length > 0;

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatThreadLines, showTyping, chatTurnReady, chatBusy, chatAwaitingReply]);

  function finishChatReplyTurn(choice: StoryChoice) {
    setChatBusy(false);

    if (choice.targetNodeId) {
      window.setTimeout(() => {
        goToNode(choice.targetNodeId, []);
      }, 420);
      return;
    }

    setChatTurnReady(true);
  }

  function applyChatChoiceEffects(choice: StoryChoice) {
    if ((choice.effects || []).length > 0 && currentPlayNode?.id) {
      goToNode(currentPlayNode.id, choice.effects || []);
    }
  }

  function handleChatReply(choice: StoryChoice) {
    if (!chatTurnReady || chatBusy) return;

    const outgoingLine: ChatLine = {
      id: `you-${Date.now()}`,
      side: "outgoing",
      speaker: "You",
      message:
        String(choice?.playerMessage || choice?.label || "").trim() || "Reply",
    };

    setChatThreadLines((prev) => [...prev, outgoingLine]);
    setChatTurnReady(false);
    setChatBusy(true);

    const responseLines = parseChatLines(choice.npcResponse || "");

    const completeChatReplyTurn = () => {
      applyChatChoiceEffects(choice);
      finishChatReplyTurn(choice);
    };

    if (responseLines.length === 0) {
      completeChatReplyTurn();
      return;
    }

    runChatLineRevealSequence({
      lines: responseLines,
      timers: chatTimersRef.current,
      onTyping: setShowTyping,
      onReveal: (line) => {
        setChatThreadLines((prev) => [...prev, line]);
      },
      onDone: completeChatReplyTurn,
    });
  }

  function handleMiniGameComplete(result: StoryPlayMiniGameResult) {
    const effects = variablePatchToEffects(result.variablePatch || {});

    const nextNodeId = result.nextNodeId || null;

    if (nextNodeId) {
      goToNode(nextNodeId, effects);
      return;
    }

    if (currentPlayNode?.id && effects.length > 0) {
      goToNode(currentPlayNode.id, effects);
    }

    if (
      (result.type === "traitPicker" || result.type === "choiceWeighting") &&
      !nextNodeId
    ) {
      setSetterGateOpen(true);
    }
  }

  function renderMiniGameBlock() {
    if (!resolvedPlayNodeData) return null;
    const runtimeBlock = buildRuntimeMiniGameBlock(
      currentPlayNode?.id || "preview",
      resolvedPlayNodeData
    );
    if (!runtimeBlock) return null;

    switch (runtimeBlock.type) {
      case "traitPicker":
        return (
          <TraitPickerBlockView
            block={runtimeBlock}
            previewSessionNonce={previewSessionNonce}
            onComplete={handleMiniGameComplete}
          />
        );

      case "persuasion":
        return (
          <PersuasionBlockView
            block={runtimeBlock}
            onComplete={handleMiniGameComplete}
          />
        );

      case "choiceWeighting":
        return (
          <ChoiceWeightingBlockView
            block={runtimeBlock}
            previewSessionNonce={previewSessionNonce}
            onComplete={handleMiniGameComplete}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className={`preview-story${isDock ? " preview-story--dock" : ""}`}>
      <div className="preview-play-shell">
      <div className="preview-header-row">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {isDock ? "Preview" : isPlayer ? "Play" : "Play Preview"}
        </h2>

        <div className="preview-toolbar">
          {!isPlayer && (
            <>
          <button
            className="toolbar-button"
            onClick={() => {
              bumpPreviewSession();
              startFromNode(selectedNodeId);
            }}
            disabled={!selectedNodeId}
            title={isDock ? "Start from selected canvas block" : undefined}
          >
            {isDock ? "Start" : "Start From Selected"}
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
            onClick={() => {
              bumpPreviewSession();
              resetToSelected();
            }}
            title={isDock ? "Reset play state to match editor selection" : undefined}
          >
            Reset
          </button>
            </>
          )}

          {isPlayer && (
            <>
              <button
                className="toolbar-button"
                onClick={goBack}
                disabled={!history?.length}
              >
                Back
              </button>

              <button
                className="toolbar-button"
                onClick={() => {
                  bumpPreviewSession();
                  resetToSelected();
                }}
              >
                Restart
              </button>
            </>
          )}
        </div>
      </div>

      <PlayerStatsPanel
        playVariables={playVariables}
        initialVariables={initialVariables}
        revealedVariableKeys={revealedVariableKeys}
        changedVariableKeys={changedVariableKeys}
        nodes={nodes}
        variableMeta={variableMeta}
        currentPlayNode={currentPlayNode}
      />

      {!currentPlayNode ? (
        <div className="preview-block">
          <div className="muted">No story block available to play.</div>
        </div>
      ) : (
        <div
          className={[
            "preview-block",
            isChat ? "preview-block-chat" : "",
            isTimed ? "preview-block-timed" : "",
            isMiniGame ? "preview-block-minigame" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="preview-block-topline">
            <h3 className="preview-title">
              {resolvedPlayNodeData?.title ||
                renderStoryText(playNodeData?.title, storyRenderState) ||
                "Untitled Block"}
            </h3>

            {isTimed && timeLeft !== null && (
              <div className="timed-badge">⏱ {timeLeft}s</div>
            )}
          </div>

          {isMiniGame && renderMiniGameBlock()}

          {isMiniGame &&
            (blockType === "traitPicker" || blockType === "choiceWeighting") &&
            !String(playNodeData?.continueNodeId || "").trim() &&
            !setterGateOpen && (
              <div className="helper-box" style={{ marginTop: 12 }}>
                This block is a <strong>variable setter</strong> (selected ids, allocation map,
                per-option effects). After confirm, pick a <strong>choice below</strong> to continue
                the story—or set <strong>optional auto-advance</strong> in the mini-game editor to
                skip that step.
              </div>
            )}

          {!isMiniGame && !isChat && (
            <div className="preview-content">
              {resolvedPlayNodeData?.content ||
                renderStoryText(playNodeData?.content, storyRenderState) ||
                "No content yet."}
            </div>
          )}

          {isChat && (
            <div className="chat-thread chat-thread-playable" ref={chatScrollRef}>
              {chatThreadLines.length === 0 &&
                !showTyping &&
                !chatAwaitingReply && (
                <div className="muted">No chat messages yet.</div>
              )}

              {chatThreadLines.map((line) => (
                <div
                  key={line.id}
                  className={`chat-row chat-row-${line.side}`}
                >
                  <div className={`chat-bubble chat-bubble-${line.side}`}>
                    <ChatBubbleContent
                      speaker={line.speaker}
                      message={line.message}
                      storyState={storyRenderState}
                    />
                  </div>
                </div>
              ))}

              {showTyping && (
                <div className="chat-row chat-row-incoming">
                  <div className="chat-bubble chat-bubble-incoming chat-bubble-typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              {chatAwaitingReply && (
                <ChatReplyPicker
                  choices={chatReplyChoices}
                  characters={characters}
                  disabled={chatBusy}
                  onSelect={handleChatReply}
                />
              )}
            </div>
          )}

          {showChatGoToChoices && (
            <div className="chat-exit-panel">
              <p className="chat-exit-prompt">Continue the story</p>
              <div className="preview-choice-list chat-exit-choice-list">
                {goToChoices.map((choice, index) => (
                  <PlayChoiceButton
                    key={`${choice.id || choice.label}-${index}`}
                    choice={choice}
                    characters={characters}
                    targetNode={
                      nodesById[choice.targetNodeId as string]
                    }
                    onChoose={() =>
                      goToNode(choice.targetNodeId, choice.effects || [])
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {isChat &&
            chatTurnReady &&
            !chatBusy &&
            chatReplyChoices.length === 0 &&
            goToChoices.length === 0 && (
            <div className="helper-box" style={{ marginTop: 12 }}>
              {playChoices.length === 0
                ? "Add chat replies or go-to choices for this block."
                : "No choices available right now (conditions not met)."}
            </div>
          )}

          {isTimed && timeoutTargetNodeId && (
            <div className="helper-box" style={{ marginTop: 12 }}>
              If time runs out, this block automatically goes to:{" "}
              <strong>
                {renderStoryText(
                  nodesById[timeoutTargetNodeId]?.data?.title,
                  storyRenderState
                ) || timeoutTargetNodeId}
              </strong>
            </div>
          )}

          {!isDock && !isPlayer && (
            <div className="helper-box" style={{ marginTop: 12 }}>
              Block type: {blockType}
            </div>
          )}

          {showNarrativeChoiceList && (
            <div className="preview-choice-list">
              {visibleChoices.length === 0 ? (
                canNarrativeContinue ? (
                  <button
                    type="button"
                    className="toolbar-button preview-continue-button"
                    onClick={() => goToNode(narrativeContinueNodeId, [])}
                  >
                    Continue →
                  </button>
                ) : (
                  <div className="muted">No available choices.</div>
                )
              ) : (
                visibleChoices.map((choice, index) => (
                  <PlayChoiceButton
                    key={`${choice.targetNodeId}-${index}`}
                    choice={choice}
                    characters={characters}
                    targetNode={
                      nodesById[choice.targetNodeId as string]
                    }
                    onChoose={() =>
                      goToNode(choice.targetNodeId, choice.effects || [])
                    }
                  />
                ))
              )}
            </div>
          )}

        </div>
      )}

      </div>

      {!isDock && !isPlayer && (
        <div className="helper-box">
          <button
            type="button"
            className="collapsible-row-header"
            onClick={() => setShowPlayMeta((value) => !value)}
            aria-expanded={showPlayMeta}
          >
            <span>
              <span className="collapsible-row-title">Play Details</span>
              <span className="collapsible-row-meta">
                {currentPlayNode?.data?.title || "Nothing playing"}
              </span>
            </span>
            <span className={`collapsible-chevron ${showPlayMeta ? "is-open" : ""}`}>
              ▾
            </span>
          </button>

          {showPlayMeta && (
            <>
              <strong>Editing:</strong> {selectedNode?.data?.title || "No block selected"}
              <br />
              <strong>Playing:</strong> {currentPlayNode?.data?.title || "Nothing"}
              <br />
              <strong>History:</strong> {history?.length || 0} step
              {(history?.length || 0) === 1 ? "" : "s"}
            </>
          )}
        </div>
      )}
    </div>
  );
}
