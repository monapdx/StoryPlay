import type {
  TraitPickerBlock,
  PersuasionBlock,
  ChoiceWeightingBlock,
} from "./minigames";

export const traitPickerExample: TraitPickerBlock = {
  id: "block-starting-traits",
  type: "traitPicker",
  title: "Choose Your Traits",
  prompt: "Select two traits that define your approach.",
  minSelections: 2,
  maxSelections: 2,
  traitListVariable: "player_traits",
  submitLabel: "Confirm Traits",
  options: [
    {
      id: "charming",
      label: "Charming",
      description: "Better at persuasion and first impressions.",
      effects: {
        stat_charm: 2,
        persuasion_bonus: 10,
      },
    },
    {
      id: "logical",
      label: "Logical",
      description: "Better at solving puzzles and noticing patterns.",
      effects: {
        stat_logic: 2,
        puzzle_hint_bonus: 1,
      },
    },
    {
      id: "intimidating",
      label: "Intimidating",
      description: "Stronger when threatening, weaker at warmth.",
      effects: {
        stat_presence: 2,
        threat_bonus: 10,
        charm_penalty: 5,
      },
    },
  ],
};

export const persuasionExample: PersuasionBlock = {
  id: "block-guard-persuasion",
  type: "persuasion",
  title: "Convince the Guard",
  prompt: "You need the guard to let you through the gate.",
  targetName: "Guard",
  startScore: 40,
  minScore: 0,
  maxScore: 100,
  threshold: 75,
  maxTurns: 3,
  visibleMeter: true,
  scoreVariable: "guard_persuasion_score",
  successVariable: "guard_convinced",
  submitLabel: "End Conversation",
  successNodeId: "gate-opens",
  failureNodeId: "guard-refuses",
  choices: [
    {
      id: "duty",
      text: "Appeal to duty",
      delta: 15,
      response: "The guard seems to consider your point.",
    },
    {
      id: "bribe",
      text: "Offer a bribe",
      delta: 20,
      response: "The guard glances around nervously.",
    },
    {
      id: "threaten",
      text: "Make a threat",
      delta: -10,
      response: "That clearly did not help.",
    },
  ],
};

export const choiceWeightingExample: ChoiceWeightingBlock = {
  id: "block-journey-prep",
  type: "choiceWeighting",
  title: "Prepare for the Journey",
  prompt: "Distribute your limited preparation points.",
  totalPoints: 10,
  lockExactTotal: true,
  variablePrefix: "prep_",
  resultVariable: "journey_prep_allocation",
  submitLabel: "Confirm Allocation",
  options: [
    { id: "food", label: "Food", min: 0, max: 10 },
    { id: "medicine", label: "Medicine", min: 0, max: 10 },
    { id: "weapons", label: "Weapons", min: 0, max: 10 },
  ],
};