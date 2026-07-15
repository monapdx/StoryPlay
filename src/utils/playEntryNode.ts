/**
 * Minimal node fields used for play-entry resolution — not a full story node.
 */
interface PlayEntryNodeCandidate {
  id?: unknown;
  data?: {
    isStart?: unknown;
  } | null;
}

/**
 * Resolve which node the standalone player should start from.
 */
export function resolvePlayEntryNodeId(nodes: unknown): string | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  const list = nodes as PlayEntryNodeCandidate[];
  const markedStart = list.find((node) => node?.data?.isStart);
  return (markedStart?.id ?? list[0]?.id ?? null) as string | null;
}

export function getNodesSignature(nodes: unknown): string {
  if (!Array.isArray(nodes)) return "";
  return (nodes as PlayEntryNodeCandidate[])
    .map((node) => node?.id)
    .filter(Boolean)
    .join("|");
}
