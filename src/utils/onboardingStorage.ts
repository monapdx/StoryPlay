const ONBOARDING_COMPLETE_KEY = "storyplay-onboarding-complete";

export function isOnboardingComplete(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(): void {
  try {
    window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearOnboardingComplete(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch {
    /* ignore */
  }
}
