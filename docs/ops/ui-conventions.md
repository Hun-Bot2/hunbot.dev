# UI And Accessibility Conventions

The site should feel like a research notebook on paper: quiet, technical, readable, and consistent, without a heavy UI framework. The visual language was set in the Atelier redesign (`docs/plans/2026-10-03-atelier-redesign.md`); this file is the working rulebook for it.

## Shared Rules

- Prefer readable contrast over decorative colour. One accent colour; everything else is ink, paper, and rules.
- Use existing local SVG icon patterns before adding an icon dependency.
- Keep routes and content visible; do not replace useful content with marketing sections.
- Do not use UI copy for internal policy language. Every UI string lives in `src/i18n/ui.ts` (ko/jp/en).
- Never render a stored id (venue, acceptance status, honor, topic) straight into the page; go through the display helpers.

## Content First

Adopted 2026-10-23 (owner decision), after a hero slider and a poster masthead were both built and removed. Design starts from the content a page actually has, and every page leads with it.

1. **Content comes first.** On list and hub pages the order under the site header is: the page label (`.subpage-intro` with the `<h1>` as `.eyebrow`, as on `/research/`), the page's own navigation if it has any (tabs, filter), then content. No hero, masthead, poster, banner or intro section sits above the content.
2. **Every visible element carries content**: an item, a fact about it (date, kind, source, state, count), or a way to reach it. Purely decorative layers are not added to list, hub or reading pages. Generated visuals are allowed only where they stand in for missing content (a thumbnail without an image).
3. **The largest type is the thing being read**: an item title, a post title. Never a section name, a page label or chrome.
4. **A view explains itself through its content.** Labels on items (a verdict stamp, a source-language chip) say what they mean. If a view needs a paragraph to be understood, redesign the view instead of adding the paragraph.
5. **Empty is shown as empty**: one quiet line, never placeholder or sample content (see *Placeholder Content Is Unpublished* in `docs/decisions/site-structure.md`).
6. **Chrome is small and the same everywhere.** Page labels, tabs and filters look and sit the same in every section, so moving between 글, 연구, 라이브러리 and 탐색 changes the content, not the frame.

## Tokens

All colours come from `src/styles/tokens.css`; fonts and `--content-max` live there too.

| Token | Use |
|---|---|
| `--paper`, `--paper-light`, `--paper-deep` | Page background, raised surface, inset/code/box surface |
| `--ink` | Body text and headings |
| `--secondary` | Informative secondary text (descriptions, meta labels). Meets 4.5:1 in both themes |
| `--faint` | Decoration only (about 3:1 on light paper); never for text that carries information |
| `--rule`, `--rule-strong` | Row separators / section rules and input underlines |
| `--accent` | Links on hover, active state, focus ring, blockquote bar. Light value is darkened for AA text contrast |
| `--state-reviewed`, `--state-reading`, `--state-success`, `--state-error` | Status chips and form feedback |
| `--stage`, `--stage-ink`, `--stage-muted` | The always-dark surface (deck frames) |
| `--lift-shadow` | The soft shadow of a lifted card (hover system below) |

- Light values are on `:root`; dark values are on `html.dark`. Always key theme colours on `html.dark`, never on `body.light-theme` / `body.dark-theme` (those are added after first paint and flash the wrong theme).
- Use tokens, not `dark:` variants: a token already follows the theme. Tailwind utilities map to the tokens (`text-ink`, `text-secondary`, `border-rule`, `bg-paper-deep`, `text-accent`).
- No hard-coded hex/rgb colours and no Tailwind palette classes (`slate-*`, `orange-*`) in `.astro` or `.css`. Exceptions: the `theme-color` meta tags in `BaseHead` (cannot read CSS variables), KaTeX and Shiki's own output, and third-party widgets (Giscus, Pagefind, which we theme through their variables).

## Type Scale

| Role | Font | Size |
|---|---|---|
| Article title (h1) | serif 400, line-height 1.2, letter-spacing -0.015em, `text-wrap: balance` (`keep-all` for ko) | `clamp(2rem, 1.4rem + 2.6vw, 3rem)`; its minimum stays above the `.prose h2` maximum |
| Section heading (`.column-heading h2`) | serif 400 | 28px |
| List/card title | serif 400 | 19-23px |
| Lead paragraph (`.article-lead`) | serif, max 40ch (30em for ko/jp) | `clamp(1.0625rem, 0.95rem + 0.6vw, 1.3rem)`, `--secondary` |
| Prose body | sans (Noto Sans KR/JP; Noto Sans for en) | 17px / 1.85 (ko, jp), 18px / 1.8 (en) |
| Eyebrow, meta, chips | mono (IBM Plex Mono), uppercase, 0.09em tracking | **min 11px** |
| Secondary description | sans | **min 13px** |

