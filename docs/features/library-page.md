# Library Hub Page

## Purpose

The Library hub is the first public entry point for the human-reviewed Library data model. It introduces the curated sections and shows a small set of approved public resources and active topics.

Paper cards moved off the Library hub onto the Research hub (`/{lang}/research/`, `docs/decisions/site-structure.md`): the Library's claim is "here is a good reference for X," while a paper card is a study-log entry ("here is what I studied"). The `papers` content collection itself is unchanged — only where it renders moved.

The current implementation also adds first-pass section listing pages. It does not add ingestion, private candidate storage, comments, authentication, payments, newsletters, or a database.

The broader product direction is documented in [`docs/decisions/discover-direction.md`](../decisions/discover-direction.md). The hub should stay broad enough to represent the whole AI-native curation service, not only the Design Library.

## Supported Sections

The hub and section pages cover:

- Design
- Vibe Coding
- Developer Docs
- Useful Feeds
- Decks / Presentations

Cards on the hub link only to the generated section routes listed below.

Future media companion resources may connect videos to these sections through reviewed posts, resource cards, paper cards, topics, and deck references. The current page does not add a video or newsletter surface.

## Route Convention

The current site uses explicit language routes for all supported languages:

- `/ko/library/`
- `/jp/library/`
- `/en/library/`
- `/ko/library/{design,vibe-coding,dev-docs,useful-feeds,decks}/`
- `/jp/library/{design,vibe-coding,dev-docs,useful-feeds,decks}/`
- `/en/library/{design,vibe-coding,dev-docs,useful-feeds,decks}/`

Even though Astro i18n is configured with Korean as the default locale, the existing source and navigation use `/ko/...` links for Korean pages. The Library hub follows that established convention.

## Resource Selection

The page reads from `src/content/resources/` and displays only entries where:

- `status === "approved"`
- `review.humanReviewed === true`

Featured resources are preferred on the hub. Section pages list approved resources for their section, but still keep the display lightweight.

Section resource pages group resources by `category`. Cards show type, tags, localized summary, license public policy, resolved related topics when present, and resolved related deck names when present.

## Paper Selection

Paper cards are not read or rendered here. They surface on the Research hub instead — see `docs/decisions/site-structure.md` and, once written, a dedicated Research hub feature doc.

## The Library page (자료 as a card grid)

`/{lang}/library/` is the curated **자료** list and nothing else (since [Revision 2026-10-23c](../decisions/site-structure.md#revision-2026-10-23c-reading-becomes-a-fourth-public-surface); explainers, signals and weekly notes are the Reading section's, `/{lang}/reading/`). Order, per Content First: the page label (`.subpage-intro` + `h1.eyebrow`, as on `/research/`), the **category tab row**, then the **card grid**. The page uses the site-wide 980px frame like every other section (Content First rule 6).

- **Tabs** ([`AreaTabs`](../../src/components/library/AreaTabs.astro), [`AreaIcon`](../../src/components/library/AreaIcon.astro)): "전체 N", then one tab per 분야 from `src/data/libraryAreas.ts` that has at least one item (기타 last), each a 20px line icon in the area's tint, the label and a mono count (`getAreaTabs()`, `src/utils/library-area-tabs.ts`). Real buttons with `aria-pressed`; selecting one filters the grid through the shared `public/scripts/blog-filters.js` (facet `area`, URL param `area`, `localStorage` key `hunbot-library-area`; clicking the active tab clears it). Active tab = ink text + 2px accent underline; the row has one 1px rule under it and scrolls sideways on narrow screens (scroll-snap, faded edges, no wrap). The bar is `hidden` in the markup and revealed by the script (`[data-js-only]`), so without JavaScript every card shows.
- **Grid**: 3 columns from 820px, 2 from 560px, 1 below; 1.25rem gap; equal height per row.
- **Card** ([`ResourceCard`](../../src/components/library/ResourceCard.astro)): `--paper-light`, 1px `--rule`, 6px radius, 1.5rem padding; the whole card is an internal link to the item's page, `/{lang}/library/item/{id}/` (no new tab, no ↗; the page carries the original link). Top to bottom: the item's **preview image** when it has one (resource `image.src`; picks have no image field) in a 2:1 frame at the card's inner width (`object-fit: cover`, 6px radius, 1px `--rule`, lazy, explicit `width`/`height`, responsive srcset where the helper has one, `alt=""`), otherwise the **monogram tile** (56px, the item's first letters in the serif on a 20% mix of the area tint with a 1px tint border; `getMonogram()`); a "노트" badge only when the item has an owner note (top right, over the image's corner on a paper pill when there is an image); the title (22px, the largest type on the card), the delivered `summary` (4 lines) and the kind plus up to two topic labels as soft chips. Hover (pointer devices only): the card lift system, the image zooms to 1.04 inside its frame (`--dur-4`, `--ease-standard`) or the tile scales to 1.04; nothing shifts. No logos or favicons are fetched.
- **Tints** are identity marks for 분야 only: see "Area tints" in [`docs/ops/ui-conventions.md`](../ops/ui-conventions.md).
- The 주제 / 종류 / 노트 있음 filters of the previous layout are gone; `LibraryFilterBar` now serves only the 신호 view. `LibraryRow` was removed.
- Item pages (one per published item, noindex until a note exists), backlinks and link previews: see [`item-notes.md`](../content/item-notes.md). `<LinkCard href="..." />` embeds the same facts as an inline card in MDX.

## Topic Selection

The page reads from `src/content/topics/` and displays only topics where:

- `status === "active"`

Topics are shown as lightweight cards for future filtering and recommendation workflows.

## Deck Selection

Decks moved off the Library and onto the Research hub (`docs/decisions/site-structure.md`#2): the `/{lang}/research/decks/` page reads from the local deck registry in `src/data/decks.ts`. It does not accept arbitrary URLs from content and does not use external document viewers. `/{lang}/library/decks/` permanently redirects there.

Deck cards show available viewing formats such as local HTML deck, PDF fallback, static slide count, and reviewed PPTX source availability. PPTX remains secondary and is only shown when deck metadata gates it as reviewed.

## Localization Fallback

Localized text resolves in this order:

1. Current language (`ko`, `jp`, or `en`)
2. Korean
3. English
4. Japanese
5. Empty string

Korean is the primary editorial fallback because approved public Library data requires Korean review text.

## Human Review Rule

Public Library content must be human-reviewed before publication. AI drafts may be used as private drafting aids, but public entries must not be published unless the relevant review metadata confirms human review.

The hub only renders approved public data from the repository. It does not read private candidate notes or generated drafts.

## Pagefind

The Library hub is server-rendered as static HTML and includes Pagefind metadata:

- `language`
- `section=library`

Section pages also add `library-section` as a Pagefind filter. This lets the existing search foundation index the Library without adding client-side JavaScript to these pages.

Section pages remain server-rendered static HTML. The current discovery depth uses category grouping and resolved relationship metadata instead of client-side filter controls.

## Validation

Run:

```sh
npm run library-page:validate
```

The validator checks source wiring, generated section routes after build output exists, Pagefind metadata, and the approved/human-reviewed filtering rules.

## Future PRs

Future work may add:

- Library-specific Pagefind filters
- Deeper Design, Vibe Coding, Developer Docs, Useful Feeds, and Deck section pages
- YouTube/media companion links after reviewed metadata exists
- Private candidate storage
- Review/promote CLI
- Automated ingestion from approved sources
- Local LLM draft summary generation
- Newsletter companion material after product scope is approved
