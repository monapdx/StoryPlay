import type { MouseEvent } from "react";
import type { DemoStoryCatalogEntry } from "../../types/demoStories";

export interface StarterTemplateModalProps {
  open: boolean;
  demoStories: DemoStoryCatalogEntry[];
  activeTemplateId: string | null;
  onClose: () => void;
  onSelectTemplate: (storyId: string) => void;
}

export default function StarterTemplateModal({
  open,
  demoStories,
  activeTemplateId,
  onClose,
  onSelectTemplate,
}: StarterTemplateModalProps) {
  if (!open) return null;

  return (
    <div
      className="starter-template-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="starter-template-title"
      onClick={onClose}
    >
      <div
        className="starter-template-modal__panel custom-scrollbar"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="starter-template-modal__head">
          <div>
            <p className="starter-template-modal__eyebrow">Starter templates</p>
            <h2 id="starter-template-title" className="starter-template-modal__title">
              Load an example story
            </h2>
            <p className="starter-template-modal__lead">
              Explore branching, variables, chat, timers, and mini-games. Your current project
              will be replaced—save with Export first if you need to keep it.
            </p>
          </div>
          <button
            type="button"
            className="toolbar-button starter-template-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <ul className="starter-template-list">
          {demoStories.map((entry) => {
            const isActive = entry.id === activeTemplateId;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`starter-template-card ${isActive ? "is-active" : ""}`}
                  onClick={() => onSelectTemplate(entry.id)}
                >
                  <span className="starter-template-card__tier">{entry.tier}</span>
                  <span className="starter-template-card__label">{entry.label}</span>
                  <span className="starter-template-card__blurb">{entry.blurb}</span>
                  {isActive && (
                    <span className="starter-template-card__badge">Currently loaded</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="starter-template-modal__foot muted">
          Prefer a blank canvas? Close this window and keep building from scratch.
        </p>
      </div>
    </div>
  );
}
