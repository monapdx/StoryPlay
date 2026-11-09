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
    id: "node-editor",
    target: '[data-onboarding="node-editor"]',
    title: "Open a scene",
    body: "Select a block, then open its node editor to write the scene and its choices. Double-click the block body to open it, or double-click its title to rename it. Requirements, effects, and other settings live inside the node editor.",
    placement: "bottom",
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
