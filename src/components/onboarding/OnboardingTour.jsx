import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  computeCenteredTooltipPosition,
  computeTooltipPosition,
  getSpotlightRect,
  getViewportMetrics,
} from "../../utils/onboardingPosition";

function getTargetElement(selector) {
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
}) {
  const tooltipRef = useRef(null);
  const [layout, setLayout] = useState(null);

  const updateLayout = useCallback(() => {
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl || !step) {
      setLayout(null);
      return;
    }

    const viewport = getViewportMetrics();

    const targetEl = getTargetElement(step.target);
    if (targetEl) {
      targetEl.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    }

    const tooltipRect = tooltipEl.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || tooltipEl.offsetWidth || 280;
    const tooltipHeight = tooltipRect.height || tooltipEl.offsetHeight || 160;

    if (!targetEl) {
      const centered = computeCenteredTooltipPosition(tooltipWidth, tooltipHeight, viewport);
      setLayout({
        spotlight: null,
        tooltipTop: centered.top,
        tooltipLeft: centered.left,
        placement: centered.placement,
        ready: true,
      });
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const positioned = computeTooltipPosition({
      targetRect,
      tooltipWidth,
      tooltipHeight,
      preferredPlacement: step.placement || "bottom",
      viewport,
    });

    setLayout({
      spotlight: getSpotlightRect(targetRect),
      tooltipTop: positioned.top,
      tooltipLeft: positioned.left,
      placement: positioned.placement,
      ready: true,
    });
  }, [step]);

  useLayoutEffect(() => {
    setLayout((current) => (current ? { ...current, ready: false } : null));

    const runUpdate = () => {
      updateLayout();
      window.requestAnimationFrame(updateLayout);
    };

    runUpdate();

    window.addEventListener("resize", runUpdate);
    window.addEventListener("scroll", runUpdate, true);
    window.visualViewport?.addEventListener("resize", runUpdate);
    window.visualViewport?.addEventListener("scroll", runUpdate);

    const tooltipEl = tooltipRef.current;
    let resizeObserver;
    if (tooltipEl && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(runUpdate);
      resizeObserver.observe(tooltipEl);
    }

    return () => {
      window.removeEventListener("resize", runUpdate);
      window.removeEventListener("scroll", runUpdate, true);
      window.visualViewport?.removeEventListener("resize", runUpdate);
      window.visualViewport?.removeEventListener("scroll", runUpdate);
      resizeObserver?.disconnect();
    };
  }, [updateLayout, stepIndex, step?.target]);

  if (!step) return null;

  const tooltipStyle = {
    top: layout?.tooltipTop ?? VIEWPORT_FALLBACK_TOP,
    left: layout?.tooltipLeft ?? VIEWPORT_FALLBACK_LEFT,
    visibility: layout?.ready ? "visible" : "hidden",
  };

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

        {!layout?.spotlight && (
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

const VIEWPORT_FALLBACK_TOP = 16;
const VIEWPORT_FALLBACK_LEFT = 16;
