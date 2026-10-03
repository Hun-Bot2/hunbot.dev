# 2026-10-03 — Post rendering & header/search UI fixes

Six user-reported issues. Each section: symptom → root cause (verified) → fix → how to verify.
Keep every change minimal; no refactors beyond what is listed. The owner dislikes over-engineering.

Pre-existing uncommitted user work is in the tree (`src/content/blog/ko/personal_log/HRD01.mdx`, `HRD02.mdx`, `old.mdx`, a deleted `pul.mdx`, a `ㅇㅂㅈ.md` under `devlog/ON-THE-BLOCK/`). Do not delete, rename, stage, or commit any of it. Only `HRD01.mdx` line 31 is edited (issue 1).

---

## 1. External link in a post should render like 「제목」↗ with a dotted underline

**Symptom.** `HRD01.mdx:31` contains the raw text `"https://toss.tech/article/AI_chatbot" 연 300시간을 아낀 AI 상담 서비스라는 글을…` — no link at all. Target look (user screenshot): `토스 테크 「연 300시간을 아낀 AI 상담 서비스」↗` where the bracketed title is a link with a dotted underline and a small ↗ after it.

**Root causes.**
1. The content isn't a Markdown link.
2. There is no prose link style. In dark mode the global `a { color: rgb(248,249,250); text-decoration: none }` (`src/styles/global.css` ~L612) makes in-body links indistinguishable from text. The `[&>a]:…` utilities in `BlogPost.astro` `proseClass` only target *direct* children of `.prose`, so they never match a link inside a `<p>`. In light mode `body.light-theme :where(a) { color: #0f172a !important }` likewise flattens them.

**Fix.**
- Content: rewrite the phrase in `HRD01.mdx:31` to
  `최근(26/09/23)에는 토스 테크 [「연 300시간을 아낀 AI 상담 서비스」](https://toss.tech/article/AI_chatbot)라는 글을 통해 …` (keep the rest of the sentence unchanged).
