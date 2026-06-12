import ChoiceConditionsEditor from "./ChoiceConditionsEditor";
import ChoiceEffectsEditor from "./ChoiceEffectsEditor";
import ReferenceTextarea from "./ReferenceTextarea";
import { renderStoryText } from "../../utils/storyReferences";
import {
  CHOICE_KIND,
  getChoiceKind,
  isChatReplyChoice,
} from "../../utils/choiceKinds";

export default function ChoiceRow({
  choiceIndex,
  choice,
  blockType = "narrative",
  allNodes,
  variables,
  characters = [],
  currentNodeId,
  isExpanded,
  onExpand,
  onUpdate,
  onRemove,
}) {
  const storyState = { characters };
  const isChatBlock = blockType === "chat";
  const choiceKind = getChoiceKind(choice, blockType);
  const isReply = isChatReplyChoice(choice, blockType);
  const displayLabel =
    renderStoryText(choice.label, storyState)?.trim() || "Untitled choice";
  const playerPreview = renderStoryText(
    choice.playerMessage || choice.label,
    storyState
  )?.trim();
  const npcPreview = renderStoryText(
    String(choice.npcResponse || "")
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) || "",
    storyState
  )?.trim();
  const availableTargets = allNodes.filter((node) => node.id !== currentNodeId);
  const targetLabel = availableTargets.find(
    (node) => node.id === choice.targetNodeId
  )?.data?.title;

  const metaLabel = isChatBlock
    ? isReply
      ? [
          playerPreview ? `You: ${playerPreview}` : null,
          npcPreview ? `NPC: ${npcPreview}` : "NPC: (no response yet)",
          choice.targetNodeId
            ? `→ ${targetLabel || choice.targetNodeId}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : targetLabel || choice.targetNodeId || "Go to block (no target)"
    : targetLabel || choice.targetNodeId || "No target selected";

  return (
    <div className={`choice-row ${isExpanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="collapsible-row-header"
        onClick={onExpand}
        aria-expanded={isExpanded}
      >
        <span>
          <span className="collapsible-row-title">{displayLabel}</span>
          <span className="collapsible-row-meta">{metaLabel}</span>
        </span>
        <span className={`collapsible-chevron ${isExpanded ? "is-open" : ""}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <>
          {isChatBlock && (
            <div className="form-group">
              <label className="form-label">Choice Type</label>
              <select
                className="form-select"
                value={choiceKind}
                onChange={(e) =>
                  onUpdate(choiceIndex, "choiceKind", e.target.value)
                }
              >
                <option value={CHOICE_KIND.CHAT_REPLY}>Chat reply</option>
                <option value={CHOICE_KIND.GO_TO}>Go to block</option>
              </select>
            </div>
          )}

          {isReply ? (
            <div className="chat-turn-fields">
              <div className="chat-turn-fields__side chat-turn-fields__side--player">
                <span className="chat-turn-fields__badge">Player</span>
                <div className="form-group">
                  <label className="form-label">Reply button</label>
                  <ReferenceTextarea
                    className="form-textarea choice-row__label-field"
                    value={choice.label || ""}
                    characters={characters}
                    onChange={(nextValue) =>
                      onUpdate(choiceIndex, "label", nextValue)
                    }
                    placeholder="Reply button label"
                    insertLabel="Insert character"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Message in chat{" "}
                    <span className="form-label-hint">(optional)</span>
                  </label>
                  <ReferenceTextarea
                    className="form-textarea"
                    value={choice.playerMessage || ""}
                    characters={characters}
                    onChange={(nextValue) =>
                      onUpdate(choiceIndex, "playerMessage", nextValue)
                    }
                    placeholder="Player bubble text (defaults to button label)"
                    insertLabel="Insert character"
                  />
                </div>
              </div>

              <div className="chat-turn-fields__side chat-turn-fields__side--npc">
                <span className="chat-turn-fields__badge">NPC</span>
                <div className="form-group">
                  <label className="form-label">Character response</label>
                  <ReferenceTextarea
                    className="form-textarea"
                    value={choice.npcResponse || ""}
                    characters={characters}
                    onChange={(nextValue) =>
                      onUpdate(choiceIndex, "npcResponse", nextValue)
                    }
                    placeholder={"{{character:id.name}}: Response line"}
                    insertLabel="Insert character"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Choice Label</label>
              <ReferenceTextarea
                className="form-textarea choice-row__label-field"
                value={choice.label || ""}
                characters={characters}
                onChange={(nextValue) => onUpdate(choiceIndex, "label", nextValue)}
                placeholder="Enter choice text"
                insertLabel="Insert character"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {isReply ? "After Reply, Go To (optional)" : "Target Block"}
            </label>
            <select
              className="form-select"
              value={choice.targetNodeId || ""}
              onChange={(e) =>
                onUpdate(choiceIndex, "targetNodeId", e.target.value)
              }
            >
              <option value="">
                {isReply ? "Stay in this chat block" : "Select target block"}
              </option>
              {availableTargets.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data?.title || `Untitled (${node.id})`}
                </option>
              ))}
            </select>
          </div>

          <ChoiceConditionsEditor
            choice={choice}
            variables={variables}
            onUpdate={(field, value) => onUpdate(choiceIndex, field, value)}
          />

          <ChoiceEffectsEditor
            choice={choice}
            variables={variables}
            onUpdate={(field, value) => onUpdate(choiceIndex, field, value)}
          />

          <button
            type="button"
            className="danger-button"
            onClick={() => onRemove(choiceIndex)}
          >
            Remove Choice
          </button>
        </>
      )}
    </div>
  );
}