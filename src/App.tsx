import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
} from "react";
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
import useStoryState, {
  type DemoStoryCatalogEntry,
  type UseStoryStateResult,
} from "./hooks/useStoryState";
import usePlayState, { type UsePlayStateResult } from "./hooks/usePlayState";
import useOnboarding, { type UseOnboardingResult } from "./hooks/useOnboarding";
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
import DocumentationScreen from "./components/docs/DocumentationScreen";
import { setDocsHash } from "./utils/hashRoute";
import {
  buildMiniGameFromSelectedNode,
  isSupportedMiniGameBlock,
} from "./utils/miniGameFromNode";
import {
  prepareStoryPlayImport,
  readProjectFileAsText,
  type PrepareStoryPlayImportResult,
} from "./utils/importStoryPlayProject";
import type { MiniGameEditorDraft } from "./hooks/useMiniGameEditorState";
import type { OnboardingStep } from "./types/onboarding";
import type {
  StoryCharacter,
  StoryNode,
  StoryVariables,
  VariableMetaMap,
} from "./types/story";

declare global {
  interface Window {
    __storyplayLogExport?: () => ReturnType<typeof serializeStoryPlayExportV1>;
    __storyplayDownloadExport?: () => ReturnType<
      typeof downloadStoryPlayExportV1
    >;
  }
}

type EditorActiveScreen = "editor" | "variables" | "characters";

/**
 * App-side props for still-JS StoryCanvas. allowJs infers `characters = []` as
 * `never[]`, which rejects StoryCharacter[].
 */
type StoryCanvasAppProps = UseStoryStateResult & {
  currentPlayNodeId: UsePlayStateResult["currentPlayNodeId"];
  playVariables: StoryVariables;
};

/**
 * App-side props for still-JS SidebarEditor. allowJs infers
 * `onboardingStepId = null` as only `null`, rejecting real step id strings.
 */
type SidebarEditorAppProps = UseStoryStateResult & {
  onboardingStepId?: string | null;
  onOpenMiniGameEditor?: () => void;
  onOpenVariables?: () => void;
};

/** App-side props for still-JS DocumentationScreen (`sectionId = null` inference). */
type DocumentationScreenAppProps = {
  sectionId?: string | null;
};

type StarterTemplateModalAppProps = {
  open: boolean;
  demoStories: DemoStoryCatalogEntry[];
  activeTemplateId: string | null;
  onClose: () => void;
  onSelectTemplate: (storyId: string) => void;
};

type ImportProjectModalAppProps = {
  open: boolean;
  preview: PrepareStoryPlayImportResult | null;
  onCancel: () => void;
  onConfirm: () => void;
};

type VariablesScreenAppProps = {
  variables: StoryVariables;
  setVariables: UseStoryStateResult["setVariables"];
  variableMeta: VariableMetaMap;
  setVariableMeta: UseStoryStateResult["setVariableMeta"];
  onBack: () => void;
  activeTemplateLabel: string;
  onOpenTemplates: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenMiniGameEditor: () => void;
  canOpenMiniGameEditor: boolean;
  miniGameEditorTitle: string;
};

type CharactersScreenAppProps = {
  characters: StoryCharacter[];
  nodes: StoryNode[];
  onBack: () => void;
  onAddCharacter: UseStoryStateResult["addCharacter"];
  onUpdateCharacter: UseStoryStateResult["updateCharacter"];
  onDeleteCharacter: UseStoryStateResult["deleteCharacter"];
  onOpenTemplates: () => void;
  activeTemplateLabel: string;
};

type OnboardingTourAppProps = {
  step: OnboardingStep | null;
  stepIndex: number;
  stepCount: number;
  isLastStep: boolean;
  onNext: UseOnboardingResult["next"];
  onBack: UseOnboardingResult["back"];
  onSkip: UseOnboardingResult["skip"];
};

const StoryCanvasView = StoryCanvas as unknown as ComponentType<StoryCanvasAppProps>;
const SidebarEditorView =
  SidebarEditor as unknown as ComponentType<SidebarEditorAppProps>;
const DocumentationScreenView =
  DocumentationScreen as unknown as ComponentType<DocumentationScreenAppProps>;
const StarterTemplateModalView =
  StarterTemplateModal as unknown as ComponentType<StarterTemplateModalAppProps>;
const ImportProjectModalView =
  ImportProjectModal as unknown as ComponentType<ImportProjectModalAppProps>;
