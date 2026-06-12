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
  const displayLabel =
    renderStoryText(choice.label, storyState)?.trim() || "Untitled choice";
  const availableTargets = allNodes.filter((node) => node.id !== currentNodeId);
  const targetLabel = availableTargets.find(
    (node) => node.id === choice.targetNodeId
  )?.data?.title;
  const isChatBlock = blockType === "chat";
  const choiceKind = getChoiceKind(choice, blockType);
  const isReply = isChatReplyChoice(choice, blockType);

  const metaLabel = isChatBlock
    ? isReply
      ? choice.targetNodeId
        ? `Chat reply → ${targetLabel || choice.targetNodeId}`
        : "Chat reply (stays in block)"
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

          <div className="form-group">
            <label className="form-label">
              {isReply ? "Your Reply" : "Choice Label"}
            </label>
            <ReferenceTextarea
              className="form-textarea choice-row__label-field"
              value={choice.label || ""}
              characters={characters}
              onChange={(nextValue) => onUpdate(choiceIndex, "label", nextValue)}
              placeholder={
                isReply ? "What the player says in the chat" : "Enter choice text"
              }
              insertLabel="Insert character"
            />
          </div>

          {isReply && (
            <div className="form-group">
              <label className="form-label">Character Response</label>
              <ReferenceTextarea
                className="form-textarea"
                value={choice.npcResponse || ""}
                characters={characters}
                onChange={(nextValue) =>
                  onUpdate(choiceIndex, "npcResponse", nextValue)
                }
                placeholder={"Merchant: That'll be three coins.\nMerchant: Pleasure doing business!"}
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