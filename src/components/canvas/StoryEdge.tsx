import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import type { NodeGraphLinkKind } from "../../utils/nodeGraphLinks";

/** Play highlight on canvas edges (from StoryCanvas edge hydration). */
export type StoryCanvasEdgePlayState = "idle" | "reachable" | "blocked";

/**
 * Hydrated RF edge `data` bag passed by StoryCanvas — graph label/linkKind
 * plus runtime playState. Not a persisted story schema type.
 */
export interface StoryCanvasEdgeData {
  label?: string;
  linkKind?: NodeGraphLinkKind;
  playState?: StoryCanvasEdgePlayState;
}

export type StoryEdgeProps = EdgeProps<StoryCanvasEdgeData>;

function getEdgeVisuals(
  playState: string,
  selected: boolean | undefined
) {
  if (playState === "reachable") {
    return {
      stroke: "#22c55e",
      strokeWidth: selected ? 4 : 3,
      labelBg: "rgba(20, 83, 45, 0.95)",
      labelBorder: "rgba(74, 222, 128, 0.45)",
      labelColor: "#dcfce7",
    };
  }

  if (playState === "blocked") {
    return {
      stroke: "#f59e0b",
      strokeWidth: selected ? 4 : 3,
      labelBg: "rgba(120, 53, 15, 0.95)",
      labelBorder: "rgba(251, 191, 36, 0.4)",
      labelColor: "#fef3c7",
    };
  }

  return {
    stroke: selected ? "#a78bfa" : "#94a3b8",
    strokeWidth: selected ? 3 : 2,
    labelBg: "rgba(15, 23, 42, 0.9)",
    labelBorder: "rgba(255,255,255,0.08)",
    labelColor: "#e5e7eb",
  };
}

export default function StoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: StoryEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = data?.label || "";
  const playState = data?.playState || "idle";
  const visuals = getEdgeVisuals(playState, selected);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: visuals.stroke,
          strokeWidth: visuals.strokeWidth,
          strokeDasharray: playState === "blocked" ? "6 6" : "0",
        }}
      />

      {label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: visuals.labelBg,
              color: visuals.labelColor,
              border: `1px solid ${visuals.labelBorder}`,
              borderRadius: "999px",
              padding: "4px 8px",
              fontSize: "0.72rem",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
