/** Moderate: timed block + variable drain on timeout. */
const timedNerveStory = {
  variables: {
    calm: 10,
  },

  nodes: [
    {
      id: "tn-start",
      type: "storyNode",
      position: { x: 80, y: 140 },
      data: {
        title: "Before the Bell",
        content:
          "The crowd hushes. One bell means begin.\nYou steady your breathing—this is only practice, you tell yourself.",
        blockType: "narrative",
        choices: [
          {
            id: "tn-c1",
            label: "Step up to the line",
            targetNodeId: "tn-timed",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "tn-timed",
      type: "storyNode",
      position: { x: 440, y: 140 },
      data: {
        title: "Hold Still",
        content:
          "A chalk mark. A judge with a watch.\nHold your form until the signal—or bail out early if you shake.",
        blockType: "timed",
        timerSeconds: 6,
        timeoutTargetNodeId: "tn-timeout",
        timeoutEffects: [{ variable: "calm", action: "subtract", value: 3 }],
        choices: [
          {
            id: "tn-c2",
            label: "Break early (safe)",
            targetNodeId: "tn-safe",
            conditions: [],
            effects: [{ variable: "calm", action: "subtract", value: 1 }],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "tn-timeout",
      type: "storyNode",
      position: { x: 800, y: 60 },
      data: {
        title: "Time Called",
        content:
          "The bell cuts through your focus.\nYou held longer than you thought—but not without cost.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "tn-safe",
      type: "storyNode",
      position: { x: 800, y: 220 },
      data: {
        title: "Clean Exit",
        content:
          "You step back before the last second.\nThe judge marks something you cannot read. Still: you are still standing.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
  ],
};

export default timedNerveStory;