- New tiny rehype plugin `src/utils/rehype-external-links.mjs` (use `unist-util-visit`, already a dependency; do **not** add `rehype-external-links`): for every hast `element` with `tagName === 'a'` whose `href` is absolute `http(s)://` and whose host is not `hun-bot.dev`/`www.hun-bot.dev`, add `target="_blank"`, `rel="noopener noreferrer"`, and class `external-link` (append to existing className, don't replace). Register it in `astro.config.mjs` `rehypePlugins` (shared by `mdx()` and `markdown`), *before* `rehypeKatex`.
- CSS in `src/styles/global.css` (near the other `.prose` rules), applying to links inside post bodies:
  ```css
  .prose a:not(.toc-link) {
    color: inherit;
    text-decoration: underline dotted;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.3em;
    text-decoration-color: rgba(148, 163, 184, 0.7);
  }
  .prose a:not(.toc-link):hover { color: #fb923c; text-decoration-color: currentColor; }
  .prose a.external-link:not(:has(img))::after {
    content: "↗";
    display: inline-block;
    margin-left: 0.15em;
    font-size: 0.75em;
    text-decoration: none;
    opacity: 0.7;
  }
  ```
  Then make sure the light theme doesn't flatten it: `body.light-theme :where(a)` has `!important` color, so add a light-theme rule for `.prose a:not(.toc-link)` (color `#0f172a`, underline color `rgba(15,23,42,0.4)`, hover `#c2410c`) — use `!important` only if it's needed to beat that rule. Remove/replace the existing `body.light-theme .prose a { color: #1d4ed8 }` only if it conflicts; prefer the dotted style in both themes.
- Check no other existing `.prose a` usage breaks: heading anchors, image links (`[![…](…)](…)`), links inside MDX components (`src/components/reviews/*`, `decks/*`). MDX JSX components are not hast `element`s so the plugin won't touch them — confirm.

**Verify.** `/ko/blog/personal_log/HRD01/` (check actual slug via `getBlogSlugFromId`) — link shows `「…」↗`, dotted underline, opens in new tab, in both dark and light themes.

---

## 2. `**회사의 입장(사측)**에` does not become bold

**Symptom.** Rendered literally as `**회사의 입장(사측)**에`. Same bug in the same file at L26: `**DX(Digital Transformation)**가`, `**AX(AI Transformation)**로`.

**Root cause.** CommonMark's emphasis flanking rule: a closing `**` preceded by punctuation (`)`) must be followed by whitespace or punctuation. A Korean particle (`에`, `가`, `로`) is neither, so the delimiter is not right-flanking and no `<strong>` is produced. This is a known CJK problem, not a style issue.

**Fix.** Add `remark-cjk-friendly` (v2.x, peer `unified ^11` — matches Astro 5) as a dependency and put it in the shared `remarkPlugins` array in `astro.config.mjs` (before `remarkMath`). It relaxes the flanking rule only around CJK characters, so English content is unaffected. Do not edit the post text to work around this.

**Verify.** All three phrases in HRD01 render bold. Spot-check a couple of English/Japanese posts still render identically (e.g. diff `dist/client` HTML of one `en` post before/after for unintended `<strong>` changes).

---

## 3. List directly after a paragraph: spacing is unbalanced

**Symptom.** `HRD01.mdx:69-73`: the lead-in sentence `…가정해보자.` is immediately followed by `- …` items (no blank line). On the page the list sits far from its lead-in sentence and items are loosely spaced; the gap above and below the list look unrelated to each other. The user wants the list to read as attached to the sentence that introduces it.

**Root cause.** In `BlogPost.astro` `proseClass`: `[&>p]:mb-5` (1.25rem) under every paragraph regardless of what follows, `[&>ul]:mb-5`, `[&>ul>li]:mb-2`, plus a conflicting `.prose p { margin-bottom: 0.5em }` in `global.css` (~L673) of equal specificity — which one wins depends on stylesheet order. Tailwind Typography is **not** installed, so `prose`/`prose-slate` contribute nothing; all spacing comes from these rules.

**Fix.** First measure the actual computed margins (`javascript_tool` → `getComputedStyle`) for the `<p>` before the list, the `<ul>`, and each `<li>`, so you know which rule is winning. Then:
- A paragraph immediately followed by a list gets a small gap: `[&>p:has(+ul)]:mb-2 [&>p:has(+ol)]:mb-2` (≈0.5rem) — or the equivalent plain CSS `.prose > p:has(+ ul), .prose > p:has(+ ol) { margin-bottom: 0.5rem; }`.
- Top-level list items tighter: `[&>ul>li]:mb-1 [&>ol>li]:mb-1`.
- Gap under the list equals the normal paragraph gap (keep `mb-5`) so the next paragraph separates like any other paragraph.
- Remove the dead/conflicting `.prose p { margin-bottom: 0.5em }` only if measurement shows it's the one winning and causing inconsistency; otherwise leave it.

**Verify.** Screenshot that block: sentence → list gap visibly smaller than list → next paragraph gap; item spacing even.

---

## 4. TOC font sizes: `#` too big, `###` too small

**Root cause.** `src/components/TableOfContents.astro` `<style is:global>`: base `.toc-link` uses `text-lg` (18px) — every h1/h2 entry is 18px — while `.toc-h3` is `text-[11px]` and h4–h6 `text-[10px]`. A 7px jump between levels.

**Fix.** Base `.toc-link` → `text-sm` (14px). Level scale:
- `.toc-h1` → `text-[15px] font-semibold`
- `.toc-h2` → `pl-1.5` (inherits 14px)
- `.toc-h3` → `pl-3 text-[13px]`
- `.toc-h4`/`h5`/`h6` → existing padding, `text-xs` (12px)

Keep `leading-snug` or similar so multi-line Korean headings don't crowd. Nothing else in the TOC changes.

**Verify.** On `/ko/blog/technical_note/database/pulmuone-race-condition/` (has h1, h2, h3) open the TOC and screenshot.

---

## 5. Hamburger button visible on desktop

**Root cause.** `src/components/Header.astro` styles: `@media (min-width: 768px) { .mobile-menu-btn { display: none } }` is declared **before** `.icon-button { display: flex; … }`. The button has both classes, same specificity, so the later `.icon-button` rule wins and the hamburger shows at every width.

**Fix.** Make the hide rule win: change the media-query selector to `.icon-button.mobile-menu-btn` (or move the media block after `.icon-button`). Also make sure `#mobileMenu` can't stay open past 768px (add `@media (min-width: 768px) { .mobile-menu { display: none; } }` if the menu element itself isn't already hidden there). Mobile (<768px) behaviour must be unchanged — the desktop icon row is hidden below 768px, so the hamburger is the only nav there.

