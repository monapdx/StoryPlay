/** Minimum inset from viewport edges when placing tooltips. */
export const VIEWPORT_MARGIN = 16;

/** Space between spotlight edge and tooltip. */
export const TOOLTIP_GAP = 14;

export const SPOTLIGHT_PADDING = 8;

export type TooltipPlacement = "top" | "bottom" | "left" | "right" | "center";

/** Edge placements considered when flipping the tooltip around a target. */
export type EdgePlacement = "top" | "bottom" | "left" | "right";

/** Visual viewport metrics used for clamping and overflow scoring. */
export interface ViewportMetrics {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
}

/** Absolute top/left card position in viewport coordinates. */
export interface CardPosition {
  top: number;
  left: number;
}

/** Measured tour-card size passed into placement helpers. */
export interface TourCardSize {
  tooltipWidth: number;
  tooltipHeight: number;
}

/** Spotlight hole geometry (padded target bounds). */
export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Result of tooltip placement (edge or centered). */
export interface TooltipPositionResult extends CardPosition {
  placement: TooltipPlacement;
}

/** Inputs for target-anchored tooltip placement. */
export interface ComputeTooltipPositionOptions {
  targetRect: DOMRectReadOnly;
  tooltipWidth: number;
  tooltipHeight: number;
  preferredPlacement?: TooltipPlacement;
  viewport?: ViewportMetrics;
  margin?: number;
  gap?: number;
}

interface ScoredTooltipCandidate extends CardPosition {
  placement: TooltipPlacement;
  score: number;
}

const PLACEMENTS: EdgePlacement[] = ["bottom", "top", "right", "left"];

/**
 * @returns {{ width: number, height: number, offsetTop: number, offsetLeft: number }}
 */
export function getViewportMetrics(): ViewportMetrics {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768, offsetTop: 0, offsetLeft: 0 };
  }

  const vv = window.visualViewport;
  if (!vv) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetTop: 0,
      offsetLeft: 0,
    };
  }

  return {
    width: vv.width,
    height: vv.height,
    offsetTop: vv.offsetTop,
    offsetLeft: vv.offsetLeft,
  };
}

/**
 * @param {DOMRect} targetRect
 * @param {number} padding
 */
export function getSpotlightRect(
  targetRect: DOMRectReadOnly,
  padding: number = SPOTLIGHT_PADDING
): SpotlightRect {
  return {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };
}

/**
 * @param {{ top: number, left: number }} pos
 * @param {number} width
 * @param {number} height
 * @param {{ width: number, height: number, offsetTop: number, offsetLeft: number }} metrics
 * @param {number} margin
 */
function getOverflowScore(
  pos: CardPosition,
  width: number,
  height: number,
  metrics: ViewportMetrics,
  margin: number
): number {
  const minTop = metrics.offsetTop + margin;
  const minLeft = metrics.offsetLeft + margin;
  const maxBottom = metrics.offsetTop + metrics.height - margin;
  const maxRight = metrics.offsetLeft + metrics.width - margin;

  const overflowTop = Math.max(0, minTop - pos.top);
  const overflowLeft = Math.max(0, minLeft - pos.left);
  const overflowBottom = Math.max(0, pos.top + height - maxBottom);
  const overflowRight = Math.max(0, pos.left + width - maxRight);

  return overflowTop + overflowLeft + overflowBottom + overflowRight;
}

/**
 * @param {{ top: number, left: number }} pos
 * @param {number} width
 * @param {number} height
 * @param {{ width: number, height: number, offsetTop: number, offsetLeft: number }} metrics
 * @param {number} margin
 */
