import { renderStoryText } from "../../utils/storyReferences";
import type { StoryCharacter } from "../../types/storyCore";

/** Minimal choice fields read by the play button label. */
interface PlayChoiceLabelSource {
  label?: unknown;
}

/** Minimal node fields read for the target title preview. */
interface PlayChoiceTargetNode {
  data?: {
    title?: unknown;
  } | null;
}

interface PlayChoiceButtonProps {
  choice?: PlayChoiceLabelSource | null;
  targetNode?: PlayChoiceTargetNode | null;
  characters?: StoryCharacter[];
  onChoose: () => void;
}

export default function PlayChoiceButton({
  choice,
  targetNode,
  characters = [],
  onChoose,
}: PlayChoiceButtonProps) {
  const storyState = { characters };
  // renderStoryText JSDoc says string; runtime coerces non-strings.
  const label =
    renderStoryText(choice?.label as string, storyState) || "Continue";
  const targetTitle =
    renderStoryText(targetNode?.data?.title as string, storyState) ||
    "Unlinked block";

  return (
    <button type="button" className="preview-choice-button" onClick={onChoose}>
      <span>{label}</span>
      <span className="preview-choice-target">{targetTitle}</span>
    </button>
  );
}
