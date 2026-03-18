export default function PlayChoiceButton({ choice, targetNode, onChoose }) {
  const label = choice?.label || "Continue";
  const targetTitle = targetNode?.data?.title || "Unlinked block";

  const showTargetTitle =
    targetTitle &&
    targetTitle !== "Unlinked block" &&
    targetTitle.trim().toLowerCase() !== label.trim().toLowerCase();

  return (
    <button
      type="button"
      className="preview-choice-button"
      onClick={onChoose}
    >
      <span>{label}</span>

      {showTargetTitle && (
        <span className="preview-choice-target">{targetTitle}</span>
      )}
    </button>
  );
}