const VariablesScreenView =
  VariablesScreen as unknown as ComponentType<VariablesScreenAppProps>;
const CharactersScreenView =
  CharactersScreen as unknown as ComponentType<CharactersScreenAppProps>;
const OnboardingTourView =
  OnboardingTour as unknown as ComponentType<OnboardingTourAppProps>;

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
        variableMeta: s.variableMeta,
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
        variableMeta: s.variableMeta,
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
        variableMeta: s.variableMeta,
        characters: s.characters,
        selectedNodeId: s.selectedNodeId,
      });
    }, 1500);

    return () => window.clearTimeout(id);
  }, [
    story.nodes,
    story.variables,
    story.variableMeta,
    story.characters,
    story.selectedNodeId,
    previewSyncTick,
  ]);

  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [activeScreen, setActiveScreen] =
    useState<EditorActiveScreen>("editor");
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [importPreview, setImportPreview] =
    useState<PrepareStoryPlayImportResult | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const onboarding = useOnboarding();
  const onboardingAutoStartedRef = useRef(false);

  useEffect(() => {
    if (isMiniGameOpen) return undefined;

    function shouldIgnoreKeyTarget(target: EventTarget | null) {
      if (!target) return false;
      const element = target as HTMLElement;
      const tag = element.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (element.isContentEditable) return true;
      return false;
    }

    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (shouldIgnoreKeyTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        story.undo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        story.redo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMiniGameOpen, story.undo, story.redo]);

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

  function requestLoadTemplate(storyId: string) {
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

  function handleSaveMiniGame(updatedMiniGame: MiniGameEditorDraft) {
    if (!story.selectedNode || !updatedMiniGame) {
      setIsMiniGameOpen(false);
      return;
    }

    story.applyMiniGameToSelectedNode(updatedMiniGame);
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
      variableMeta: story.variableMeta,
      characters: story.characters,
    });
  }

  function handleOpenImportPicker() {
    importFileInputRef.current?.click();
  }

  async function handleImportFileSelected(
    event: ChangeEvent<HTMLInputElement>
  ) {
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
      variableMeta: importPreview.story.variableMeta,
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
      variableMeta: story.variableMeta,
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
      <StarterTemplateModalView
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

      <ImportProjectModalView
        open={importPreview != null}
        preview={importPreview}
        onCancel={handleCancelImport}
        onConfirm={handleConfirmImport}
      />

      {activeScreen === "variables" ? (
        <VariablesScreenView
          variables={story.variables}
          setVariables={story.setVariables}
          variableMeta={story.variableMeta}
          setVariableMeta={story.setVariableMeta}
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
        <CharactersScreenView
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
              <p className="app-subtitle">Build Interactive Experiences Visually</p>

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
                title="Browse starter templates"
              >
                Templates
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
                title="Show or hide a compact play preview beside the editor (full test: Play)"
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
                title="Open full-screen play mode in a new tab (#/play)"
              >
                Play
              </button>

              <button
                type="button"
                className="header-button"
                onClick={() => setDocsHash()}
                title="Open StoryPlay documentation"
              >
                Documentation
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handleOpenImportPicker}
                title="Import a previously exported StoryPlay project (.json)"
              >
                Import
              </button>

              <button
                type="button"
                className="header-button"
                data-onboarding="export"
                onClick={handleExportStory}
                title="Download story as StoryPlay export JSON (v1)"
              >
                Export
              </button>

              <button
                type="button"
                className="header-button"
                onClick={handleOpenMiniGameEditor}
                disabled={!canOpenMiniGameEditor}
                title={miniGameEditorTitle}
              >
                Mini-Games
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
              <StoryCanvasView
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
              <SidebarEditorView
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
            <OnboardingTourView
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

function getActiveTemplateLabel(story: UseStoryStateResult): string {
  if (!story.activeDemoStoryId) {
    return story.isBlankProject ? "Blank project" : "Custom project";
  }

  const entry = story.demoStories.find((item) => item.id === story.activeDemoStoryId);
  return entry ? entry.label : "Example story";
}

export default function App() {
  const { route, docsSectionId } = useHashRoute();
  if (route === "play") {
    return <PlayerPage />;
  }
  if (route === "docs") {
    return <DocumentationScreenView sectionId={docsSectionId} />;
  }
  return <EditorApp />;
}
