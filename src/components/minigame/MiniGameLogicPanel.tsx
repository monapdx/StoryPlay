import type {
  MiniGameEditorDraft,
  UseMiniGameEditorStateResult,
} from "../../hooks/useMiniGameEditorState";

/**
 * Logic tab reads a live editor bag whose draft is already non-null
 * (MiniGameEditorSidebar only mounts this after draft exists).
 */
interface MiniGameLogicPanelProps {
  editor: Pick<
    UseMiniGameEditorStateResult,
    "validation" | "totalAssigned"
  > & {
    draft: MiniGameEditorDraft;
  };
}

export default function MiniGameLogicPanel({ editor }: MiniGameLogicPanelProps) {
  const { draft, validation } = editor;

  return (
    <div className="minigame-panel">
      <h3 className="section-title">Logic checks</h3>

      <div className="minigame-checklist">
        <div className={validation.hasPrompt ? "check-pass" : "check-fail"}>
          {validation.hasPrompt ? "✓" : "✕"} Prompt
        </div>

        <div className={validation.hasEnoughItems ? "check-pass" : "check-fail"}>
          {validation.hasEnoughItems ? "✓" : "✕"} Enough items
        </div>

        {draft.type === "choiceWeighting" && (
          <>
            <div className={validation.exactTotalOk ? "check-pass" : "check-fail"}>
              {validation.exactTotalOk ? "✓" : "✕"} Point total
            </div>
            <p className="sidebar-hint">
              Assigned: {editor.totalAssigned} /{" "}
              {Number(draft.config.totalPoints || 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
