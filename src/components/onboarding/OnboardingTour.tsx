import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OnboardingStep, OnboardingStepPlacement } from "../../types/onboarding";
import {
  computeCenteredTooltipPosition,
  computeTooltipPosition,
  getSpotlightRect,
  getViewportMetrics,
} from "../../utils/onboardingPosition";

const TARGET_RETRY_LIMIT = 24;
const VIEWPORT_FALLBACK_TOP = 16;
const VIEWPORT_FALLBACK_LEFT = 16;

export interface OnboardingTourProps {
  step: OnboardingStep | null;
  stepIndex: number;
  stepCount: number;
  isLastStep: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/** Includes "center" from computeCenteredTooltipPosition when no target. */
type TourTooltipPlacement = OnboardingStepPlacement | "center";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourLayout {
  spotlight: SpotlightRect | null;
  tooltipTop: number;
  tooltipLeft: number;
  placement: TourTooltipPlacement;
  ready: boolean;
}

interface UpdateLayoutOptions {
  allowFallback?: boolean;
}

function getTargetElement(selector: string | null | undefined): Element | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return el;
}

export default function OnboardingTour({
  step,
  stepIndex,
  stepCount,
  isLastStep,
  onNext,
  onBack,
  onSkip,
}: OnboardingTourProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<TourLayout | null>(null);

  const updateLayout = useCallback(
    ({ allowFallback = true }: UpdateLayoutOptions = {}) => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl || !step) {
        setLayout(null);
        return false;
      }

      const viewport = getViewportMetrics();
      const targetEl = getTargetElement(step.target);

      if (targetEl) {
        targetEl.scrollIntoView({
          block: step.scrollBlock || "nearest",
          inline: "nearest",
          behavior: "auto",
        });
      }

      const tooltipRect = tooltipEl.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width || tooltipEl.offsetWidth || 280;
      const tooltipHeight = tooltipRect.height || tooltipEl.offsetHeight || 160;

      if (!targetEl) {
        if (!allowFallback) {
          return false;
        }

        const centered = computeCenteredTooltipPosition(
          tooltipWidth,
          tooltipHeight,
          viewport
        ) as {
          top: number;
          left: number;
          placement: TourTooltipPlacement;
        };
        setLayout({
          spotlight: null,
          tooltipTop: centered.top,
          tooltipLeft: centered.left,
          placement: centered.placement,
          ready: true,
        });
        return false;
      }

      const targetRect = targetEl.getBoundingClientRect();
      const positioned = computeTooltipPosition({
        targetRect,
        tooltipWidth,
        tooltipHeight,
        preferredPlacement: step.placement || "bottom",
        viewport,
      }) as {
        top: number;
        left: number;
        placement: TourTooltipPlacement;
      };

      setLayout({
        spotlight: getSpotlightRect(
          targetRect,
          step.spotlightPadding
        ) as SpotlightRect,
        tooltipTop: positioned.top,
        tooltipLeft: positioned.left,
        placement: positioned.placement,
        ready: true,
      });

      return true;
    },
    [step]
  );

  useLayoutEffect(() => {
    setLayout((current) => (current ? { ...current, ready: false } : null));

    let retryCount = 0;
    let retryFrameId = 0;

    const runUpdate = () => {
      const found = updateLayout({ allowFallback: false });

      if (!found && step?.waitForTarget && retryCount < TARGET_RETRY_LIMIT) {
        retryCount += 1;
        retryFrameId = window.requestAnimationFrame(runUpdate);
        return;
      }

      updateLayout({ allowFallback: true });
      window.requestAnimationFrame(() => updateLayout({ allowFallback: true }));
    };

    runUpdate();

    window.addEventListener("resize", runUpdate);
    window.addEventListener("scroll", runUpdate, true);
    window.visualViewport?.addEventListener("resize", runUpdate);
    window.visualViewport?.addEventListener("scroll", runUpdate);

    const tooltipEl = tooltipRef.current;
    let resizeObserver: ResizeObserver | undefined;
    if (tooltipEl && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(runUpdate);
      resizeObserver.observe(tooltipEl);
    }

    return () => {
      window.cancelAnimationFrame(retryFrameId);
      window.removeEventListener("resize", runUpdate);
      window.removeEventListener("scroll", runUpdate, true);
      window.visualViewport?.removeEventListener("resize", runUpdate);
      window.visualViewport?.removeEventListener("scroll", runUpdate);
      resizeObserver?.disconnect();
    };
  }, [updateLayout, stepIndex, step?.target, step?.waitForTarget]);

  if (!step) return null;

  const tooltipStyle = {
    top: layout?.tooltipTop ?? VIEWPORT_FALLBACK_TOP,
    left: layout?.tooltipLeft ?? VIEWPORT_FALLBACK_LEFT,
    visibility: layout?.ready ? ("visible" as const) : ("hidden" as const),
  };

  const showFallback = !layout?.spotlight && !step.waitForTarget;

  const content = (
    <div
      className="onboarding-tour"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {!layout?.spotlight && <div className="onboarding-tour__backdrop" aria-hidden="true" />}

      {layout?.spotlight && (
        <div
          className="onboarding-tour__spotlight"
          style={{
            top: layout.spotlight.top,
            left: layout.spotlight.left,
            width: layout.spotlight.width,
            height: layout.spotlight.height,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={tooltipRef}
        className="onboarding-tour__tooltip custom-scrollbar"
        style={tooltipStyle}
        data-placement={layout?.placement || step.placement || "bottom"}
      >
        <p className="onboarding-tour__progress">
          Step {stepIndex + 1} of {stepCount}
        </p>
        <h2 id="onboarding-title" className="onboarding-tour__title">
          {step.title}
        </h2>
        <p className="onboarding-tour__body">{step.body}</p>

        {showFallback && (
          <p className="onboarding-tour__fallback muted">
            This panel opens when you select a scene or use the matching button above.
          </p>
        )}

        <div className="onboarding-tour__actions">
          <button type="button" className="onboarding-tour__skip" onClick={onSkip}>
            Skip tour
          </button>
          <div className="onboarding-tour__nav">
            <button
              type="button"
              className="secondary-button"
              onClick={onBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button type="button" className="onboarding-tour__next" onClick={onNext}>
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
