/** Moderate: variables, chat merchant, conditional purchase. */
import type { DemoStoryPayload } from "../../types/demoStories";

const marketDayStory = {
  variables: {
    coins: 5,
    hasApple: false,
  },

  nodes: [
    {
      id: "mk-start",
      type: "storyNode",
      position: { x: 60, y: 140 },
      data: {
        title: "Market Morning",
        content:
          "You tuck a small pouch of coins into your belt and step into the square.\nVendors shout prices; smoke from a bread oven curls overhead.",
        blockType: "narrative",
        choices: [
          {
            id: "mk-c1",
            label: "Visit the fruit stall",
            targetNodeId: "mk-stall",
            conditions: [],
            effects: [],
          },
          {
            id: "mk-c2",
            label: "Head home without spending",
            targetNodeId: "mk-home",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "mk-stall",
      type: "storyNode",
      position: { x: 420, y: 100 },
      data: {
        title: "Fruit Stall",
        content: "Merchant: Best apples in the district!",
        blockType: "chat",
        choices: [
          {
            id: "mk-c2a",
            choiceKind: "chatReply",
            label: "How much for an apple?",
            npcResponse: "Three coins, friend. Firm price.",
            targetNodeId: "",
            conditions: [],
            effects: [],
          },
          {
            id: "mk-c2b",
            choiceKind: "chatReply",
            label: "They look delicious.",
            npcResponse: "Fresh picked this morning!",
            targetNodeId: "",
            conditions: [],
            effects: [],
          },
          {
            id: "mk-c3",
            choiceKind: "chatReply",
            label: "Buy an apple (3 coins)",
            playerMessage: "I'll take one.",
            npcResponse: "Pleasure doing business.",
            targetNodeId: "mk-after-buy",
            conditions: [
              { variable: "coins", operator: "greaterThanOrEqual", value: 3 },
            ],
            effects: [
              { variable: "coins", action: "subtract", value: 3 },
              { variable: "hasApple", action: "set", value: true },
            ],
          },
          {
            id: "mk-c4",
            choiceKind: "chatReply",
            label: "Politely decline",
            playerMessage: "No thanks.",
            npcResponse: "Suit yourself. Come back anytime.",
            targetNodeId: "mk-decline",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "mk-after-buy",
      type: "storyNode",
      position: { x: 780, y: 40 },
      data: {
        title: "A Good Trade",
        content:
          "The apple is cool in your hand. The merchant pockets your coins with a grin.\nYou still have a little left for later.",
        blockType: "narrative",
        choices: [
          {
            id: "mk-c5",
            label: "Return to the square",
            targetNodeId: "mk-square",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "mk-decline",
      type: "storyNode",
      position: { x: 780, y: 200 },
      data: {
        title: "Walking On",
        content:
          "You tip your head in thanks and move along.\nThe merchant calls after the next customer without missing a beat.",
        blockType: "narrative",
        choices: [
          {
            id: "mk-c6",
            label: "Return to the square",
            targetNodeId: "mk-square",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "mk-square",
      type: "storyNode",
      position: { x: 420, y: 300 },
      data: {
        title: "Back in the Square",
        content:
          "The noise of the market wraps around you again.\nYou could leave, or take one more lap while you still have energy.",
        blockType: "narrative",
        choices: [
          {
            id: "mk-c7",
            label: "Leave the market",
            targetNodeId: "mk-home",
            conditions: [],
            effects: [],
          },
          {
            id: "mk-c8",
            label: "Try the fruit stall again",
            targetNodeId: "mk-stall",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "mk-home",
      type: "storyNode",
      position: { x: 780, y: 380 },
      data: {
        title: "Home Again",
        content:
          "You close the door on the day’s noise.\nWhatever you carried home—coins, fruit, or just a story—it was enough.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
  ],
} satisfies DemoStoryPayload;

export default marketDayStory;
