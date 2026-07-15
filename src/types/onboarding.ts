/**
 * Guided-tour step shape used by onboardingSteps + OnboardingTour.
 * Not a story-schema type.
 */

export type OnboardingStepPlacement = "top" | "bottom" | "left" | "right";

export interface OnboardingStep {
  id: string;
  /** CSS selector for the spotlight target (e.g. `[data-onboarding="…"]`). */
  target: string;
  title: string;
  body: string;
  placement: OnboardingStepPlacement;
  /** Passed to Element.scrollIntoView({ block }). */
  scrollBlock?: ScrollLogicalPosition;
  spotlightPadding?: number;
  waitForTarget?: boolean;
}
