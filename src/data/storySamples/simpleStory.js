const sampleStory = {
  variables: {
    health: 10,
    gold: 0,
    hasKey: false,
  },

  nodes: [
    {
      id: "1",
      type: "storyNode",
      position: { x: 80, y: 120 },
      data: {
        title: "Story Start",
        content:
          "This is the beginning of your story.",
        blockType: "narrative",
        choices: [
          {
            id: "c1",
            label: "Add a narrative block",
            targetNodeId: "2",
            conditions: [],
            effects: [],
          },
          {
            id: "c2",
            label: "Add a chat block",
            targetNodeId: "3",
            conditions: [],
            effects: [],
          },
          {
            id: "c3",
            label: "Add a timed block",
            targetNodeId: "4",
            conditions: [],
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
        title: "Chat",
        content:
          "Unknown Number: This is an incoming text message.\nYou: Who is this?\nUnknown Number: You tell me!",
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
        title: "Timed",
        content:
          "This is a timed task. When the time runs out, you lose!",
        blockType: "timed",
        timerSeconds: 30,
        timeoutTargetNodeId: "5",
        timeoutEffects: [
          { variable: "health", action: "subtract", value: 2 },
        ],
        choices: [
          {
            id: "c5",
            label: "Figure it out",
            targetNodeId: "4",
            conditions: [
              { variable: "hasKey", operator: "equals", value: true },
            ],
            effects: [],
          },
          {
            id: "c7",
            label: "Give up",
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