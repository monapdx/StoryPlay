/**
 * Hash-based routes for GitHub Pages (no server rewrite).
 * Convention: "#/play" player, "#/docs" documentation, "#/" editor.
 */

export function parseHashRoute() {
  const raw = window.location.hash || "";
  const path = raw.replace(/^#/, "").split("?")[0] || "/";

  if (path === "/play" || path.startsWith("/play/")) {
    return { route: "play", docsSectionId: null };
  }

  if (path === "/docs" || path.startsWith("/docs/")) {
    const parts = path.split("/").filter(Boolean);
    const sectionId = parts.length >= 2 ? decodeURIComponent(parts[1]) : null;
    return { route: "docs", docsSectionId: sectionId };
  }

  return { route: "editor", docsSectionId: null };
}

/** @deprecated Prefer parseHashRoute() */
export function getHashRoute() {
  return parseHashRoute().route;
}

export function getDocsSectionId() {
  return parseHashRoute().docsSectionId;
}

export function setEditorHash() {
  window.location.hash = "#/";
}

export function setDocsHash(sectionId) {
  window.location.hash = sectionId ? `#/docs/${encodeURIComponent(sectionId)}` : "#/docs";
}
