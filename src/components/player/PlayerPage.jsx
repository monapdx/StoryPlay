import { useEffect, useMemo, useState } from "react";
import StoryPreview from "../preview/StoryPreview";
import usePlayState from "../../hooks/usePlayState";
import {
  loadStoryForPreview,
  STORYPLAY_PREVIEW_BROADCAST_CHANNEL,
} from "../../utils/storyPreviewStorage";
import { setEditorHash } from "../../utils/hashRoute";

export default function PlayerPage() {
  const [snapshot, setSnapshot] = useState(() => loadStoryForPreview());

  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel(STORYPLAY_PREVIEW_BROADCAST_CHANNEL);
      bc.onmessage = () => {
        setSnapshot(loadStoryForPreview());
      };
    } catch {
      /* ignore */
    }
    return () => {
      try {
        bc?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const nodes = snapshot?.nodes ?? [];
  const variables = snapshot?.variables ?? {};
  const characters = snapshot?.characters ?? [];
  const selectedNodeId = useMemo(() => {
    if (!snapshot?.nodes?.length) return null;
    const id = snapshot.selectedNodeId;
    if (id && snapshot.nodes.some((n) => n.id === id)) return id;
    return snapshot.nodes[0]?.id ?? null;
  }, [snapshot]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const play = usePlayState(nodes, selectedNodeId, variables);

  const hasStory = Boolean(snapshot && Array.isArray(snapshot.nodes) && snapshot.nodes.length > 0);

  return (
    <div className="player-page">
      <header className="player-page-toolbar">
        <button
          type="button"
          className="toolbar-button"
          onClick={() => setEditorHash()}
          title="Return to the story editor in this tab"
        >
          ← Back to editor
        </button>
        <span className="player-page-toolbar-meta">
          StoryPlay · Play mode · refreshes when the editor updates the preview snapshot
        </span>
      </header>

      {!hasStory ? (
        <div className="player-page-empty">
          <h1 className="player-page-empty-title">No story to play yet</h1>
          <p className="player-page-empty-text">
            This page loads the snapshot saved when you choose <strong>Play in new tab</strong> from the
            editor. After that, the editor tab can push debounced updates here automatically while you keep
            working. You can also click <strong>Play in new tab</strong> again anytime for an immediate refresh.
          </p>
          <button type="button" className="toolbar-button" onClick={() => setEditorHash()}>
            Go to editor (#/)
          </button>
        </div>
      ) : (
        <div className="player-page-body custom-scrollbar">
          <StoryPreview
            {...play}
            nodes={nodes}
            characters={characters}
            selectedNode={selectedNode}
            selectedNodeId={selectedNodeId}
          />
        </div>
      )}
    </div>
  );
}
