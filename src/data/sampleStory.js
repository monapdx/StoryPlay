const sampleStory = {
  variables: {
    health: 10,
    gold: 3,
    hasKey: false,
  },

  nodes: [
    {
      id: "1",
      type: "storyNode",
      position: { x: 80, y: 120 },
      data: {
        title: "Wake Up",
        content:
          "You wake up in a locked room.\nA phone glows on the floor beside the bed.",
        blockType: "narrative",
        choices: [
          {
            id: "c1",
            label: "Check phone",
            targetNodeId: "2",
            conditions: [],
            effects: [],
          },
          {
            id: "c2",
            label: "Search desk",
            targetNodeId: "3",
            conditions: [],
            effects: [
              { variable: "hasKey", action: "set", value: true },
            ],
          },
          {
            id: "c3",
            label: "Open locked door",
            targetNodeId: "4",
            conditions: [
              { variable: "hasKey", operator: "equals", value: true },
            ],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },

    {
      id: "2",
      type: "storyNode",
      position: { x: 430, y: 60 },
      data: {
        title: "Check Phone",
        content:
          "Unknown Number: The key is closer than you think.\nYou: Who is this?\nUnknown Number: Don't trust the desk drawer.",
        blockType: "chat",
        choices: [
          {
            id: "c4",
            label: "Go back",
            targetNodeId: "1",
            conditions: [],
            effects: [],
          },
          {
            id: "c6",
            label: "Search desk anyway",
            targetNodeId: "3",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },

    {
      id: "3",
      type: "storyNode",
      position: { x: 430, y: 260 },
      data: {
        title: "Search Desk",
        content:
          "You search the desk while footsteps get closer in the hall.",
        blockType: "timed",
        timerSeconds: 8,
        timeoutTargetNodeId: "5",
        timeoutEffects: [
          { variable: "health", action: "subtract", value: 2 },
        ],
        choices: [
          {
            id: "c5",
            label: "Use key on the door",
            targetNodeId: "4",
            conditions: [
              { variable: "hasKey", operator: "equals", value: true },
            ],
            effects: [],
          },
          {
            id: "c7",
            label: "Hide under the bed",
            targetNodeId: "5",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },

    {
      id: "4",
      type: "storyNode",
      position: { x: 780, y: 120 },
      data: {
        title: "Escape",
        content: "The key turns.\nThe door clicks open.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },

    {
      id: "5",
      type: "storyNode",
      position: { x: 780, y: 300 },
      data: {
        title: "Too Late",
        content:
          "The footsteps stop outside.\nThe handle turns before you can decide what to do.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
  ],
};

export default sampleStory;