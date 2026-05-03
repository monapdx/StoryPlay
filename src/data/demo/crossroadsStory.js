/** Simple linear fork: one decision, two endings. */
const crossroadsStory = {
  variables: {},

  nodes: [
    {
      id: "cr-start",
      type: "storyNode",
      position: { x: 120, y: 160 },
      data: {
        title: "The Crossroads",
        content:
          "The path splits. Moss covers the left trail; the right is sun-baked stone.\nNo signpost. You go…",
        blockType: "narrative",
        choices: [
          {
            id: "cr-c1",
            label: "Take the mossy path",
            targetNodeId: "cr-left",
            conditions: [],
            effects: [],
          },
          {
            id: "cr-c2",
            label: "Take the sunlit path",
            targetNodeId: "cr-right",
            conditions: [],
            effects: [],
          },
        ],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "cr-left",
      type: "storyNode",
      position: { x: 520, y: 80 },
      data: {
        title: "Quiet Hollow",
        content:
          "The air cools. You hear water somewhere below.\nWhatever follows this road, it prefers shade.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
    {
      id: "cr-right",
      type: "storyNode",
      position: { x: 520, y: 260 },
      data: {
        title: "High Ridge",
        content:
          "Wind scrapes the stone. In the distance, a line of birds rises like punctuation.\nThe open sky feels like an answer.",
        blockType: "ending",
        choices: [],
        enterEffects: [],
        graphIssues: [],
      },
    },
  ],
};

export default crossroadsStory;
