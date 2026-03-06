export default function ChoicePreviewList({ choices, nodesById }) {
  if (!choices.length) {
    return <div className="preview-choice">No outgoing choices yet.</div>;
  }

  return (
    <>
      {choices.map((choice) => {
        const target = nodesById[choice.targetNodeId];

        return (
          <div key={choice.id} className="preview-choice">
            {choice.label || "Choice"} →{" "}
            {target?.data?.title || "Unlinked block"}
          </div>
        );
      })}
    </>
  );
}