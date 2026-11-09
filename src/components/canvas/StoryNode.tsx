import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "reactflow";
import { useEffect, useState } from "react";
import type { StoryNodeData } from "../../types/story";
import type { StoryCharacter } from "../../types/storyCore";
import { renderStoryText } from "../../utils/storyReferences";
import { INPUT_HANDLE_ID } from "../../utils/nodeGraphLinks";
import { getNodeHandleModel } from "../../utils/nodeHandleModel";

/** Play highlight on canvas nodes (from StoryCanvas playStateMap). */
export type StoryCanvasNodePlayState =
  | "idle"
  | "playing"
  | "reachable"
  | "locked";

/**
 * Hydrated RF node `data` bag passed by StoryCanvas — persisted StoryNodeData
 * plus runtime characters, playState, and editor callbacks.
 * Not a persisted story schema type.
 */
export type StoryCanvasNodeData = StoryNodeData & {
  characters?: StoryCharacter[];
  isSelected?: boolean;
  playState?: StoryCanvasNodePlayState;
  onRenameNode?: (nodeId: string, title: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onAddChoice?: (nodeId: string) => void;
  onCenterNode?: (nodeId: string) => void;
};

export type StoryNodeProps = NodeProps<StoryCanvasNodeData>;

export default function StoryNode({ id, data, selected }: StoryNodeProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const context = { characters: data.characters || [] };
  const title = renderStoryText(data.title || "Untitled Block", context);
  const content = renderStoryText(data.content || "", context);
  const words = content.trim() ? content.trim().split(/\s+/u).length : 0;
  const blockType = data.blockType || "narrative";
  const handles = getNodeHandleModel(data);
  const outputs = [
    ...handles.choiceHandles,
    ...(handles.continueHandle ? [handles.continueHandle] : []),
    ...handles.specialHandles,
  ];
  const updateNodeInternals = useUpdateNodeInternals();
  const handleKey = outputs.map(handle => handle.id).join("|");
  useEffect(() => { updateNodeInternals(id); }, [id, handleKey, updateNodeInternals]);

  function saveTitle() {
    if (titleDraft.trim()) data.onRenameNode?.(id, titleDraft.trim());
    setEditingTitle(false);
  }

  return (
    <div className={["node-card", "node-card--compact", selected ? "selected" : "", data.playState || "idle"].join(" ")}
      style={{ minHeight: Math.max(84, outputs.length * 18 + 20) }}>
      <Handle id={INPUT_HANDLE_ID} type="target" position={Position.Left} className="story-handle" />
      <div className={`node-card-header ${blockType}`} onDoubleClick={event => {
        event.stopPropagation();
        setTitleDraft(data.title || "");
        setEditingTitle(true);
      }}>
        {editingTitle ? (
          <input className="nodrag nowheel node-title-input" aria-label="Node title" autoFocus
            value={titleDraft} onChange={event => setTitleDraft(event.target.value)}
            onBlur={saveTitle} onKeyDown={event => {
              event.stopPropagation();
              if (event.key === "Enter") { event.preventDefault(); saveTitle(); }
              if (event.key === "Escape") setEditingTitle(false);
            }} />
        ) : <span title="Double-click to edit title">{title}</span>}
      </div>
      <div className="node-card-body">
        <div className="node-card-meta"><span>{blockType}</span><span>{words} {words === 1 ? "word" : "words"}</span></div>
      </div>
      {outputs.map((handle, index) => (
        <Handle key={handle.id} id={handle.id} type="source" position={Position.Right}
          className="story-handle" title={handle.label || "Choice"}
          style={{ top: `${((index + 1) / (outputs.length + 1)) * 100}%` }} />
      ))}
    </div>
  );
}
