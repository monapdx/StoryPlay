# Documentation — manual verification

No automated doc tests exist yet. After changes to docs or routing, check:

1. **Separate light theme** — `/#/docs` uses white wiki layout; editor at `/#/` still uses dark UI.
2. **Sidebar navigation** — All 14 topics listed by group; active link highlights; **Overview** returns to landing.
3. **Section URLs** — `/#/docs/your-first-story` (and other ids) open the correct article.
4. **Unknown section** — `/#/docs/not-a-real-id` shows not-found message inside docs shell.
5. **Header entry** — **Documentation** in editor header opens docs; **Back to editor** returns to `/#/`.
6. **Workspace links** — **Documentation** on Variables and Characters screens opens docs.
7. **Play route** — `/#/play` still loads player mode (docs route must not intercept).
8. **Keyboard** — Tab through sidebar links and buttons; focus rings visible.
9. **Mobile** — Sidebar stacks above content below 768px width.

Build: `npm run build`
