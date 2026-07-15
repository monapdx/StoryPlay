import type { Condition, Effect } from "../types/storyCore";

/** Stable id for the optional tutorial scene created during the guided tour. */
export const ONBOARDING_SCAFFOLD_NODE_ID = "onboarding_scaffold";

/** Minimal demo choice seeded into the onboarding scaffold — not a full choice schema. */
interface OnboardingDemoChoice {
  label: string;
  targetNodeId: string;
  conditions: Condition[];
  effects: Effect[];
}

export const ONBOARDING_DEMO_CHOICES: OnboardingDemoChoice[] = [
  {
    label: "Take the forest path",
    targetNodeId: "",
    conditions: [],
    effects: [],
  },
  {
    label: "Return to town",
    targetNodeId: "",
    conditions: [],
    effects: [],
  },
];

/** Minimal demo node shown in the sidebar during the tour — not a full story node. */
export const ONBOARDING_DEMO_NODE = {
  id: ONBOARDING_SCAFFOLD_NODE_ID,
  data: {
    title: "Tutorial Scene",
    blockType: "narrative",
    choices: ONBOARDING_DEMO_CHOICES,
  },
} as const;

/** Tour steps that need example choices visible in the sidebar. */
export function isOnboardingChoiceStep(
  stepId: string | null | undefined
): boolean {
  return stepId === "choices" || stepId === "choice-expand";
}

export function isOnboardingSidebarStep(
  stepId: string | null | undefined
): boolean {
  return stepId === "sidebar" || isOnboardingChoiceStep(stepId);
}
