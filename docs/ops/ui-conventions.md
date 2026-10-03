# UI And Accessibility Conventions

The site should feel like a research notebook on paper: quiet, technical, readable, and consistent, without a heavy UI framework. The visual language was set in the Atelier redesign (`docs/plans/2026-10-03-atelier-redesign.md`); this file is the working rulebook for it.

## Shared Rules

- Prefer readable contrast over decorative colour. One accent colour; everything else is ink, paper, and rules.
- Use existing local SVG icon patterns before adding an icon dependency.
- Keep routes and content visible; do not replace useful content with marketing sections.
- Do not use UI copy for internal policy language. Every UI string lives in `src/i18n/ui.ts` (ko/jp/en).
- Never render a stored id (venue, acceptance status, honor, topic) straight into the page; go through the display helpers.

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

- Light values are on `:root`; dark values are on `html.dark`. Always key theme colours on `html.dark`, never on `body.light-theme` / `body.dark-theme` (those are added after first paint and flash the wrong theme).
- Use tokens, not `dark:` variants: a token already follows the theme. Tailwind utilities map to the tokens (`text-ink`, `text-secondary`, `border-rule`, `bg-paper-deep`, `text-accent`).
- No hard-coded hex/rgb colours and no Tailwind palette classes (`slate-*`, `orange-*`) in `.astro` or `.css`. Exceptions: the `theme-color` meta tags in `BaseHead` (cannot read CSS variables), KaTeX and Shiki's own output, and third-party widgets (Giscus, Pagefind, which we theme through their variables).

## Type Scale

| Role | Font | Size |
|---|---|---|
| Article title (h1) | serif 400, tight tracking | `clamp(2.5rem, 5.5vw, 5rem)` |
| Section heading (`.column-heading h2`) | serif 400 | 28px |
| List/card title | serif 400 | 19-23px |
| Lead paragraph | serif | 22px, `--secondary` |
| Prose body | sans (Noto Sans KR/JP; Noto Sans for en) | 17px / 1.85 (ko, jp), 18px / 1.8 (en) |
| Eyebrow, meta, chips | mono (IBM Plex Mono), uppercase, 0.09em tracking | **min 11px** |
| Secondary description | sans | **min 13px** |

- Headings are serif, body is sans (long Korean text in serif is too heavy), labels are mono.
- Never go below **11px** for mono labels or **13px** for secondary sans text.
- On viewports up to 720px the root font size is 18px (`global.css`), so rem-based sizes grow slightly on phones; do not fight it with px values.

## Lists, Not Cards

- Present collections as **rule-separated rows** (`.rule-list`, `.writing-entry`, `.paper-reading-list` rows): 1px `--rule` between rows, no shadows, no rounded card surfaces. The title turns `--accent` on hover.
- The one grid is the Library `.knowledge-item` grid (4 columns at 1100px+, 2 at 640px+, 1 below); items are still separated by rules, not boxed.
- Page headers use `.subpage-intro` (eyebrow + one line); section heads use `.column-heading` (serif title, mono link on the right, `--rule-strong` underline). Empty sections either do not render or show a single `.empty-line`.
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

- Posts: `heroImage` through `getResponsivePublicImage()` when present, otherwise a generated `art/WritingPreview` SVG (3 variants). List thumbnails are 126x84, square-cornered, `object-fit: cover`, hidden below 640px.
- Picks and feeds: `art/ResourceVisual` (plot, archive, mechanism, bars, blocks, sphere). Each pick `kind` owns a variant family.
- The variant is chosen by a **hash of a stable id** (`pickVariant()` in `src/utils/display.ts`: post id or pick slug), never by list index, so the same item shows the same picture on every page and every deploy.
- Generated art is decorative: `aria-hidden="true"`, `data-pagefind-ignore`, no JavaScript, no motion.

## Responsive

- Breakpoints: **540 / 800 / 1100px**. Two supporting values exist: 640px (page-frame gutter step from 16px to 32px per side, and the list thumbnail cut-off) and 720px (root font size). Header collapses to the hamburger below 1100px; the article TOC becomes a floating panel below 1100px.
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
