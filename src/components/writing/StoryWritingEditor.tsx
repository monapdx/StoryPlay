import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { UseStoryStateResult } from "../../hooks/useStoryState";
import { parseChoiceDeclaration } from "../../utils/storyShorthand";
import "./StoryWritingEditor.css";
import SidebarEditor from "../editor/SidebarEditor";

export interface WritingDraft {
  draft: string; error: string; editingChoiceId: string | null; editingText: string;
  scrollTop: number; selectionStart: number; selectionEnd: number;
}
export interface WritingSession { drafts: Record<string, WritingDraft>; history: string[]; }

interface Props {
  story: UseStoryStateResult;
  onVisual: () => void;
  session: WritingSession;
  onOpenMiniGameEditor: () => void;
  onOpenVariables: () => void;
}

export default function StoryWritingEditor({ story, onVisual, session, onOpenMiniGameEditor, onOpenVariables }: Props) {
  const node = story.selectedNode;
  const nodeKey = node?.id || "";
  const cached = session.drafts[nodeKey];
  const [draft, setDraft] = useState(cached?.draft || "");
  const [error, setError] = useState(cached?.error || "");
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(cached?.editingChoiceId || null);
  const [editingText, setEditingText] = useState(cached?.editingText || "");
  const proseRef = useRef<HTMLTextAreaElement>(null);
  session.drafts[nodeKey] = { scrollTop: cached?.scrollTop || 0,
    selectionStart: cached?.selectionStart || 0, selectionEnd: cached?.selectionEnd || 0,
    draft, error, editingChoiceId, editingText };

  useLayoutEffect(() => {
    const saved = session.drafts[nodeKey];
    window.scrollTo(0, saved?.scrollTop || 0);
    proseRef.current?.setSelectionRange(saved?.selectionStart || 0, saved?.selectionEnd || 0);
    function rememberScroll() { session.drafts[nodeKey].scrollTop = window.scrollY; }
    window.addEventListener("scroll", rememberScroll);
    return () => window.removeEventListener("scroll", rememberScroll);
  }, [nodeKey, session]);

  function openNode(id: string) {
    if (id === nodeKey) return;
    if (node) session.history.push(node.id);
    story.setSelectedNodeId(id);
  }

  function goBack() {
    let id = session.history.pop();
    while (id && !story.nodes.some(item => item.id === id)) id = session.history.pop();
    if (id) story.setSelectedNodeId(id);
  }

  function addChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!node) return;
    const declaration = parseChoiceDeclaration(draft);
    if (!declaration) {
      setError("Use: ch: Choice text ---> Destination Node");
      return;
    }
    story.applyWritingChoice(node.id, declaration);
    setDraft("");
    setError("");
  }

  function saveEditedChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!node || !editingChoiceId) return;
    const declaration = parseChoiceDeclaration(editingText);
    if (!declaration) {
      setError("Use: ch: Choice text ---> Destination Node");
      return;
    }
    story.applyWritingChoice(node.id, declaration, editingChoiceId);
    setEditingChoiceId(null);
    setError("");
  }

  return (
    <main className="writing-workspace">
      <header className="app-header writing-toolbar">
        <div className="writing-heading"><span className="writing-brand">StoryPlay · Node editor</span><strong>{node?.data.title || "Select a scene"}</strong></div>
        <button className="toolbar-button" type="button" disabled={!session.history.some(id => story.nodes.some(item => item.id === id))} onClick={goBack}>Back</button>
        <button className="toolbar-button" type="button" onClick={onVisual}>Return to graph</button>
      </header>
      <div className="writing-layout">
        <section className="panel writing-page" aria-label="Write story">
          {!node ? (
            <div className="writing-empty">
              <h1>Open a node to start writing</h1>
              <p>Select a node in the graph, or create a new one.</p>
              <button className="toolbar-button" type="button" onClick={story.addNode}>Create first node</button>
            </div>
          ) : (
            <>
              <label htmlFor="writing-node-title">Node title</label>
              <input
                id="writing-node-title"
                className="form-input writing-title"
                value={node.data.title || ""}
                onChange={event => story.updateSelectedNodeField("title", event.target.value)}
              />
              <p className="writing-node-type">{node.data.blockType || "narrative"}</p>
              <label htmlFor="writing-prose">Story text</label>
              <textarea
                ref={proseRef}
                onSelect={event => {
                  session.drafts[nodeKey].selectionStart = event.currentTarget.selectionStart;
                  session.drafts[nodeKey].selectionEnd = event.currentTarget.selectionEnd;
                }}
                id="writing-prose"
                className="form-textarea writing-prose"
                value={node.data.content || ""}
                onChange={event => story.updateSelectedNodeField("content", event.target.value)}
                placeholder="Write the scene here..."
              />
              <h2>Choices</h2>
              <p className="writing-hint">Type a declaration and press Enter. Click a destination to open its node.</p>
              <div className="writing-choices">
                {(node.data.choices || []).map((choice, index) => {
                  const target = story.nodes.find(item => item.id === choice.targetNodeId);
                  const id = choice.id || `index-${index}`;
                  return (
                    <div className="writing-choice" key={id}>
                      {editingChoiceId === id ? (
                        <form onSubmit={saveEditedChoice}>
                          <input
                            className="form-input"
                            aria-label="Edit choice declaration"
                            value={editingText}
                            onChange={event => setEditingText(event.target.value)}
                          />
                          <button className="toolbar-button" type="submit">Save</button>
                          <button className="toolbar-button" type="button" onClick={() => setEditingChoiceId(null)}>Cancel</button>
                        </form>
                      ) : (
                        <>
                          <span className="writing-choice-label">{choice.label || "Untitled choice"}</span>
                          <span aria-hidden="true">→</span>
                          {target ? (
                            <button className="toolbar-button writing-destination" type="button" onClick={() => openNode(target.id)}>
                              {target.data.title || target.id}
                            </button>
                          ) : <span className="writing-missing">Destination not assigned</span>}
                          {choice.id && target && (
                            <button
                              type="button"
                              className="toolbar-button writing-edit"
                              onClick={() => {
                                setEditingChoiceId(choice.id!);
                                setEditingText(`ch: ${choice.label || ""} ---> ${target.data.title || target.id}`);
                                setError("");
                              }}
                            >Edit</button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <form className="writing-add-choice" onSubmit={addChoice}>
                <label htmlFor="writing-choice-input">New choice</label>
                <input
                  className="form-input"
                  id="writing-choice-input"
                  value={draft}
                  onChange={event => { setDraft(event.target.value); setError(""); }}
                  placeholder="ch: Refuse ---> Failure"
                  autoComplete="off"
                />
                <button className="toolbar-button" type="submit">Add choice</button>
              </form>
              {error && <p className="writing-error" role="alert">{error}</p>}
              <details className="writing-settings">
                <summary>Node settings, requirements and effects</summary>
                <SidebarEditor {...story} onOpenMiniGameEditor={onOpenMiniGameEditor} onOpenVariables={onOpenVariables} />
              </details>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
