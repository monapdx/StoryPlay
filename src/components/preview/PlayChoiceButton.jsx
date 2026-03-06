export default function PlayChoiceButton({ choice, targetNode, onChoose }) {
  const label = choice?.label || "Continue";

  return (
    <button className="preview-choice-button" onClick={onChoose}>
      <span>{label}</span>
      <span className="preview-choice-target">
        {targetNode?.data?.title || "Unlinked block"}
      </span>
    </button>
  );
}