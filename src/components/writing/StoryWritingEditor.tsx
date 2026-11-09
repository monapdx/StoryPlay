import { useEffect, useState, type FormEvent } from "react";
import type { UseStoryStateResult } from "../../hooks/useStoryState";
import { parseChoiceDeclaration } from "../../utils/storyShorthand";
import "./StoryWritingEditor.css";

interface Props {
  story: UseStoryStateResult;
  onVisual: () => void;
}

export default function StoryWritingEditor({ story, onVisual }: Props) {
  const node = story.selectedNode;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    setDraft("");
    setError("");
    setEditingChoiceId(null);
  }, [story.selectedNodeId]);

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
      <header className="writing-toolbar">
        <strong>StoryPlay · Story Editor</strong>
        <button type="button" onClick={onVisual}>Visual Editor</button>
      </header>
      <div className="writing-layout">
        <nav className="writing-outline" aria-label="Story nodes">
          <h2>Story outline</h2>
          {story.nodes.map(item => (
            <button
              key={item.id}
              type="button"
              className={item.id === node?.id ? "writing-outline-active" : ""}
              onClick={() => story.setSelectedNodeId(item.id)}
            >
              {item.data.title || item.id}
            </button>
          ))}
          <button type="button" onClick={story.addNode}>+ New node</button>
        </nav>
        <section className="writing-page" aria-label="Write story">
          {!node ? (
            <div className="writing-empty">
              <h1>Start writing your story</h1>
              <p>Create your first node to begin.</p>
              <button type="button" onClick={story.addNode}>Create first node</button>
            </div>
          ) : (
            <>
              <label htmlFor="writing-node-title">Node title</label>
              <input
                id="writing-node-title"
                className="writing-title"
                value={node.data.title || ""}
                onChange={event => story.updateSelectedNodeField("title", event.target.value)}
              />
              <p className="writing-node-type">{node.data.blockType || "narrative"}</p>
              <label htmlFor="writing-prose">Story text</label>
              <textarea
                id="writing-prose"
                className="writing-prose"
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
                            aria-label="Edit choice declaration"
                            value={editingText}
                            onChange={event => setEditingText(event.target.value)}
                          />
                          <button type="submit">Save</button>
                          <button type="button" onClick={() => setEditingChoiceId(null)}>Cancel</button>
                        </form>
                      ) : (
                        <>
                          <span className="writing-choice-label">{choice.label || "Untitled choice"}</span>
                          <span aria-hidden="true">→</span>
                          {target ? (
                            <button className="writing-destination" type="button" onClick={() => story.setSelectedNodeId(target.id)}>
                              {target.data.title || target.id}
                            </button>
                          ) : <span className="writing-missing">Destination not assigned</span>}
                          {choice.id && target && (
                            <button
                              type="button"
                              className="writing-edit"
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
                  id="writing-choice-input"
                  value={draft}
                  onChange={event => { setDraft(event.target.value); setError(""); }}
                  placeholder="ch: Refuse ---> Failure"
                  autoComplete="off"
                />
                <button type="submit">Add choice</button>
              </form>
              {error && <p className="writing-error" role="alert">{error}</p>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
