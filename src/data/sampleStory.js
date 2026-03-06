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
            effects: [{ variable: "hasKey", action: "set", value: true }],
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
      },
    },
    {
      id: "2",
      type: "storyNode",
      position: { x: 430, y: 60 },
      data: {
        title: "Check Phone",
        content: "A message reads: 'The key is closer than you think.'",
        blockType: "chat",
        choices: [
          {
            id: "c4",
            label: "Go back",
            targetNodeId: "1",
            conditions: [],
            effects: [],
          },
        ],
      },
    },
    {
      id: "3",
      type: "storyNode",
      position: { x: 430, y: 260 },
      data: {
        title: "Search Desk",
        content: "You find a tiny brass key inside the desk drawer.",
        blockType: "timed",
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
        ],
      },
    },
    {
      id: "4",
      type: "storyNode",
      position: { x: 780, y: 160 },
      data: {
        title: "Escape",
        content: "The key turns. The door clicks open.",
        blockType: "ending",
        choices: [],
      },
    },
  ],
};

export default sampleStory;