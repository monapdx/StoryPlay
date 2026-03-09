import { useMemo } from "react";
import { analyzeStoryGraph } from "../../utils/graphHealth";

export default function StoryDiagnostics({ nodes, variables }) {
  const issues = useMemo(() => {
    return analyzeStoryGraph(nodes, variables);
  }, [nodes, variables]);

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h3 className="section-title">Story Diagnostics</h3>
      </div>

      <div className="diagnostics-list">
        {issues.map((issue, index) => (
          <div
            key={`${issue.message}-${index}`}
            className={`diagnostic-item diagnostic-${issue.severity}`}
          >
            <div className="diagnostic-badge">
              {issue.severity === "error"
                ? "Error"
                : issue.severity === "warning"
                ? "Warning"
                : "OK"}
            </div>
            <div className="diagnostic-message">{issue.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}