# Build and push StoryPlay to itch.io (HTML channel).
# Requires butler: https://itch.io/docs/butler/
# First run: butler login (or let butler prompt during push)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Building itch.io bundle (relative asset paths)..."
npm run build:itch

$Butler = Join-Path $Root "tools\butler\butler.exe"
if (-not (Test-Path $Butler)) {
  Write-Host "Butler not found at tools\butler\butler.exe"
  Write-Host "Download from https://itch.io/docs/butler/ or run: npm run deploy:itch"
  exit 1
}

Write-Host "Pushing dist/ to monapdx/storyplay:html ..."
& $Butler push dist monapdx/storyplay:html
& $Butler status monapdx/storyplay:html

Write-Host "Done. Live page: https://monapdx.itch.io/storyplay"
