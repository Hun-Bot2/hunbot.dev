# 2026-10-04 — Theme reveal, article width, page intros

Session decision log for branch `feat/atelier-redesign`. Records what changed, why,
what was verified, and what is still open.

## 1. Theme toggle: circular reveal (progressive enhancement)

Files: `src/components/BaseHead.astro` (inline theme script), `src/styles/global.css`
(end of file).

Existing theme system is unchanged: `localStorage` key `neural-blog-theme`,
`html.dark` class, `data-theme` / `aria-pressed` on `#themeToggleBtn`, `applyTheme()`.
The reveal wraps that switch; if it cannot run, the plain switch runs instead.

**Behaviour**
- Click → a real DOM ripple, a child of `#themeToggleBtn`, grows with `scale: 0 → 1`
  (1100 ms, `cubic-bezier(0.4, 0, 0.2, 1)`, no delay). Its center is the button's
  center by construction: it is a top-layer `popover="manual"` element placed with
  CSS anchor positioning (`anchor-name: --theme-btn`, `left/top: anchor(center)`),
  so no viewport x/y positions it. Only its diameter depends on the viewport
  (`2 × hypot(vw, vh)`, with `vw/vh = max(visualViewport, inner)`), so it can cover
  the screen from any button position.
- `document.startViewTransition()` swaps the theme. `::view-transition-new(root)` is
  clipped with `circle(var(--theme-r) at var(--theme-x) var(--theme-y))`. A
  `requestAnimationFrame` loop copies the ripple's rendered center/radius into
  those variables each frame, so the ripple is the single source of truth. The
  variables are initialised before the transition starts, so the first painted
  frame is a 0 px circle at the button.
- A keep-alive animation (`theme-hold`, opacity 1 → 1) on `new(root)` keeps the
  transition running for the ripple's duration; the clip itself is not a CSS animation.

**Preserved**: reduced motion (plain switch), persistence (storage write wrapped in
try/catch), rapid toggles (`desiredTheme` is tracked synchronously, the previous
transition is skipped, `runId` guards late cleanup), no FOUC (the pre-paint
`html.dark` bootstrap is untouched).

**Fallback**: plain `commit()` when `startViewTransition`, `showPopover`, or CSS
anchor positioning (`CSS.supports('anchor-name', '--a')`) is missing, when reduced
motion is on, or if anything throws.

**Why the ripple is in the top layer**: as an absolutely positioned child inside
the sticky, `backdrop-filter` header, a 2×diagonal box added to the page's
scrollable overflow during the reveal — a horizontal scrollbar appeared (viewport
height 900 → 884) and `scrollHeight` jumped 1136 → 1734. In the top layer it adds
nothing; after the change the viewport height stayed 900 and `scrollHeight` 1136.

**Dropped on purpose** (tried earlier in the session, removed to isolate a
reported first-frame bug): the decorative leading ring, the button squash, the
140 ms delay, and the JS-driven clip-path animation.

**Verification status — read before relying on this**
- Measured in real Chrome (Playwright, `channel: 'chrome'`): button center vs
  ripple center was 0.00 px at every sampled frame before the popover change;
  clip origin matched; first frames were radius 0; light→dark and dark→light;
  window sizes 390 → 2560 wide, scroll, and device-scale emulation of zoom.
- After the move to a top-layer popover, a final run was interrupted. It showed no
  page overflow, but its "ripple center vs button center" summary read ~1088 px at
  some samples. The likely cause is samples taken after the transition ended (the
  popover is hidden, so its box is empty); this was **not confirmed**.
- Reduced-motion mode was not exercised, and real browser zoom was only emulated.
- The user reported an incorrect-looking initial reveal in their own full-screen
  browser. It was never reproduced here, and its cause was not identified. Likely
  explanation: a tab running an older inline script (inline `<head>` scripts do not
  hot-update; a hard reload is required). If it recurs, add geometry logging
  back first: an earlier `theme-debug` console log was removed together with the
  older implementation.

## 2. Article width

File: `src/styles/prose.css`.

The prose, `.series-nav`, and `.feedback-box` no longer have a separate
`max-width`; they use the full article frame (`--content-max`, 980 px), so text,
dividers, images, and code share one left/right edge. The `--prose-measure`
variable (46rem) and the image-only-paragraph exemption were removed with it.
Global content width, margins, font size, line height, and image/code/table
behaviour are unchanged. Line length is now noticeably longer than before.

## 3. Page intros removed

Files: `src/pages/[lang]/` — `explore.astro` (see §4), `library.astro`,
`library/[section].astro`, `library/useful-feeds.astro`, `research.astro`,
`research/decks.astro`, `research/topics/[topic].astro`, `paths.astro`,
`paths/[path].astro`, `search.astro`, `blog/categories.astro`; styles in
`src/styles/global.css`.

Every `<p class="intro-copy">`, `<p class="intro-note">` and the categories
`<p class="category-intro">` is gone, including the search page's guidance note.
Pages show the title (and tabs/back link where present) and go straight to
content. The `.intro-copy`, `.intro-note` and `.category-intro` styles were
deleted. Not touched: SEO `description` meta, empty-state messages, and the small
section descriptions on the home page's Library cards (card content, not a page
intro). The now-unused `*.subtitle` / intro strings remain in `src/i18n/ui.ts`.

## 4. Titles, Explore label, decks position

- **Page titles** (`.subpage-intro .eyebrow`, `global.css`): 11 px → 15 px,
  weight 600, color `var(--ink)`, letter-spacing 0.06em, so the current page is
  obvious. Applies to every page title that uses the class, including the blog
  index. (Interpreted "연구 / 라이브러리 / 탐색 글씨" as the page titles; the
  header nav links were not restyled.)
- **"Living Atlas" hidden** on `/{lang}/explore/`: the visible `<h1>` is now just
  `탐색` and the document `<title>` is `탐색 - Hun-Bot Blog`. The atlas section's
  `aria-label` still says "Living Atlas" (screen readers only).
- **Decks (발표자료) moved to the bottom** of `/{lang}/research/`, after
  Featured Topics, as an appendix; the section itself is unchanged.

## Out of this commit

Other uncommitted work in the tree was deliberately left out: the Explore atlas
(`explore.astro`, `src/components/explore/`, `atlas*`), the public-artifact
contract, `Header.astro` / `ui.ts` / `sitemap.xml.ts` / validator edits for
Explore, blog content, `PaperRow.astro`, `CLAUDE.md`, and `package.json`.
`explore.astro` is untracked, so the two edits above to it ship with the Explore
work, not this commit.
