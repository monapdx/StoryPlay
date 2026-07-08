/**
 * Cross-platform itch.io deploy helper.
 * Uses butler push dist monapdx/storyplay:html
 *
 * Set BUTLER_PATH to your butler binary, or place butler at tools/butler/butler(.exe).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = "monapdx/storyplay:html";
const isWin = process.platform === "win32";

function resolveButler() {
  if (process.env.BUTLER_PATH && existsSync(process.env.BUTLER_PATH)) {
    return process.env.BUTLER_PATH;
  }

  const candidates = [
    join(root, "tools", "butler", isWin ? "butler.exe" : "butler"),
    isWin ? "butler.exe" : "butler",
  ];

  for (const candidate of candidates) {
    if (candidate.includes(root) && existsSync(candidate)) {
      return candidate;
    }
  }

  return isWin ? "butler.exe" : "butler";
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    shell: isWin,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const butler = resolveButler();
const distDir = join(root, "dist");

if (!existsSync(join(distDir, "index.html"))) {
  console.error("dist/index.html not found. Run npm run build:itch first.");
  process.exit(1);
}

console.log(`Pushing ${distDir} to ${target} via ${butler}...`);
run(butler, ["push", "dist", target, "--userversion", String(Date.now())]);
run(butler, ["status", target]);

const verify = spawnSync(process.execPath, ["scripts/verify-itch-embed.mjs"], {
  cwd: root,
  encoding: "utf8",
});

if (verify.status === 0) {
  console.log(verify.stdout.trim());
  console.log("Live: https://monapdx.itch.io/storyplay");
} else {
  console.log("");
  console.log("Butler push succeeded, but the public embed is still on the old manual upload.");
  console.log("One-time fix: https://itch.io/game/edit/4386018");
  console.log("See docs/ITCH-DEPLOY.md");
  if (verify.stdout) console.log(verify.stdout);
  if (verify.stderr) console.error(verify.stderr);
}
