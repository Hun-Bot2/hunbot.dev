# 2026-10-05 — Editorial archives, one filter, floating controls

Session decision log for branch `feat/atelier-redesign`. Follows
`2026-10-04-theme-reveal-and-page-polish.md`.

## Writing and Library archives

Both lists are now one continuous single column in the same editorial style
(`src/components/blog/PostRow.astro`, `src/components/library/LibraryRow.astro`,
shared `src/styles/entry-list.css`): thin rules, the whole row is the link, small
**borderless** thumbnails on the left, quiet mono metadata.

- **Writing**: thumbnail → `MM.DD` (the year is the section heading) → serif
  title → description (2 lines, secondary) → category · series. Series is shown
  only when it has more than one post. Year sections 2026 / 2025; no page intro,
  no counts in the title.
- **Library**: thumbnail → title → resource `summary` (localized, falls back per
  the language policy) → kind · topic ↗; sections by area (분야), registry order,
  기타 last. `LibraryItem` gained `description`; `getLibraryItems(…, lang)`.
- The earlier paged / tabbed / compact-overview experiments were dropped. Paging
  hid most of each list (against "overview first"), so it was removed.

## One filter

All facets (Writing: category, year, series; Library: area, topic, kind) live in
the floating filter panel; the duplicate tab rows and `ViewTabs` were removed.
Interaction (`public/scripts/blog-filters.js`, `BlogFilterBar.astro`):

- applies on selection, no Apply button; whole rows are targets with hover
  tint and a visible keyboard focus ring;
- the panel opens/closes with a 200ms fade (+6px slide; sheet slides up on
  phones) and stays out of the tab order while closed;
- the active filter survives closing and reload (URL + localStorage); the button
  shows a count badge and a quiet accent tint, and a `×` beside it clears
  everything in one click; the panel's reset is a bordered button;
- changing results: removed posts fade out in place (120ms), then the new list
  fades in where it sits (160ms). **No travel**: an earlier version slid
  survivors from their old positions (FLIP) and read as the list flying upward
  (rows far down moved hundreds of px). Interrupted changes land on the last
  state; `prefers-reduced-motion` applies changes immediately.
- The panel is an overlay, so the list does not reflow when it opens (only when
  results change).

## Floating controls

Default positions moved inward: `--float-inset` (tokens.css) puts the filter, globe,
TOC pill and back-to-top just outside the content column on wide screens
(16px clear of the content for the widest, 72px control); below ~1100px it falls
back to 1rem. Dragged positions (sessionStorage) are unchanged.

## Verification and limits

Measured in real Chrome (Playwright headless): row counts, single column, image
loading (42/44 Library images are real, 2 are the typographic frame), filter
states and URL, animation phases and timings, interruption, reduced motion, panel
visibility/tab order, hover/focus styles. Screenshots were inspected for layout.
Not done: mobile polish (rows are long on phones; the bottom sheet was not
retuned), real-device touch testing, and a cross-browser pass beyond Chrome.
