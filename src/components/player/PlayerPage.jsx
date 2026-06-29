import { useEffect, useMemo, useRef, useState } from "react";
import StoryPreview from "../preview/StoryPreview";
import usePlayState from "../../hooks/usePlayState";
import {
  loadStoryForPreview,
  STORYPLAY_PREVIEW_BROADCAST_CHANNEL,
} from "../../utils/storyPreviewStorage";
import { setEditorHash } from "../../utils/hashRoute";
import {
  getNodesSignature,
  resolvePlayEntryNodeId,
} from "../../utils/playEntryNode";

export default function PlayerPage() {
  const [snapshot, setSnapshot] = useState(() => loadStoryForPreview());
  const playEntryNodeIdRef = useRef(null);
  const lastNodesSignatureRef = useRef("");

  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel(STORYPLAY_PREVIEW_BROADCAST_CHANNEL);
      bc.onmessage = () => {
        const nextSnapshot = loadStoryForPreview();
        if (!nextSnapshot) return;

        const nextSignature = getNodesSignature(nextSnapshot.nodes);
        if (
          lastNodesSignatureRef.current &&
          nextSignature !== lastNodesSignatureRef.current
        ) {
          playEntryNodeIdRef.current = resolvePlayEntryNodeId(nextSnapshot.nodes);
        }

        lastNodesSignatureRef.current = nextSignature;
        setSnapshot(nextSnapshot);
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
  const variableMeta = snapshot?.variableMeta ?? {};
  const characters = snapshot?.characters ?? [];

  if (playEntryNodeIdRef.current == null && nodes.length > 0) {
    playEntryNodeIdRef.current = resolvePlayEntryNodeId(nodes);
    lastNodesSignatureRef.current = getNodesSignature(nodes);
  }

  const playEntryNodeId = playEntryNodeIdRef.current;

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === playEntryNodeId) || nodes[0] || null;
  }, [nodes, playEntryNodeId]);

  const play = usePlayState(nodes, playEntryNodeId, variables, {
    standalone: true,
  });

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
          <div className="player-play-shell">
            <StoryPreview
              {...play}
              nodes={nodes}
              characters={characters}
              selectedNode={selectedNode}
              selectedNodeId={playEntryNodeId}
              initialVariables={variables}
              variableMeta={variableMeta}
              variant="player"
            />
          </div>
        </div>
      )}
    </div>
  );
}
