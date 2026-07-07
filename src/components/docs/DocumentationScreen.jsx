import { useEffect } from "react";
import { getDocSection, getDocSectionsByGroup } from "../../data/docs/catalog";
import { renderDocSection } from "../../data/docs/sections";
import { setDocsHash, setEditorHash } from "../../utils/hashRoute";
import "../../docs.css";

function DocsNav({ activeSectionId }) {
  const groups = getDocSectionsByGroup();

  return (
    <nav className="docs-sidebar__nav" aria-label="Documentation topics">
      {groups.map((group) => (
        <div key={group.id} className="docs-sidebar__group">
          <h2 className="docs-sidebar__group-label">{group.label}</h2>
          <ul className="docs-sidebar__list">
            {group.sections.map((section) => {
              const isActive = section.id === activeSectionId;
              return (
                <li key={section.id}>
                  <a
                    href={`#/docs/${section.id}`}
                    className={[
                      "docs-sidebar__link",
                      isActive ? "docs-sidebar__link--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      setDocsHash(section.id);
                    }}
                  >
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DocsLanding() {
  const featured = getDocSection("your-first-story");

  return (
    <div className="docs-landing">
      <p className="docs-lead">
        Guides for writing branching stories in StoryPlay—from your first block to export and JSON
        details. Pick a topic in the sidebar or start with the quick path below.
      </p>

      {featured ? (
        <section className="docs-featured" aria-labelledby="docs-featured-title">
          <h2 id="docs-featured-title" className="docs-featured__title">
            Recommended: {featured.title}
          </h2>
          <p className="docs-featured__summary">{featured.summary}</p>
          <button
            type="button"
            className="docs-button docs-button--primary"
            onClick={() => setDocsHash(featured.id)}
          >
            Start here
          </button>
        </section>
      ) : null}
    </div>
  );
}

function DocsArticle({ sectionId, section }) {
  const content = renderDocSection(sectionId);

  return (
    <article className="docs-article">
      <header className="docs-article__header">
        <h1 className="docs-article__title">{section?.title ?? "Topic not found"}</h1>
        {section ? <p className="docs-article__summary">{section.summary}</p> : null}
      </header>

      <div className="docs-article__body">
        {content ?? (
          <p className="docs-p">
            No page matches <code className="docs-inline-code">{sectionId}</code>. Choose a topic
            from the sidebar.
          </p>
        )}
      </div>
    </article>
  );
}

export default function DocumentationScreen({ sectionId = null }) {
  const section = sectionId ? getDocSection(sectionId) : null;
  const isLanding = !sectionId;

  useEffect(() => {
    document.documentElement.classList.add("docs-route");
    document.body.classList.add("docs-route");
    return () => {
      document.documentElement.classList.remove("docs-route");
      document.body.classList.remove("docs-route");
    };
  }, []);

  return (
    <div className="docs-site">
      <header className="docs-topbar">
        <div className="docs-topbar__brand">
          <span className="docs-topbar__logo">StoryPlay</span>
          <span className="docs-topbar__sep" aria-hidden="true">
            /
          </span>
          <span className="docs-topbar__section">Documentation</span>
        </div>
        <div className="docs-topbar__actions">
          {isLanding ? null : (
            <button
              type="button"
              className="docs-button docs-button--ghost"
              onClick={() => setDocsHash()}
            >
              All topics
            </button>
          )}
          <button
            type="button"
            className="docs-button docs-button--secondary"
            onClick={() => setEditorHash()}
          >
            Back to editor
          </button>
        </div>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar__head">
            <button
              type="button"
              className={[
                "docs-sidebar__home",
                isLanding ? "docs-sidebar__home--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setDocsHash()}
              aria-current={isLanding ? "page" : undefined}
            >
              Overview
            </button>
          </div>
          <DocsNav activeSectionId={sectionId} />
        </aside>

        <main className="docs-main" id="docs-main-content">
          {isLanding ? <DocsLanding /> : <DocsArticle sectionId={sectionId} section={section} />}
        </main>
      </div>
    </div>
  );
}
