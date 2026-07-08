/**
 * Verify the live itch.io embed serves the current StoryPlay build.
 * Fails if the embed still points at the old manual zip upload.
 */

const EMBED_INDEX_URL = "https://html-classic.itch.zone/html/17517522/index.html";
const MARKERS_NEW = ["Visual story editor", "Documentation", "Templates"];
const MARKERS_OLD = ["Build branching stories", "Demo story"];

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function main() {
  const indexHtml = await fetchText(EMBED_INDEX_URL);
  const scriptMatch = indexHtml.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  if (!scriptMatch) {
    console.error("Could not find JS bundle in itch embed index.html");
    process.exit(1);
  }

  const jsUrl = EMBED_INDEX_URL.replace("index.html", `assets/${scriptMatch[1]}`);
  const js = await fetchText(jsUrl);

  const hasNew = MARKERS_NEW.every((marker) => js.includes(marker));
  const hasOld = MARKERS_OLD.some((marker) => js.includes(marker));

  if (hasNew && !hasOld) {
    console.log("OK: itch embed is serving the current StoryPlay build.");
    console.log(`Bundle: ${scriptMatch[1]}`);
    return;
  }

  console.error("FAIL: itch embed is still serving an old build.");
  console.error(`Bundle: ${scriptMatch[1]}`);
  console.error("");
  console.error("The butler html channel is updated, but Run tool still embeds the old");
  console.error("manual storyplay-html.zip upload. Fix once on the itch edit page:");
  console.error("  https://itch.io/game/edit/4386018");
  console.error("");
  console.error("See docs/ITCH-DEPLOY.md for steps.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
