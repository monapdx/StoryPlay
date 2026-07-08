import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const releaseDir = join(root, "release");
const zipPath = join(releaseDir, "storyplay-html.zip");

if (!existsSync(join(distDir, "index.html"))) {
  console.error("dist/index.html not found. Run npm run build:itch first.");
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) {
  rmSync(zipPath);
}

let result;
if (process.platform === "win32") {
  result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${distDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "inherit" }
  );
} else {
  result = spawnSync("zip", ["-r", zipPath, "."], { cwd: distDir, stdio: "inherit" });
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Wrote ${zipPath}`);
