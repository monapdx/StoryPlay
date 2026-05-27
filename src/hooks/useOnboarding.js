import { useCallback, useState } from "react";
import { ONBOARDING_STEPS } from "../data/onboardingSteps";
import {
  isOnboardingComplete,
  setOnboardingComplete,
} from "../utils/onboardingStorage";

export default function useOnboarding() {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = ONBOARDING_STEPS[stepIndex] ?? null;
  const isLastStep = stepIndex >= ONBOARDING_STEPS.length - 1;

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const restart = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    setOnboardingComplete();
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setOnboardingComplete();
  }, []);

  const next = useCallback(() => {
    if (isLastStep) {
      complete();
      return;
    }
    setStepIndex((index) => Math.min(index + 1, ONBOARDING_STEPS.length - 1));
  }, [complete, isLastStep]);

  const back = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const shouldAutoStart = !isOnboardingComplete();

  return {
    steps: ONBOARDING_STEPS,
    step,
    stepIndex,
    stepCount: ONBOARDING_STEPS.length,
    isActive,
    isLastStep,
    shouldAutoStart,
    start,
    restart,
    skip,
    complete,
    next,
    back,
  };
}