- Headings are serif, body is sans (long Korean text in serif is too heavy), labels are mono.
- Never go below **11px** for mono labels or **13px** for secondary sans text.
- On viewports up to 720px the root font size is 18px (`global.css`), so rem-based sizes grow slightly on phones; do not fight it with px values.

## Article Reading Layout

- Header (breadcrumb, eyebrow, title, lead, meta, tags) and body share one container, the `.page-frame` width (`--content-max`, 980px) and one left edge. Never centre a narrower column under a wider header.
- Text blocks (`p`, lists, `blockquote`, headings, `hr`, footnotes), the series nav and the feedback box are capped at `--prose-measure` (46rem, about 43em at the 17px body size). Everything else in `.prose` (code `pre`, tables, figures and image-only paragraphs, KaTeX display, embeds, review components) may use the full container width, never past the viewport. `pre`, tables and KaTeX scroll inside themselves on phones; the page itself never scrolls horizontally at 375px.
- Header bottom padding is 1rem and the gap to the body 1.5rem; keep it tight so the title block flows into the text.
- Posts (`BlogPost.astro`) and academic reviews (`AcademicReviewPost.astro`) share this shell through `prose.css`; change both together.

## Motion And Hover

One easing family and one duration scale, defined in `tokens.css`. Use these and nothing else: no one-off `160ms ease`.

| Token | Value | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | Default: colour, opacity, fades, zooms |
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | Long decelerations: reveals, rises |
| `--ease-spring` | `cubic-bezier(.34, 1.4, .64, 1)` | Small overshoot: hover lifts, arrows, pills |
| `--dur-1` | 120ms | Press |
| `--dur-2` | 200ms | Hover colour, small state |
| `--dur-3` | 360ms | Hover lift, popovers |
| `--dur-4` | 700ms | Thumbnail zoom, long fades |
| `--dur-5` | 1100ms | Long reveals |

