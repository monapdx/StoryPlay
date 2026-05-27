import { renderStoryText } from "../../utils/storyReferences";

export default function PlayChoiceButton({
  choice,
  targetNode,
  characters = [],
  onChoose,
}) {
  const storyState = { characters };
  const label = renderStoryText(choice?.label, storyState) || "Continue";
  const targetTitle =
    renderStoryText(targetNode?.data?.title, storyState) || "Unlinked block";

  return (
    <button className="preview-choice-button" onClick={onChoose}>
      <span>{label}</span>
      <span className="preview-choice-target">{targetTitle}</span>
    </button>
  );
}