**Verify.** `resize_window` desktop: no hamburger. `preset: mobile`: hamburger visible, opens/closes the menu. Reset to desktop afterwards.

---

## 6. Search page, dark mode: `비우기` (clear) button misaligned and not working

**Root cause (styling).** Global `button, .button, input[type=submit]` in `global.css` (~L651) adds `padding: 0.55em 1.1em`, a border, background and hover/focus styles to **every** button — including Pagefind UI's `.pagefind-ui__search-clear`. `search.astro` passes `resetStyles: false` and never overrides that button, so in dark mode it renders as a bordered box with the label pushed left.

**Root cause (function) — must be confirmed by reproducing.** Possibilities to check, in order:
1. The global button styles (box/hover background) cover or offset the clickable area so the click lands on the input instead.
2. Pagefind's clear resets the input but our page never restores the empty state (`.search-empty` is hidden with `{ once: true }` and never shown again) and/or results remain.
3. `public/pagefind/` doesn't exist, so in `npm run dev` `/pagefind/pagefind-ui.js` 404s — search only works on a build. If so, reproduce against a real build: `npm run build`, then serve `dist/client` statically (e.g. `npx serve dist/client` via a temporary `.claude/launch.json` entry — remove the entry afterwards) since `astro preview` may not support the Vercel adapter. The "개발 검색 중…" stuck state in the screenshot suggests the index wasn't reachable when the screenshot was taken.

**Fix.**
- In `search.astro` `<style>`, add `:global(.pagefind-ui__search-clear)` overrides: no border, transparent background (or `var(--pagefind-ui-background)`), `padding: 0 1rem`, `font-size: 0.875rem`, `color: var(--pagefind-ui-text)`, opacity ~0.7, `height` filling the input, text right-aligned/centered — same appearance as the light-mode screenshot. Also neutralize the global `button:hover/:focus` background on it; give it a visible `:focus-visible` outline instead.
- If the click genuinely doesn't clear: after the PagefindUI is created, listen for clicks on `.pagefind-ui__search-clear` (event delegation on `#search`, since Pagefind renders it lazily) and also call `search.triggerSearch('')` and show `.search-empty` again. Only add this if reproduction shows the built-in behaviour fails.
- Don't change the search filter buttons or Pagefind configuration otherwise.

**Verify.** In a build with a real index, dark and light mode: type `개발` → results; click `비우기` → input empty, results gone, empty-state text back; label right-aligned with no box.

---

## Global verification checklist

1. `npm run content:validate` and `npm test` pass.
2. `npm run build` succeeds (this also runs Pagefind).
3. Browser screenshots (dark + light) for issues 1–6.
4. `git status` shows only: `astro.config.mjs`, `package.json`, `package-lock.json`, `src/utils/rehype-external-links.mjs` (new), `src/styles/global.css`, `src/layouts/BlogPost.astro`, `src/components/TableOfContents.astro`, `src/components/Header.astro`, `src/pages/[lang]/search.astro`, `HRD01.mdx`, this doc — plus the user's pre-existing untracked files untouched. Revert any temporary launch.json entries.
5. Add `src/utils/rehype-external-links.mjs` to the utilities table in `CLAUDE.md`.
6. Do not commit.
