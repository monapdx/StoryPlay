/**
 * Resolve which node the standalone player should start from.
 * @param {unknown[]} nodes
 * @returns {string | null}
 */
export function resolvePlayEntryNodeId(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  const markedStart = nodes.find((node) => node?.data?.isStart);
  return markedStart?.id ?? nodes[0]?.id ?? null;
}

/**
 * @param {unknown[]} nodes
 * @returns {string}
 */
export function getNodesSignature(nodes) {
  if (!Array.isArray(nodes)) return "";
  return nodes.map((node) => node?.id).filter(Boolean).join("|");
}
