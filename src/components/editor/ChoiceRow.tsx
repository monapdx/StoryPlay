import type { ChangeEvent } from "react";
import ChoiceConditionsEditor from "./ChoiceConditionsEditor";
import ChoiceEffectsEditor from "./ChoiceEffectsEditor";
import ReferenceTextarea from "./ReferenceTextarea";
import { renderStoryText } from "../../utils/storyReferences";
import type { StoryBlockType, StoryNode } from "../../types/story";
import type {
  Condition,
  Effect,
  StoryCharacter,
  StoryVariables,
} from "../../types/storyCore";

/**
 * Structural source for a choice row. Intentionally looser than StoryChoice so
 * incomplete legacy/demo choices remain usable; do not weaken StoryChoice.
 * Canonical StoryChoice values are assignable to this type.
 */
export type ChoiceRowSource = {
  choiceKind?: string | null;
  npcResponse?: string | null;
  label?: string;
  playerMessage?: string;
  targetNodeId?: string;
  conditions?: Condition[] | null;
  effects?: Effect[] | null;
};

export type ChoiceRowUpdateHandler = (
  choiceIndex: number,
  field: string,
  value: unknown
) => void;

export type ChoiceRowRemoveHandler = (choiceIndex: number) => void;

export interface ChoiceRowBaseProps {
  choiceIndex: number;
  choice: ChoiceRowSource;
  blockType?: StoryBlockType | string;
  allNodes: StoryNode[];
  variables: StoryVariables;
  characters?: StoryCharacter[];
  currentNodeId: string;
  isExpanded: boolean;
  highlightChevron?: boolean;
  revealOnboarding?: boolean;
  revealDelayMs?: number;
  onExpand: () => void;
}

/** Preview/demo rows — no mutation handlers. */
export interface ChoiceRowReadOnlyProps extends ChoiceRowBaseProps {
  readOnly: true;
  onUpdate?: undefined;
  onRemove?: undefined;
}

/** Editable rows — update/remove required. */
export interface ChoiceRowEditableProps extends ChoiceRowBaseProps {
  readOnly?: false;
  onUpdate: ChoiceRowUpdateHandler;
  onRemove: ChoiceRowRemoveHandler;
}

export type ChoiceRowProps = ChoiceRowReadOnlyProps | ChoiceRowEditableProps;

export default function ChoiceRow(props: ChoiceRowProps) {
  const {
    choiceIndex,
    choice,
    blockType = "narrative",
    allNodes,
    variables,
    characters = [],
    currentNodeId,
    isExpanded,
    highlightChevron = false,
    revealOnboarding = false,
    revealDelayMs = 0,
    readOnly = false,
    onExpand,
  } = props;

  const storyState = { characters };
  const isChatBlock = blockType === "chat";
  // Chat blocks always author replies — no Choice Type toggle.
  const showAsChatReply = isChatBlock;
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
    ? [
        playerPreview ? `You: ${playerPreview}` : null,
        npcPreview ? `NPC: ${npcPreview}` : "NPC: (no response yet)",
        choice.targetNodeId
          ? `Exit → ${targetLabel || choice.targetNodeId}`
          : "Stay in chat",
      ]
        .filter(Boolean)
        .join(" · ")
    : targetLabel || choice.targetNodeId || "No target selected";

  return (
    <div
      className={[
        "choice-row",
        isExpanded ? "is-expanded" : "",
        revealOnboarding ? "choice-row--onboarding-reveal" : "",
        highlightChevron ? "choice-row--onboarding-highlight" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        revealOnboarding ? { animationDelay: `${revealDelayMs}ms` } : undefined
      }
      data-onboarding={highlightChevron ? "choice-expand-demo" : undefined}
    >
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
        <span
          className={[
            "collapsible-chevron",
            isExpanded ? "is-open" : "",
            highlightChevron ? "collapsible-chevron--onboarding" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-onboarding={
            highlightChevron ? "choice-expand-chevron" : undefined
          }
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isExpanded && (
        <>
          {props.readOnly ? (
            <p className="sidebar-hint">Example choice.</p>
          ) : (
            <>
              {showAsChatReply ? (
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
                          props.onUpdate(choiceIndex, "label", nextValue)
                        }
                        placeholder="Reply button label"
                        insertLabel="Insert character"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message in chat</label>
                      <ReferenceTextarea
                        className="form-textarea"
                        value={choice.playerMessage || ""}
                        characters={characters}
                        onChange={(nextValue) =>
                          props.onUpdate(
                            choiceIndex,
                            "playerMessage",
                            nextValue
                          )
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
                          props.onUpdate(choiceIndex, "npcResponse", nextValue)
                        }
                        placeholder="Unique reply from the character who texted first"
                        insertLabel="Insert character"
                      />
                      <p className="sidebar-hint">
                        Speaker is taken from the opening message when you omit
                        a Name: prefix.
                      </p>
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
                    onChange={(nextValue) =>
                      props.onUpdate(choiceIndex, "label", nextValue)
                    }
                    placeholder="Enter choice text"
                    insertLabel="Insert character"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {showAsChatReply ? "Exit to block after this reply" : "Target"}
                </label>
                <select
                  className="form-select"
                  value={choice.targetNodeId || ""}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    props.onUpdate(
                      choiceIndex,
                      "targetNodeId",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    {showAsChatReply
                      ? "Stay in this chat (no exit yet)"
                      : "Select target block"}
                  </option>
                  {availableTargets.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data?.title || `Untitled (${node.id})`}
                    </option>
                  ))}
                </select>
                {showAsChatReply && (
                  <p className="sidebar-hint">
                    Pick an exit when this reply should leave the chat and
                    continue the story.
                  </p>
                )}
              </div>

              <ChoiceConditionsEditor
                choice={choice}
                variables={variables}
                onUpdate={(field, value) =>
                  props.onUpdate(choiceIndex, field, value)
                }
              />

              <ChoiceEffectsEditor
                choice={choice}
                variables={variables}
                onUpdate={(field, value) =>
                  props.onUpdate(choiceIndex, field, value)
                }
              />

              {!readOnly && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => props.onRemove(choiceIndex)}
                >
                  {showAsChatReply ? "Remove Reply" : "Remove Choice"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
