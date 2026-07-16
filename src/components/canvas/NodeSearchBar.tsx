import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { StoryNode } from "../../types/story";

/**
 * Canvas node search control.
 */
export interface NodeSearchBarProps {
  nodes: readonly StoryNode[];
  onJumpToNode: (nodeId: string) => void;
}

export default function NodeSearchBar({
  nodes,
  onJumpToNode,
}: NodeSearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return nodes
      .filter((node) => {
        const title = node.data?.title || "";
        return title.toLowerCase().includes(trimmed);
      })
      .slice(0, 8);
  }, [nodes, query]);

  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const activeTag = active?.tagName || "";
      const isTypingInInput =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        active?.isContentEditable;

      if (event.key === "/" && !isTypingInInput) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape" && active === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  function handleSelect(nodeId: string) {
    onJumpToNode(nodeId);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && results.length) {
      event.preventDefault();
      handleSelect(results[0].id);
    }

    if (event.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  }

  function highlightMatch(text: string | undefined): ReactNode {
    const safeText = text || "Untitled Block";
    const trimmed = query.trim();

    if (!trimmed) return safeText;

    const lowerText = safeText.toLowerCase();
    const lowerQuery = trimmed.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) return safeText;

    const before = safeText.slice(0, matchIndex);
    const match = safeText.slice(matchIndex, matchIndex + trimmed.length);
    const after = safeText.slice(matchIndex + trimmed.length);

    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  }

  return (
    <div className="node-search">
      <input
        ref={inputRef}
        className="node-search-input"
        type="text"
        placeholder="Search nodes..."
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        onKeyDown={handleInputKeyDown}
      />

      {query.trim() && (
        <div className="node-search-results">
          {results.length === 0 ? (
            <div className="node-search-empty">No matching nodes</div>
          ) : (
            results.map((node) => (
              <button
                key={node.id}
                className="node-search-result"
                onClick={() => handleSelect(node.id)}
              >
                <span className="node-search-title">
                  {highlightMatch(node.data?.title || "Untitled Block")}
                </span>
                <span className="node-search-type">
                  {node.data?.blockType || "narrative"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
