# Deploying StoryPlay to itch.io

## Quick deploy

```bash
npm run deploy:itch
```

This runs `npm run build:itch` (relative asset paths) and `butler push dist monapdx/storyplay:html`.

## One-time fix if "Run tool" shows an old version

itch.io can keep serving a **manual zip upload** even after butler pushes succeed. StoryPlay currently has:

| Source | Status |
|--------|--------|
| Butler `html` channel | Latest build (Documentation, import, blank start, etc.) |
| Old `storyplay-html.zip` manual upload | What **Run tool** may still embed |

### Fix on the itch edit page (about 2 minutes)

1. Open [Edit StoryPlay on itch.io](https://itch.io/game/edit/4386018)
2. Under **Uploads**, find the old **`storyplay-html.zip`** (manual upload)
3. **Delete** that file
4. Find the Butler **`html`** channel build (upload from butler)
5. Check **This file will be played in the browser** for that build
6. **Save** the page
7. Open [monapdx.itch.io/storyplay](https://monapdx.itch.io/storyplay) and click **Run tool** (hard refresh if needed: Ctrl+Shift+R)

After the old zip is removed, future `npm run deploy:itch` updates go live automatically.

### Manual zip fallback

If you prefer manual uploads instead of butler:

```bash
npm run build:itch
```

Then zip the **contents** of `dist/` (not the folder itself) as `storyplay-html.zip` and upload via the edit page. A ready-made zip is written to `release/storyplay-html.zip` when you run `npm run package:itch`.

## Verify live embed

```bash
npm run verify:itch
```

Checks that the public itch embed JS includes markers from the current app (e.g. `Documentation`, `Visual story editor`).

## Requirements

- [butler](https://itch.io/docs/butler/) installed (or `tools/butler/butler.exe` on Windows)
- `butler login` completed once on this machine

## Project

- Page: https://monapdx.itch.io/storyplay
- Butler target: `monapdx/storyplay:html`
- Game ID: `4386018`
