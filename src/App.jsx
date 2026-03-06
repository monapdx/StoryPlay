import StoryCanvas from "./components/canvas/StoryCanvas";
import SidebarEditor from "./components/editor/SidebarEditor";
import StoryPreview from "./components/preview/StoryPreview";
import useStoryState from "./hooks/useStoryState";
import usePlayState from "./hooks/usePlayState";

export default function App() {
  const story = useStoryState();

  const play = usePlayState(
    story.nodes,
    story.selectedNodeId,
    story.variables
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>StoryPlay</h1>
          <p className="app-subtitle">
            Build branching stories with interactive blocks
          </p>
        </div>
      </header>

      <main className="app-workspace">
        <section className="panel canvas-panel">
          <StoryCanvas {...story} {...play} />
        </section>

        <aside className="panel sidebar-panel">
          <SidebarEditor {...story} />
        </aside>

        <aside className="panel preview-panel">
          <StoryPreview {...story} {...play} />
        </aside>
      </main>
    </div>
  );
}