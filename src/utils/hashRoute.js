/**
 * Hash-based routes for GitHub Pages (no server rewrite for /play).
 * Convention: "#/play" for standalone player, "#/" for editor.
 */
export function getHashRoute() {
  const raw = window.location.hash || "";
  const path = raw.replace(/^#/, "").split("?")[0] || "/";
  if (path === "/play" || path.startsWith("/play/")) {
    return "play";
  }
  return "editor";
}

export function setEditorHash() {
  window.location.hash = "#/";
}