- The site does not move on its own (the home-page hero was removed on 2026-10-23, the Library hero the same day; only the footer cat moves unprompted, `docs/decisions/creative-direction.md`). Everything else moves because the reader did.
- The global `prefers-reduced-motion: reduce` rule in `global.css` turns every transition and animation off. Write animated states so that "no animation" is the resting state (keyframes with only a `from`), and nothing may depend on `animationend` for correctness.
- **Hover system** (`global.css`, "Hover system"; pointer devices only under `@media (hover: hover)`, keyboard `:focus-visible` gets the same treatment):
  - Editorial rows (`.entry`, home post / brief / review rows): a `--paper-light` plate bleeds 0.75rem past the column (a pseudo-element, so the row's own rule keeps its width), the thumbnail zooms to 1.04 inside its frame, the title turns accent, a trailing `.entry-arrow` nudges 3px.
  - Cards (`.knowledge-item`, `.library-card`): lift `translateY(-2px)` with `--ease-spring`, border to `--rule-strong`, `--lift-shadow`; pressed `scale(.995)`. The padding and 1px border are reserved in every state (compensated by a negative margin), so nothing shifts.
  - No hover effect may change layout or text wrapping.

## Lists, Not Cards

- Present collections as **rule-separated rows** (`.rule-list`, `.writing-entry`, `.paper-reading-list` rows): 1px `--rule` between rows, no resting shadows, no rounded card surfaces. The title turns `--accent` on hover.
- The one grid is the Library `.knowledge-item` grid (4 columns at 1100px+, 2 at 640px+, 1 below); items sit unboxed at rest; the 1px border and `--lift-shadow` appear only on hover or keyboard focus (Motion And Hover).
- Page headers use `.subpage-intro` (eyebrow + one line, 14px bottom padding; the blog index is the eyebrow alone); section heads use `.column-heading` (serif title, mono link on the right, `--rule-strong` underline). Empty sections either do not render or show a single `.empty-line`.
- Shared Library/Research row, tab, and grid styles live in `LibraryPageStyles.astro`; list rows in `src/styles/lists.css`.

## Chips

- `.chip`: 1px `--rule-strong` pill, mono 11px, uppercase, `--secondary`. Use for category, tags, topics, tier, freshness.
- `.state-chip--reviewed`, `--reading`, `--recommended`, `--queue` tint a chip for paper state. Meaning is carried by the text label, never by colour alone.
- Button-like controls opt in explicitly: `.btn-text` (mono label + underline) or `.btn-pill` (chip-shaped). Plain `<button>` has no styling by default (Tailwind preflight); do not reintroduce a global button style.

## Focus And Keyboard

Every page using the shared header should expose:

- a visible skip link to `#main-content` (`.skip-link`, first focusable element)
- one main landmark with `id="main-content"`, carrying `atelier-page` (hubs and lists) or `article-page` (posts and reviews)
- visible `:focus-visible` outlines on links, buttons, inputs, selects, summaries, and textareas (2px `--accent`, 4px offset, defined once in `global.css`)

Icon-only buttons must have an accessible label. Interactive targets (header actions, tabs, pagination) are at least 40px tall. `prefers-reduced-motion: reduce` turns transitions and animations off globally.

## Actions And Links

- Use clear action labels such as "Open resource", "Open post", or "Back to Library".
- External links that open a new tab must use `rel="noopener noreferrer"` and show the `↗` marker.
- Do not make disabled-looking rows active links.

## Thumbnails

- Posts: `heroImage` through `getResponsivePublicImage()` when present, otherwise the original default `/images/blank.png`. List thumbnails are 126x84 (72x48 below 640px), square-cornered, `object-fit: cover`.
- Picks and feeds: `art/ResourceVisual` (plot, archive, mechanism, bars, blocks, sphere). Each pick `kind` owns a variant family.
- The variant is chosen by a **hash of a stable id** (`pickVariant()` in `src/utils/display.ts`: pick slug), never by list index, so the same item shows the same picture on every page and every deploy.
- Generated art is decorative: `aria-hidden="true"`, `data-pagefind-ignore`, no JavaScript, no motion.

## Lines and links

- One boundary, one line: a section heading rule is the top edge of its list, rows are separated by `border-top` on every row but the first (`.rule-list > * + *`), and there is no outer line below the last row. Check by measuring adjacent `border-top`/`border-bottom` in the browser, not by eye.
- A fully linked row or title needs no button-style "view / open ↗" link. Section-level links are one quiet mono text link (`.text-link`, no arrow). `↗` appears only on external links in prose.
- There is no site footer. Every page keeps `5rem` of bottom padding (`.atelier-page`, `.article-page`); GitHub, LinkedIn, RSS and search live in the header and mobile menu.

## Responsive

- Breakpoints: **540 / 800 / 1100px**. Two supporting values exist: 640px (page-frame gutter step from 16px to 32px per side, and the list thumbnail size step) and 720px (root font size). Header collapses to the hamburger below 1100px; the article TOC is a draggable pill that opens a compact dropdown at every width. The language control is the floating globe only; the header carries GitHub/LinkedIn icons, and there is no logo mark.
- Mobile side gutters are 16px (`.page-frame`); no horizontal scroll at 375px.
- Controls wrap instead of shrinking text until unreadable. Avoid viewport-width font scaling except the article title `clamp()`.
- Avoid horizontal overflow in rows, chips, and action rows.

## Validation

Run:

```sh
npm run ui:validate
npm run build
npm run ui:validate
```

The validator checks the shared skip link, key main landmarks, focus styles, and generated output when build artifacts exist. For visual changes also check light and dark at 1440 and 375px.

## Floating controls

All floating controls are `position: fixed`, paper-coloured with a 1px `--rule-strong` border (no blur, no shadow), and draggable with pointer events (`src/utils/floating.ts`: 4px click threshold, a drag swallows the click that follows it (a document-level capture listener, so outside-click handlers never see it either; move/up are tracked on the document, and pointer capture is deliberately not used because it retargets the click away from a wrapper's inner button), clamped to the viewport and below the sticky header, position kept in `sessionStorage`). Popovers open under their trigger on the side with room.

| Control | Default position | z-index | Where |
|---|---|---|---|
| Language globe (`FloatingLanguagePicker`) | top right, `header-height + 12px`, `right: 1rem` | 90 (menu 95) | every localized page |
| TOC pill (`TableOfContents`) | right edge, `top: 12rem` (`8.5rem` below 640px) | 90 (panel 95) | posts, reviews |
| Back to top + progress (`ReadingControls`) | bottom right | 90 (progress line 101) | posts, reviews, after 400px |
| Filter (`BlogFilterBar`) | left, `header-height + 12px`; bottom-left below 640px (panel = bottom sheet) | 90 (panel 95) | blog index |

Controls sit below the sticky header (z-index 100) so the mobile menu covers them. The globe and TOC defaults never overlap; both can be dragged anywhere. Do not add a fourth control without checking these positions.
