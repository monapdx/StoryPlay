/** Stable id for the optional tutorial scene created during the guided tour. */
export const ONBOARDING_SCAFFOLD_NODE_ID = "onboarding_scaffold";

export const ONBOARDING_DEMO_CHOICES = [
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

export const ONBOARDING_DEMO_NODE = {
  id: ONBOARDING_SCAFFOLD_NODE_ID,
  data: {
    title: "Tutorial Scene",
    blockType: "narrative",
    choices: ONBOARDING_DEMO_CHOICES,
  },
};

/** Tour steps that need example choices visible in the sidebar. */
export function isOnboardingChoiceStep(stepId) {
  return stepId === "choices" || stepId === "choice-expand";
}

export function isOnboardingSidebarStep(stepId) {
  return stepId === "sidebar" || isOnboardingChoiceStep(stepId);
}
