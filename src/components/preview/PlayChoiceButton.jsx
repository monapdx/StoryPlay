export default function PlayChoiceButton({ choice, targetNode, onChoose }) {
  const label = choice?.label || "Continue";
  const targetId = choice?.targetNodeId || "";

  function handleClick() {
    if (!targetId) return;
    onChoose(targetId);
  }

  return (
    <button className="preview-choice-button" onClick={handleClick}>
      <span>{label}</span>
      <span className="preview-choice-target">
        {targetNode?.data?.title || "Unlinked block"}
      </span>
    </button>
  );
}