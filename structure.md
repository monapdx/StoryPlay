# Repository structure

Canonical layout after the TypeScript migration. Application source under `src/` is TypeScript (`.ts` / `.tsx`). There are **no** remaining `.js` / `.jsx` modules under `src/`.

Planned concepts that are **not** present as modules (ideas only): standalone preview widgets (health/gold/countdown/chat), a separate `NodeBehaviorRenderer`, empty stub editors (`ChoiceEditor`, `WidgetEditor`, etc.), and a legacy `storySamples/` catalog. Live demos live under `src/data/` and `src/data/demo/`.

```
StoryPlay/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── AGENTS.md
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── schemas/
│   └── storyplay-export.v1.schema.json
├── scripts/
│   ├── deploy-itch.mjs
│   ├── package-itch-zip.mjs
│   └── verify-itch-embed.mjs
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── style.css
│   ├── docs.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── blocks/
│   │   │   ├── ChoiceWeightingBlockView.tsx
│   │   │   ├── MiniGameTest.tsx
│   │   │   ├── PersuasionBlockView.tsx
│   │   │   └── TraitPickerBlockView.tsx
│   │   ├── canvas/
│   │   │   ├── NodeSearchBar.tsx
│   │   │   ├── StoryCanvas.tsx
│   │   │   ├── StoryEdge.tsx
│   │   │   └── StoryNode.tsx
│   │   ├── docs/
│   │   │   └── DocumentationScreen.tsx
│   │   ├── editor/
│   │   │   ├── ChoiceConditionsEditor.tsx
│   │   │   ├── ChoiceEffectsEditor.tsx
│   │   │   ├── ChoiceRow.tsx
│   │   │   ├── ChoicesEditor.tsx
│   │   │   ├── ImportProjectModal.tsx
│   │   │   ├── ReferenceTextarea.tsx
│   │   │   ├── SidebarEditor.tsx
│   │   │   ├── StoryDiagnostics.tsx
│   │   │   ├── UndoRedoButtons.tsx
│   │   │   ├── VariableEditor.tsx
│   │   │   └── VariablesScreen.tsx
│   │   ├── entities/
│   │   │   ├── CharacterManager.tsx
│   │   │   └── CharactersScreen.tsx
│   │   ├── minigame/
│   │   │   ├── MiniGameConfigPanel.tsx
│   │   │   ├── MiniGameEditor.tsx
│   │   │   ├── MiniGameEditorHeader.tsx
│   │   │   ├── MiniGameEditorInspector.tsx
│   │   │   ├── MiniGameEditorPreview.tsx
│   │   │   ├── MiniGameEditorShell.tsx
│   │   │   ├── MiniGameEditorSidebar.tsx
│   │   │   ├── MiniGameLogicPanel.tsx
│   │   │   ├── MiniGamePreview.tsx
│   │   │   └── MiniGameToolbar.tsx
│   │   ├── onboarding/
│   │   │   ├── EditorEmptyState.tsx
│   │   │   ├── OnboardingTour.tsx
│   │   │   └── StarterTemplateModal.tsx
│   │   ├── player/
│   │   │   └── PlayerPage.tsx
│   │   └── preview/
│   │       ├── ChatBubbleContent.tsx
│   │       ├── ChatReplyPicker.tsx
│   │       ├── PlayChoiceButton.tsx
│   │       ├── PlayerStatsPanel.tsx
│   │       └── StoryPreview.tsx
│   ├── data/
│   │   ├── demo/
│   │   │   ├── crossroadsStory.ts
│   │   │   ├── guildAuditionStory.ts
│   │   │   ├── guildVariableMeta.ts
│   │   │   ├── marketDayStory.ts
│   │   │   └── timedNerveStory.ts
│   │   ├── docs/
│   │   │   ├── catalog.ts
│   │   │   └── sections.tsx
│   │   ├── demoStoriesCatalog.ts
│   │   ├── onboardingDemo.ts
│   │   ├── onboardingSteps.ts
│   │   └── sampleStory.ts
│   ├── hooks/
│   │   ├── useHashRoute.ts
│   │   ├── useMiniGameEditorState.ts
│   │   ├── useOnboarding.ts
│   │   ├── usePlayState.ts
│   │   └── useStoryState.ts
│   ├── types/
│   │   ├── choiceKinds.ts
│   │   ├── demoStories.ts
│   │   ├── minigameExamples.ts
│   │   ├── minigames.ts
│   │   ├── onboarding.ts
│   │   ├── story.ts
│   │   ├── storyBlocks.ts
│   │   └── storyCore.ts
│   └── utils/
│       ├── blankStory.ts
│       ├── chatPlay.ts
│       ├── choiceKinds.ts
│       ├── choicePathGenerator.ts
│       ├── graphHealth.ts
│       ├── hashRoute.ts
│       ├── importStoryPlayProject.ts
│       ├── miniGameFromNode.ts
│       ├── nodeGraphLinks.ts
│       ├── nodeHelpers.ts
│       ├── onboardingPosition.ts
│       ├── onboardingStorage.ts
│       ├── playEntryNode.ts
│       ├── playerVariableStats.ts
│       ├── projectMigrations.ts
│       ├── projectSchema.ts
│       ├── serializeStoryPlayExport.ts
│       ├── storyEntities.ts
│       ├── storyLogic.ts
│       ├── storyPreviewStorage.ts
│       ├── storyProjectStorage.ts
│       ├── storyReferences.ts
│       ├── storyUndoHistory.ts
│       └── storyVariables.ts
├── structure.md
├── structure.json
├── tree.txt
└── vite.config.js
```
