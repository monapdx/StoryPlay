import { useEffect, useMemo, useRef, useState } from "react";
import PlayChoiceButton from "./PlayChoiceButton";
import { evaluateConditions } from "../../utils/storyLogic";

function renderChatLines(content = "") {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const isYou = line.startsWith("You:");
      const text = isYou ? line.replace(/^You:\s*/, "") : line;

      return {
        id: `${index}-${text}`,
        side: isYou ? "outgoing" : "incoming",
        text,
      };
    });
}

export default function StoryPreview({
  nodes,
  selectedNode,
  selectedNodeId,
  currentPlayNode,
  history,
  playVariables,
  previousPlayVariables,
  changedVariableKeys,
  startFromNode,
  resetToSelected,
  goToNode,
  goBack,
}) {
  const [timeLeft, setTimeLeft] = useState(null);

  const [revealedChatCount, setRevealedChatCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [selectedReplyIndex, setSelectedReplyIndex] = useState(null);

  const chatTimersRef = useRef([]);
  const chatScrollRef = useRef(null);

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

  const blockType = playNodeData?.blockType || "narrative";
  const isTimed = blockType === "timed";
  const isChat = blockType === "chat";

  const timerSeconds = Number(playNodeData?.timerSeconds ?? 0);
  const timeoutTargetNodeId = playNodeData?.timeoutTargetNodeId || "";
  const timeoutEffects = playNodeData?.timeoutEffects || [];

  const chatLines = useMemo(() => {
    if (!isChat) return [];
    return renderChatLines(playNodeData?.content || "");
  }, [isChat, playNodeData?.content]);

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
    chatTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    chatTimersRef.current = [];

    setSelectedReplyIndex(null);

    if (!isChat || !currentPlayNode?.id) {
      setRevealedChatCount(0);
      setShowTyping(false);
      return;
    }

    if (chatLines.length === 0) {
      setRevealedChatCount(0);
      setShowTyping(false);
      return;
    }

    setRevealedChatCount(0);
    setShowTyping(true);

    let cumulativeDelay = 450;

    chatLines.forEach((line, index) => {
      const typingStartId = window.setTimeout(() => {
        setShowTyping(true);
      }, cumulativeDelay);
      chatTimersRef.current.push(typingStartId);

      const revealDelay =
        700 + Math.min(1200, Math.max(250, line.text.length * 22));

      const revealId = window.setTimeout(() => {
        setRevealedChatCount(index + 1);
        setShowTyping(index < chatLines.length - 1);
      }, cumulativeDelay + revealDelay);

      chatTimersRef.current.push(revealId);
      cumulativeDelay += revealDelay + 260;
    });

    const finishId = window.setTimeout(() => {
      setShowTyping(false);
    }, cumulativeDelay);

    chatTimersRef.current.push(finishId);

    return () => {
      chatTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      chatTimersRef.current = [];
    };
  }, [isChat, currentPlayNode?.id, chatLines]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [revealedChatCount, showTyping, selectedReplyIndex]);

  const revealedChatLines = isChat
    ? chatLines.slice(0, revealedChatCount)
    : [];

  const chatSequenceComplete =
    !isChat || (revealedChatCount >= chatLines.length && !showTyping);

  function handleChatReply(choice, index) {
    if (selectedReplyIndex !== null) return;

    setSelectedReplyIndex(index);

    window.setTimeout(() => {
      goToNode(choice.targetNodeId, choice.effects || []);
    }, 420);
  }

  return (
    <div className="preview-story">
      <div className="preview-header-row">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          Play Preview
        </h2>

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

          <button className="toolbar-button" onClick={resetToSelected}>
            Reset
          </button>
        </div>
      </div>

      <div className="preview-block">
        <h3 className="preview-title">Variables</h3>

        {Object.keys(playVariables || {}).length === 0 ? (
          <div className="muted">No variables defined.</div>
        ) : (
          <div className="variable-debugger-list">
            {Object.entries(playVariables).map(([key, value]) => {
              const changed = changedVariableKeys?.includes?.(key);
              const previousValue = previousPlayVariables?.[key];

              return (
                <div
                  key={key}
                  className={`variable-debugger-item ${changed ? "changed" : ""}`}
                >
                  <div className="variable-debugger-key">{key}</div>

                  <div className="variable-debugger-value">
                    {changed ? (
                      <>
                        <span className="variable-debugger-old">
                          {String(previousValue)}
                        </span>
                        <span className="variable-debugger-arrow">→</span>
                        <span className="variable-debugger-new">
                          {String(value)}
                        </span>
                      </>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="preview-block-topline">
            <h3 className="preview-title">
              {playNodeData?.title || "Untitled Block"}
            </h3>

            {isTimed && timeLeft !== null && (
              <div className="timed-badge">⏱ {timeLeft}s</div>
            )}
          </div>

          {!isChat && (
            <div className="preview-content">
              {playNodeData?.content || "No content yet."}
            </div>
          )}

          {isChat && (
            <div className="chat-thread chat-thread-playable" ref={chatScrollRef}>
              {revealedChatLines.length === 0 && !showTyping && (
                <div className="muted">No chat messages yet.</div>
              )}

              {revealedChatLines.map((line) => (
                <div
                  key={line.id}
                  className={`chat-row chat-row-${line.side}`}
                >
                  <div className={`chat-bubble chat-bubble-${line.side}`}>
                    {line.text}
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

              {selectedReplyIndex !== null &&
                visibleChoices[selectedReplyIndex] && (
                  <div className="chat-row chat-row-outgoing">
                    <div className="chat-bubble chat-bubble-outgoing">
                      {visibleChoices[selectedReplyIndex].label || "Reply"}
                    </div>
                  </div>
                )}
            </div>
          )}

          {isTimed && timeoutTargetNodeId && (
            <div className="helper-box" style={{ marginTop: 12 }}>
              If time runs out, this block automatically goes to:{" "}
              <strong>
                {nodesById[timeoutTargetNodeId]?.data?.title || timeoutTargetNodeId}
              </strong>
            </div>
          )}

          <div className="helper-box" style={{ marginTop: 12 }}>
            Block type: {blockType}
          </div>

          {!isChat && (
            <div className="preview-choice-list">
              {visibleChoices.length === 0 ? (
                <div className="muted">No available choices.</div>
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
          )}

          {isChat && (
            <div className="chat-reply-panel">
              {!chatSequenceComplete ? (
                <div className="muted">Waiting for messages…</div>
              ) : visibleChoices.length === 0 ? (
                <div className="muted">No available replies.</div>
              ) : (
                <div className="chat-reply-list">
                  {visibleChoices.map((choice, index) => (
                    <button
                      key={choice.id}
                      type="button"
                      className="chat-reply-button"
                      onClick={() => handleChatReply(choice, index)}
                      disabled={selectedReplyIndex !== null}
                    >
                      {choice.label || "Reply"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="helper-box">
        <strong>Editing:</strong> {selectedNode?.data?.title || "No block selected"}
        <br />
        <strong>Playing:</strong> {currentPlayNode?.data?.title || "Nothing"}
        <br />
        <strong>History:</strong> {history?.length || 0} step
        {(history?.length || 0) === 1 ? "" : "s"}
      </div>
    </div>
  );
}