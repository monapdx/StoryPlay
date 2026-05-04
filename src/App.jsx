import { useEffect, useMemo, useRef, useState } from "react";
import StoryCanvas from "./components/canvas/StoryCanvas";
import SidebarEditor from "./components/editor/SidebarEditor";
import VariablesScreen from "./components/editor/VariablesScreen";
import StoryPreview from "./components/preview/StoryPreview";
import MiniGameEditor from "./components/minigame/MiniGameEditor";
import useStoryState from "./hooks/useStoryState";
import usePlayState from "./hooks/usePlayState";
import {
  downloadStoryPlayExportV1,
  serializeStoryPlayExportV1,
} from "./utils/serializeStoryPlayExport";
import {
  enableLivePreviewSyncForEditorTab,
  isLivePreviewSyncEnabled,
  saveCurrentStoryForPreview,
} from "./utils/storyPreviewStorage";
import useHashRoute from "./hooks/useHashRoute";
import PlayerPage from "./components/player/PlayerPage";

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

function EditorApp() {
  const story = useStoryState();
  const storyRef = useRef(story);
  storyRef.current = story;

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    function getExport() {
      const s = storyRef.current;
      return serializeStoryPlayExportV1({
        nodes: s.nodes,
        variables: s.variables,
      });
    }

    window.__storyplayLogExport = () => {
      const payload = getExport();
      console.log(JSON.stringify(payload, null, 2));
      return payload;
    };

    window.__storyplayDownloadExport = () => {
      const s = storyRef.current;
      return downloadStoryPlayExportV1({
        nodes: s.nodes,
        variables: s.variables,
      });
    };

    return () => {
      delete window.__storyplayLogExport;
      delete window.__storyplayDownloadExport;
    };
  }, []);

  const play = usePlayState(
    story.nodes,
    story.selectedNodeId,
    story.variables
  );

  const [previewSyncTick, setPreviewSyncTick] = useState(0);

  /** After first "Play in new tab", push debounced snapshot updates so open #/play tabs stay in sync. */
  useEffect(() => {
    if (!isLivePreviewSyncEnabled()) return undefined;

    const id = window.setTimeout(() => {
      const s = storyRef.current;
      saveCurrentStoryForPreview({
        nodes: s.nodes,
        variables: s.variables,
        selectedNodeId: s.selectedNodeId,
      });
    }, 1500);

    return () => window.clearTimeout(id);
  }, [story.nodes, story.variables, story.selectedNodeId, previewSyncTick]);

  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState("editor");
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);

  const selectedMiniGame = useMemo(() => {
    if (!story.selectedNode || !isSupportedMiniGameBlock(story.selectedNode)) {
      return null;
    }

    return buildMiniGameFromSelectedNode(story.selectedNode);
  }, [story.selectedNode]);

  const canOpenMiniGameEditor =
    Boolean(story.selectedNode) &&
    isSupportedMiniGameBlock(story.selectedNode);

  const miniGameEditorTitle = useMemo(() => {
    if (canOpenMiniGameEditor) {
      return "Open mini-game editor for selected block";
    }
    if (story.selectedNode) {
      return "Selected node is not a supported mini-game block";
    }
    return "Select a mini-game block first (return to the editor)";
  }, [canOpenMiniGameEditor, story.selectedNode]);

  function handleOpenMiniGameEditor() {
    if (!canOpenMiniGameEditor) return;
    setActiveScreen("editor");
    setIsMiniGameOpen(true);
  }

  function handleDemoStoryChange(event) {
    const storyId = event.target.value;
    if (storyId === story.activeDemoStoryId) return;

    if (
      story.isDemoDirty &&
      !window.confirm(
        "Switch demo story? Your edits to the current graph and variables will be replaced."
      )
    ) {
      return;
    }

    setIsMiniGameOpen(false);
    story.loadDemoStory(storyId);
  }

  function handleOpenVariablesWorkspace() {
    setActiveScreen("variables");
  }

  function handleCloseVariablesWorkspace() {
    setActiveScreen("editor");
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

  function handleExportStory() {
    downloadStoryPlayExportV1({
      nodes: story.nodes,
      variables: story.variables,
    });
  }

  function handlePlayInNewTab() {
    enableLivePreviewSyncForEditorTab();
    saveCurrentStoryForPreview({
      nodes: story.nodes,
      variables: story.variables,
      selectedNodeId: story.selectedNodeId,
    });
    setPreviewSyncTick((n) => n + 1);
    window.open(
      `${window.location.origin}${window.location.pathname}#/play`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="app-shell">
      {activeScreen === "variables" ? (
        <VariablesScreen
          variables={story.variables}
          setVariables={story.setVariables}
          onBack={handleCloseVariablesWorkspace}
          demoStories={story.demoStories}
          activeDemoStoryId={story.activeDemoStoryId}
          onDemoStoryChange={handleDemoStoryChange}
          onExport={handleExportStory}
          onOpenMiniGameEditor={handleOpenMiniGameEditor}
          canOpenMiniGameEditor={canOpenMiniGameEditor}
          miniGameEditorTitle={miniGameEditorTitle}
        />
      ) : (
        <>
          <header className="app-header">
            <div>
              <h1>StoryPlay</h1>
              <p className="app-subtitle">
                Build branching stories with interactive blocks
              </p>

              <div
                className="app-story-switcher"
                title="Loads a built-in demo into the editor and preview. If you changed the graph or variables, you will be asked to confirm before switching."
              >
                <label htmlFor="demo-story-select" className="app-story-switcher-label">
                  Demo story
                </label>
                <select
                  id="demo-story-select"
                  className="form-select app-story-switcher-select"
                  value={story.activeDemoStoryId}
                  onChange={handleDemoStoryChange}
                >
                  {story.demoStories.map((entry) => (
                    <option key={entry.id} value={entry.id} title={entry.blurb}>
                      [{entry.tier}] {entry.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                type="button"
                onClick={() => setIsQuickPreviewOpen((open) => !open)}
                style={{
                  ...styles.headerButton,
                  ...(isQuickPreviewOpen ? styles.headerButtonActive : null),
                }}
                title="Show or hide a compact play preview beside the editor (full test: Play in new tab)"
                aria-pressed={isQuickPreviewOpen}
              >
                Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen("variables")}
                style={styles.headerButton}
                title="Open full-screen variables workspace"
              >
                Variables
              </button>

              <button
                type="button"
                onClick={handlePlayInNewTab}
                style={styles.headerButton}
                title="Save to the browser, open #/play in a new tab, and keep that tab updated (debounced) while you edit in this tab after the first use"
              >
                Play in new tab
              </button>

              <button
                type="button"
                onClick={handleExportStory}
                style={styles.headerButton}
                title="Download story as StoryPlay export JSON (v1)"
              >
                Export Game
              </button>

              <button
                type="button"
                onClick={handleOpenMiniGameEditor}
                disabled={!canOpenMiniGameEditor}
                style={{
                  ...styles.headerButton,
                  ...(!canOpenMiniGameEditor ? styles.headerButtonDisabled : null),
                }}
                title={miniGameEditorTitle}
              >
                Open Mini-Game Editor
              </button>
            </div>
          </header>

          <main
            className={[
              "app-workspace",
              isQuickPreviewOpen ? "app-workspace--with-preview" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
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
                onOpenVariables={handleOpenVariablesWorkspace}
              />
            </aside>

            {isQuickPreviewOpen && (
              <aside
                className="panel preview-panel preview-panel--dock"
                aria-label="Quick preview"
              >
                <div className="preview-dock-head">
                  <span className="preview-dock-head-title">Quick preview</span>
                  <button
                    type="button"
                    className="toolbar-button preview-dock-close"
                    onClick={() => setIsQuickPreviewOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <StoryPreview {...story} {...play} variant="dock" />
              </aside>
            )}
          </main>
        </>
      )}
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
  headerButtonActive: {
    borderColor: "rgba(129, 140, 248, 0.65)",
    background: "rgba(99, 102, 241, 0.22)",
    boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
  },
};

export default function App() {
  const route = useHashRoute();
  if (route === "play") {
    return <PlayerPage />;
  }
  return <EditorApp />;
}