function clampToViewport(
  pos: CardPosition,
  width: number,
  height: number,
  metrics: ViewportMetrics,
  margin: number
): CardPosition {
  const minLeft = metrics.offsetLeft + margin;
  const minTop = metrics.offsetTop + margin;
  const maxLeft = Math.max(minLeft, metrics.offsetLeft + metrics.width - width - margin);
  const maxTop = Math.max(minTop, metrics.offsetTop + metrics.height - height - margin);

  return {
    top: Math.min(Math.max(pos.top, minTop), maxTop),
    left: Math.min(Math.max(pos.left, minLeft), maxLeft),
  };
}

/**
 * @param {TooltipPlacement} placement
 * @param {DOMRect} targetRect
 * @param {number} tooltipWidth
 * @param {number} tooltipHeight
 * @param {number} gap
 */
function positionForPlacement(
  placement: TooltipPlacement,
  targetRect: DOMRectReadOnly,
  tooltipWidth: number,
  tooltipHeight: number,
  gap: number
): CardPosition {
  switch (placement) {
    case "top":
      return {
        top: targetRect.top - gap - tooltipHeight,
        left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
      };
    case "right":
      return {
        top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
        left: targetRect.right + gap,
      };
    case "left":
      return {
        top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
        left: targetRect.left - gap - tooltipWidth,
      };
    case "bottom":
    default:
      return {
        top: targetRect.bottom + gap,
        left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
      };
  }
}

/**
 * Pick the best tooltip position for a target element, flipping when needed.
 *
 * @param {object} options
 * @param {DOMRect} options.targetRect
 * @param {number} options.tooltipWidth
 * @param {number} options.tooltipHeight
 * @param {TooltipPlacement} [options.preferredPlacement]
 * @param {{ width: number, height: number, offsetTop: number, offsetLeft: number }} [options.viewport]
 * @param {number} [options.margin]
 * @param {number} [options.gap]
 * @returns {{ top: number, left: number, placement: TooltipPlacement }}
 */
export function computeTooltipPosition({
  targetRect,
  tooltipWidth,
  tooltipHeight,
  preferredPlacement = "bottom",
  viewport,
  margin = VIEWPORT_MARGIN,
  gap = TOOLTIP_GAP,
}: ComputeTooltipPositionOptions): TooltipPositionResult {
  const metrics = viewport || getViewportMetrics();

  const order: TooltipPlacement[] = [
    preferredPlacement,
    ...PLACEMENTS.filter((placement) => placement !== preferredPlacement),
  ];

  const candidates: ScoredTooltipCandidate[] = [];

  for (const placement of order) {
    const raw = positionForPlacement(
      placement,
      targetRect,
      tooltipWidth,
      tooltipHeight,
      gap
    );
    const clamped = clampToViewport(raw, tooltipWidth, tooltipHeight, metrics, margin);
    const score = getOverflowScore(clamped, tooltipWidth, tooltipHeight, metrics, margin);

    candidates.push({ ...clamped, placement, score });
  }

  const bestFit = candidates.find((candidate) => candidate.score === 0);
  if (bestFit) {
    return {
      top: bestFit.top,
      left: bestFit.left,
      placement: bestFit.placement,
    };
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  return {
    top: best.top,
    left: best.left,
    placement: best.placement,
  };
}

/**
 * Center tooltip when no target is available.
 *
 * @param {number} tooltipWidth
 * @param {number} tooltipHeight
 * @param {number} [viewportWidth]
 * @param {number} [viewportHeight]
 * @param {number} [margin]
 */
export function computeCenteredTooltipPosition(
  tooltipWidth: number,
  tooltipHeight: number,
  viewport?: ViewportMetrics,
  margin: number = VIEWPORT_MARGIN
): TooltipPositionResult {
  const metrics = viewport || getViewportMetrics();
  const clamped = clampToViewport(
    {
      top: metrics.offsetTop + (metrics.height - tooltipHeight) / 2,
      left: metrics.offsetLeft + (metrics.width - tooltipWidth) / 2,
    },
    tooltipWidth,
    tooltipHeight,
    metrics,
    margin
  );

  return { ...clamped, placement: "center" };
}
