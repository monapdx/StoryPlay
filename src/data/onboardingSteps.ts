import type { OnboardingStep } from "../types/onboarding";

/** Guided tour steps — `target` is a CSS selector for `[data-onboarding="…"]` hooks. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "canvas",
    target: '[data-onboarding="canvas"]',
    title: "Your story map",
    body: "Each block is a scene. Lines between blocks are player choices. Pan and zoom to explore.",
    placement: "bottom",
  },
  {
    id: "add-block",
    target: '[data-onboarding="add-block"]',
    title: "Add your first scene",
    body: "Click Add Block to place a new scene on the map. You can add as many as you need.",
    placement: "bottom",
  },
  {
    id: "sidebar",
    target: '[data-onboarding="sidebar"]',
    title: "Edit a scene",
    body: "Select a block to edit its title and story text. Open Block settings to change its type.",
    placement: "left",
  },
  {
    id: "choices",
    target: '[data-onboarding="choices"]',
    title: "Add choices",
    body: "Click + Add Choice to branch the story. Two example choices appear below—yours work the same way.",
    placement: "left",
  },
  {
    id: "choice-expand",
    target: '[data-onboarding="choice-expand-demo"]',
    title: "Expand to edit",
    body: "Open a choice to edit what the player reads and where it leads. Use Choice rules to control when it appears or what changes after it is picked.",
    placement: "left",
    scrollBlock: "center",
    spotlightPadding: 10,
    waitForTarget: true,
  },
  {
    id: "preview",
    target: '[data-onboarding="preview"]',
    title: "Try it as a player",
    body: "Open Quick Preview to play through your story, or use Play for a full window.",
    placement: "bottom",
  },
  {
    id: "variables",
    target: '[data-onboarding="variables"]',
    title: "Story variables",
    body: "Track health, coins, flags, and more. Conditions and effects on choices can read and update them.",
    placement: "bottom",
  },
  {
    id: "export",
    target: '[data-onboarding="export"]',
    title: "Save your work",
    body: "Export downloads a JSON file you can keep or share. Use Import to load it back.",
    placement: "bottom",
  },
  {
    id: "templates",
    target: '[data-onboarding="templates"]',
    title: "Templates",
    body: "Load a starter template anytime to study branching, chat, timers, and mini-games.",
    placement: "bottom",
  },
];
