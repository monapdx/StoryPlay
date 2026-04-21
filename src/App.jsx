import { useMemo, useState } from "react";
import StoryCanvas from "./components/canvas/StoryCanvas";
import SidebarEditor from "./components/editor/SidebarEditor";
import StoryPreview from "./components/preview/StoryPreview";
import MiniGameEditor from "./components/minigame/MiniGameEditor";
import useStoryState from "./hooks/useStoryState";
import usePlayState from "./hooks/usePlayState";

function buildMiniGameFromSelectedNode(selectedNode) {
  if (!selectedNode) return null;

  const data = selectedNode.data || {};
  const type = data.blockType || "traitPicker";

  switch (type) {
    case "traitPicker":
      return {
        title: data.title || "Trait Picker",
        type,
        prompt: data.content || "",
        config: {
          options: data.options || [],
          minSelections: data.minSelections ?? 0,
          maxSelections: data.maxSelections ?? 2,
          traitListVariable: data.traitListVariable || "",
        },
      };

    case "persuasion":
      return {
        title: data.title || "Persuasion",
        type,
        prompt: data.content || "",
        config: {
          targetName: data.targetName || "",
          startScore: data.startScore ?? 50,
          minScore: data.minScore ?? 0,
          maxScore: data.maxScore ?? 100,
          threshold: data.threshold ?? 75,
          maxTurns: data.maxTurns ?? 3,
          visibleMeter: data.visibleMeter ?? true,
          scoreVariable: data.scoreVariable || "",
          successVariable: data.successVariable || "",
          successNodeId: data.successNodeId || "",
          failureNodeId: data.failureNodeId || "",
          choices: data.choices || [],
        },
      };

    case "choiceWeighting":
      return {
        title: data.title || "Choice Weighting",
        type,
        prompt: data.content || "",
        config: {
          options: data.options || [],
          totalPoints: data.totalPoints ?? 10,
          variablePrefix: data.variablePrefix || "",
          resultVariable: data.resultVariable || "",
          lockExactTotal: data.lockExactTotal ?? true,
        },
      };

    default:
      return {
        title: data.title || "Mini-Game",
        type: "traitPicker",
        prompt: data.content || "",
        config: {
          options: [],
          minSelections: 0,
          maxSelections: 2,
          traitListVariable: "",
        },
      };
  }
}

function isSupportedMiniGameBlock(node) {
  const type = node?.data?.blockType;
  return (
    type === "traitPicker" ||
    type === "persuasion" ||
    type === "choiceWeighting"
  );
}

export default function App() {
  const story = useStoryState();

  const play = usePlayState(
    story.nodes,
    story.selectedNodeId,
    story.variables
  );

  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);

  const selectedMiniGame = useMemo(() => {
    if (!story.selectedNode || !isSupportedMiniGameBlock(story.selectedNode)) {
      return null;
    }

    return buildMiniGameFromSelectedNode(story.selectedNode);
  }, [story.selectedNode]);

  const canOpenMiniGameEditor =
    Boolean(story.selectedNode) &&
    isSupportedMiniGameBlock(story.selectedNode);

  function handleOpenMiniGameEditor() {
    if (!canOpenMiniGameEditor) return;
    setIsMiniGameOpen(true);
  }

  function handleCloseMiniGameEditor() {
    setIsMiniGameOpen(false);
  }

  function handleSaveMiniGame(updatedMiniGame) {
    if (!story.selectedNode || !updatedMiniGame) {
      setIsMiniGameOpen(false);
      return;
    }

    const { type, title, prompt, config } = updatedMiniGame;

    story.updateSelectedNodeField("blockType", type);
    story.updateSelectedNodeField("title", title || "Mini-Game");
    story.updateSelectedNodeField("content", prompt || "");

    switch (type) {
      case "traitPicker":
        story.updateSelectedNodeField("options", config.options || []);
        story.updateSelectedNodeField(
          "minSelections",
          config.minSelections ?? 0
        );
        story.updateSelectedNodeField(
          "maxSelections",
          config.maxSelections ?? 2
        );
        story.updateSelectedNodeField(
          "traitListVariable",
          config.traitListVariable || ""
        );
        break;

      case "persuasion":
        story.updateSelectedNodeField("targetName", config.targetName || "");
        story.updateSelectedNodeField("startScore", config.startScore ?? 50);
        story.updateSelectedNodeField("minScore", config.minScore ?? 0);
        story.updateSelectedNodeField("maxScore", config.maxScore ?? 100);
        story.updateSelectedNodeField("threshold", config.threshold ?? 75);
        story.updateSelectedNodeField("maxTurns", config.maxTurns ?? 3);
        story.updateSelectedNodeField(
          "visibleMeter",
          config.visibleMeter ?? true
        );
        story.updateSelectedNodeField(
          "scoreVariable",
          config.scoreVariable || ""
        );
        story.updateSelectedNodeField(
          "successVariable",
          config.successVariable || ""
        );
        story.updateSelectedNodeField(
          "successNodeId",
          config.successNodeId || ""
        );
        story.updateSelectedNodeField(
          "failureNodeId",
          config.failureNodeId || ""
        );
        story.updateSelectedNodeField("choices", config.choices || []);
        break;

      case "choiceWeighting":
        story.updateSelectedNodeField("options", config.options || []);
        story.updateSelectedNodeField("totalPoints", config.totalPoints ?? 10);
        story.updateSelectedNodeField(
          "variablePrefix",
          config.variablePrefix || ""
        );
        story.updateSelectedNodeField(
          "resultVariable",
          config.resultVariable || ""
        );
        story.updateSelectedNodeField(
          "lockExactTotal",
          config.lockExactTotal ?? true
        );
        break;

      default:
        break;
    }

    setIsMiniGameOpen(false);
  }

  if (isMiniGameOpen && selectedMiniGame) {
    return (
      <MiniGameEditor
        open={isMiniGameOpen}
        game={selectedMiniGame}
        nodes={story.nodes}
        onClose={handleCloseMiniGameEditor}
        onSave={handleSaveMiniGame}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>StoryPlay</h1>
          <p className="app-subtitle">
            Build branching stories with interactive blocks
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={handleOpenMiniGameEditor}
            disabled={!canOpenMiniGameEditor}
            style={{
              ...styles.headerButton,
              ...(!canOpenMiniGameEditor ? styles.headerButtonDisabled : null),
            }}
            title={
              canOpenMiniGameEditor
                ? "Open mini-game editor for selected block"
                : story.selectedNode
                  ? "Selected node is not a supported mini-game block"
                  : "Select a mini-game block first"
            }
          >
            Open Mini-Game Editor
          </button>
        </div>
      </header>

      <main className="app-workspace">
        <section className="panel canvas-panel">
          <StoryCanvas
            {...story}
            currentPlayNodeId={play.currentPlayNodeId}
            playVariables={play.playVariables}
          />
        </section>

        <aside className="panel sidebar-panel">
          <SidebarEditor
            {...story}
            onOpenMiniGameEditor={handleOpenMiniGameEditor}
          />
        </aside>

        <aside className="panel preview-panel">
          <StoryPreview {...story} {...play} />
        </aside>
      </main>
    </div>
  );
}

const styles = {
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
  },
  headerButton: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  headerButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};