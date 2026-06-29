import { useEffect, useMemo, useRef, useState } from "react";
import StoryCanvas from "./components/canvas/StoryCanvas";
import SidebarEditor from "./components/editor/SidebarEditor";
import VariablesScreen from "./components/editor/VariablesScreen";
import CharactersScreen from "./components/entities/CharactersScreen";
import StoryPreview from "./components/preview/StoryPreview";
import MiniGameEditor from "./components/minigame/MiniGameEditor";
import EditorEmptyState from "./components/onboarding/EditorEmptyState";
import OnboardingTour from "./components/onboarding/OnboardingTour";
import StarterTemplateModal from "./components/onboarding/StarterTemplateModal";
import ImportProjectModal from "./components/editor/ImportProjectModal";
import useStoryState from "./hooks/useStoryState";
import usePlayState from "./hooks/usePlayState";
import useOnboarding from "./hooks/useOnboarding";
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
import {
  buildMiniGameFromSelectedNode,
  isSupportedMiniGameBlock,
} from "./utils/miniGameFromNode";
import {
  prepareStoryPlayImport,
  readProjectFileAsText,
} from "./utils/importStoryPlayProject";

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
        characters: s.characters,
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
        characters: s.characters,
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
        characters: s.characters,
        selectedNodeId: s.selectedNodeId,
      });
    }, 1500);

    return () => window.clearTimeout(id);
  }, [story.nodes, story.variables, story.characters, story.selectedNodeId, previewSyncTick]);

  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState("editor");
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const importFileInputRef = useRef(null);

  const onboarding = useOnboarding();
  const onboardingAutoStartedRef = useRef(false);

  useEffect(() => {
    if (onboardingAutoStartedRef.current) return;
    if (!onboarding.shouldAutoStart) return;
    if (activeScreen !== "editor") return;

    onboardingAutoStartedRef.current = true;
    const timerId = window.setTimeout(() => onboarding.start(), 500);
    return () => window.clearTimeout(timerId);
  }, [activeScreen, onboarding.shouldAutoStart, onboarding.start]);

  const selectedMiniGame = useMemo(() => {
    if (!story.selectedNode || !isSupportedMiniGameBlock(story.selectedNode)) {
      return null;
    }

    return buildMiniGameFromSelectedNode(story.selectedNode);
  }, [story.selectedNode]);

  const canOpenMiniGameEditor = Boolean(selectedMiniGame);

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

  function storyHasContent() {
    return (
      story.nodes.length > 0 ||
      Object.keys(story.variables || {}).length > 0 ||
      (story.characters || []).length > 0
    );
  }

  function requestLoadTemplate(storyId) {
    if (!storyId) return;

    if (storyId === story.activeDemoStoryId) {
      setIsTemplateModalOpen(false);
      return;
    }

    if (
      storyHasContent() &&
      !window.confirm(
        "Load this example story? Your current project will be replaced."
      )
    ) {
      return;
    }

    setIsMiniGameOpen(false);
    story.loadDemoStory(storyId);
    setIsTemplateModalOpen(false);
  }

  function handleOpenTemplates() {
    setIsTemplateModalOpen(true);
  }

  function handleOpenVariablesWorkspace() {
    setActiveScreen("variables");
  }

  function handleCloseVariablesWorkspace() {
    setActiveScreen("editor");
  }

  function handleOpenCharactersWorkspace() {
    setActiveScreen("characters");
  }

  function handleCloseCharactersWorkspace() {
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
        story.updateSelectedNodeField(
          "continueNodeId",
          config.continueNodeId || ""
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
        story.updateSelectedNodeField(
          "continueNodeId",
          config.continueNodeId || ""
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
      characters: story.characters,
    });
  }

  function handleOpenImportPicker() {
    importFileInputRef.current?.click();
  }

  async function handleImportFileSelected(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    try {
      const text = await readProjectFileAsText(file);
      const result = prepareStoryPlayImport(text);
      setImportPreview(result);
    } catch (error) {
      setImportPreview({
        ok: false,
        errors: [
          error instanceof Error
            ? error.message
            : "Could not read the selected file.",
        ],
        warnings: [],
        summary: null,
        story: null,
        project: null,
      });
    }
  }

  function handleCancelImport() {
    setImportPreview(null);
  }

  function handleConfirmImport() {
    if (!importPreview?.ok || !importPreview.story) return;

    story.importStory(importPreview.story);
    saveCurrentStoryForPreview({
      nodes: importPreview.story.nodes,
      variables: importPreview.story.variables,
      characters: importPreview.story.characters,
      selectedNodeId: importPreview.story.nodes[0]?.id || null,
    });
    setPreviewSyncTick((n) => n + 1);
    setImportPreview(null);
  }

  function handlePlayInNewTab() {
    enableLivePreviewSyncForEditorTab();
    saveCurrentStoryForPreview({
      nodes: story.nodes,
      variables: story.variables,
      characters: story.characters,
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
      <StarterTemplateModal
        open={isTemplateModalOpen}
        demoStories={story.demoStories}
        activeTemplateId={story.activeDemoStoryId}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={requestLoadTemplate}
      />

      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleImportFileSelected}
      />

      <ImportProjectModal
        open={importPreview != null}
        preview={importPreview}
        onCancel={handleCancelImport}
        onConfirm={handleConfirmImport}
      />

      {activeScreen === "variables" ? (
        <VariablesScreen
          variables={story.variables}
          setVariables={story.setVariables}
          onBack={handleCloseVariablesWorkspace}
          activeTemplateLabel={getActiveTemplateLabel(story)}
          onOpenTemplates={handleOpenTemplates}
          onExport={handleExportStory}
          onImport={handleOpenImportPicker}
          onOpenMiniGameEditor={handleOpenMiniGameEditor}
          canOpenMiniGameEditor={canOpenMiniGameEditor}
          miniGameEditorTitle={miniGameEditorTitle}
        />
      ) : activeScreen === "characters" ? (
        <CharactersScreen
          characters={story.characters}
          nodes={story.nodes}
          onBack={handleCloseCharactersWorkspace}
          onAddCharacter={story.addCharacter}
          onUpdateCharacter={story.updateCharacter}
          onDeleteCharacter={story.deleteCharacter}
          onOpenTemplates={handleOpenTemplates}
          activeTemplateLabel={getActiveTemplateLabel(story)}
        />
      ) : (
        <>
          <header className="app-header">
            <div>
              <h1>StoryPlay</h1>
              <p className="app-subtitle">
                Build branching stories with interactive blocks
              </p>

              <div className="app-project-status">
                <span className="app-project-status__label">Project</span>
                <span className="app-project-status__value">
                  {getActiveTemplateLabel(story)}
                </span>
              </div>
            </div>

            <div className="app-header__actions">
              <button
                type="button"
                className="header-help-button"
                onClick={onboarding.restart}
                title="Replay the guided tour"
              >
                Tutorial
              </button>

              <button
                type="button"
                className="header-button"
                data-onboarding="templates"
                onClick={handleOpenTemplates}
                title="Browse starter example stories"
              >
                Example stories
              </button>

              <button
                type="button"
                className={[
                  "header-button",
                  isQuickPreviewOpen ? "header-button--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-onboarding="preview"
                onClick={() => setIsQuickPreviewOpen((open) => !open)}
                title="Show or hide a compact play preview beside the editor (full test: Play in new tab)"
                aria-pressed={isQuickPreviewOpen}
              >
                Preview
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handleOpenCharactersWorkspace}
                title="Manage reusable character names and references"
              >
                Characters
              </button>

              <button
                type="button"
                className="header-button"
                data-onboarding="variables"
                onClick={() => setActiveScreen("variables")}
                title="Open full-screen variables workspace"
              >
                Variables
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handlePlayInNewTab}
                title="Save to the browser, open #/play in a new tab, and keep that tab updated (debounced) while you edit in this tab after the first use"
              >
                Play in new tab
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handleOpenImportPicker}
                title="Import a previously exported StoryPlay project (.json)"
              >
                Import Project
              </button>

              <button
                type="button"
                className="header-button"
                data-onboarding="export"
                onClick={handleExportStory}
                title="Download story as StoryPlay export JSON (v1)"
              >
                Export Game
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handleOpenMiniGameEditor}
                disabled={!canOpenMiniGameEditor}
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
            <section className="panel canvas-panel" data-onboarding="canvas">
              <StoryCanvas
                {...story}
                currentPlayNodeId={play.currentPlayNodeId}
                playVariables={play.playVariables}
              />
              {story.isBlankProject && (
                <EditorEmptyState
                  onAddNode={story.addNode}
                  onOpenTutorial={onboarding.restart}
                  onOpenTemplates={handleOpenTemplates}
                />
              )}
            </section>

            <aside className="panel sidebar-panel custom-scrollbar" data-onboarding="sidebar">
              <SidebarEditor
                {...story}
                onboardingStepId={onboarding.isActive ? onboarding.step?.id : null}
                onOpenMiniGameEditor={handleOpenMiniGameEditor}
                onOpenVariables={handleOpenVariablesWorkspace}
              />
            </aside>

            <aside
              className={[
                "panel preview-panel preview-panel--dock custom-scrollbar",
                isQuickPreviewOpen ? "" : "preview-panel--dock-collapsed",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Quick preview"
              aria-hidden={!isQuickPreviewOpen}
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
              <StoryPreview
                {...story}
                {...play}
                initialVariables={story.variables}
                variant="dock"
              />
            </aside>
          </main>

          {onboarding.isActive && activeScreen === "editor" && (
            <OnboardingTour
              step={onboarding.step}
              stepIndex={onboarding.stepIndex}
              stepCount={onboarding.stepCount}
              isLastStep={onboarding.isLastStep}
              onNext={onboarding.next}
              onBack={onboarding.back}
              onSkip={onboarding.skip}
            />
          )}
        </>
      )}
    </div>
  );
}

function getActiveTemplateLabel(story) {
  if (!story.activeDemoStoryId) {
    return story.isBlankProject ? "Blank project" : "Custom project";
  }

  const entry = story.demoStories.find((item) => item.id === story.activeDemoStoryId);
  return entry ? entry.label : "Example story";
}

export default function App() {
  const route = useHashRoute();
  if (route === "play") {
    return <PlayerPage />;
  }
  return <EditorApp />;
}