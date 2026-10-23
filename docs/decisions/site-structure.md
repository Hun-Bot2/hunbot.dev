# Site Structure: Writing, Research, Library

Status: Decided by the repository owner, 2026-09-26. Implemented on `feat/site-structure-research-hub` (2026-09-26) — verification: `npm run build`, `content:validate`, `ui:validate`, `routes:validate`, `links:validate`, `seo:validate`, `csp:validate`, `product:validate`, `homepage:validate`, `blog:listing:validate`, `search:validate`, and `npm test` all pass; no sample or `TEMP:` string in `dist/client/**/index.html`; `/{lang}/research/` exists for ko/jp/en; zero topic pages generated (0 approved papers today, as expected). Revised by the repository owner, 2026-09-27 — see [Revision 2026-09-27](#revision-2026-09-27-research-is-own-content-library-is-curation), which supersedes the parts of this record it contradicts. Revised again 2026-10-04 ([one Library list](#revision-2026-10-04-one-library-list)) and 2026-10-22 ([explainers join the Library](#revision-2026-10-22-explainers-join-the-library)).

Reviewed: 2026-09-27

This record sets the public information architecture of `hun-bot.dev` so that the public site reflects the Research OS loop instead of running ahead of it. It amends [`discover-direction.md`](./discover-direction.md) on topic-page placement only (see [Amendments](#amendments)). It does not change any data contract in [`research-item-identity.md`](./research-item-identity.md) or [`research-os-data-contract.md`](./research-os-data-contract.md).

## Revision 2026-10-23: the Library gets four views

The repository owner decided on 2026-10-23 that the Library has four tabs, **신호** (signals), **해설** (explainers), **주간 노트** (weekly notes) and **자료** (the existing curated list), and that the hero moved from the home page to the top of the Library (the home page went back to its previous design; see [`creative-direction.md`](./creative-direction.md#the-exceptions)). This revision supersedes two earlier statements, by supersede-not-delete: the text below stays as history. Feature doc: [`docs/features/signals-and-weekly.md`](../features/signals-and-weekly.md).

1. **"Library is one list, no tabs" (2026-10-04, #1) and "explainers lead the one list" (2026-10-22, #3).** Both are superseded. The reasoning of 2026-10-04 still holds for what it was about: 외부 링크 versus Useful Feeds was *where an item was written*, which a visitor cannot see, so **자료 stays the one curated list** (resources and picks together, one floating filter). It does not hold for the three new kinds. A signal, an explainer and a weekly note are the owner's own judgement layered on external material, and a visitor sees the difference at once and reads them differently: a signal is scanned (a dated ledger, seconds per row), an explainer is read long, a weekly note is read once a week. Each gets its own view because each has its own reading mode, its own ordering (by day kept, by date written, by issue) and its own filter or none. Explainers therefore leave the 자료 list and its 종류 facet loses the `explainer` value on the list (the kind label stays, used by the hero and the search index).
2. **The angle that separates this site from a news site: every item shows the owner's judgement and where it led.** A signal carries a verdict (확인함 / 의심 / 해볼 것) and the one line on why it was kept; an explainer carries a claims ledger (the source's claim, the owner's judgement, how to check it); a weekly note carries last week's questions answered and the questions carried forward. "Where it led" is **derived, never stored on the earlier record**: explainers and blog posts declare the `signals` they grew out of (the same declared-on-the-later-artifact rule as `papers` and `informedBy`), and the signal row derives its "→ 해설" / "→ 글" links, withholding any that point at something unpublished.
3. **A view with no published items is not shown.** The tab is omitted from the bar and the route is not generated (`getStaticPaths` returns no paths), the same "no thin pages" rule the topic pages and pick sections follow. 자료 always exists, so the Library is never without a view. Sample data stays unpublished (*Placeholder Content Is Unpublished*): the fixtures are `review.status: "draft"` with a `TEMP:` title and render nowhere.
4. **Routes.** `/{lang}/library/` is the Library hero, the tab bar and 자료. `/{lang}/library/signals/`, `/{lang}/library/explainers/` and `/{lang}/library/weekly/` (with `/{lang}/library/weekly/{issue}/` and `/{lang}/library/weekly/rss.xml`) are the other views; `/{lang}/library/explainers/{slug}/` is unchanged. The three slugs are **reserved** against pick sections (`[section].astro` serves `/{lang}/library/{section}/`): `scripts/validate-picks.mjs` fails if `librarySections` ever uses one.
5. **Languages.** Follow explainers: the content is Korean, shown under each language's chrome; the `jp`/`en` pages of these views are noindex and canonical to `ko`, and the sitemap lists `ko` URLs only.
6. **Weekly notes are published on the web and in RSS only.** No email, no signup, no newsletter provider: `docs/decisions/product-boundaries.md` stands, and `scripts/validate-product-boundaries.mjs` now also fails on a form or an email field anywhere under the Library pages and components.
7. **The Library hero** sits on top of `/{lang}/library/` only and is the one place on the site that moves on its own (four conditions in `creative-direction.md`). Its slides: the latest explainer, the latest weekly note, "today's signals" (the most recent day kept: the count and up to three titles with their verdict stamps), then the newest 자료 items to fill four, so it exists before any of the new kinds is published.
8. **Out of scope.** The pipeline-side export of signals and weekly notes, any model call from this repository, comments, accounts, email delivery.

## Revision 2026-10-22: explainers join the Library

The repository owner decided on 2026-10-22 that the Library gains a new kind of item: the **explainer**, a long-form Korean article that comments on one paper or one piece of external writing. A bot drafts each one and the owner reviews and approves it; nothing unreviewed is ever exported. The structure was built ahead of any data (no export exists yet; two draft fixtures stand in). This revision supersedes nothing by deletion. It narrows one sentence of the 2026-09-27 revision and extends the 2026-10-04 one, as set out below. Feature doc: [`docs/features/explainers.md`](../features/explainers.md).

1. **"Library is curation" (2026-09-27, #3) and "the site never enriches, summarizes, or translates" resources.** That sentence is about `resources`: what the site shows of an exported resource is exactly what was delivered, and the site adds nothing to it. An explainer does not break it, because an explainer is not the site processing a `resource`. It is a **separate collection** (`explainers`) that arrives already written and already reviewed, and it is a new kind of curation: commentary on external material, in its own words, that always names and links its source. It is never a translation or a close paraphrase of the source. The `resources` rule is unchanged and still applies to `resources`.
2. **Research hub boundary.** A paper explainer and a Research `papers` card make different claims: the card says "I studied this" (a dated, bibliographic statement), the explainer says "here is what I understood and what I question". They are **never merged into one record, even for the same paper**. The explainer detail page has a slot that links to the paper card (its anchor on `/{lang}/research/`) **only when a card exists**, joined on identifier (DOI or arXiv id against the card's `source.externalIds`), never on title. The card never lists its explainers (the same declared-on-the-later-artifact, derived-on-the-earlier direction as reviews and posts).
3. **"Library is one list, no tabs" (2026-10-04, #1).** Explainers join the same list, as rows, beside the external rows. No tab is reintroduced. They lead the list as the **first section** (`id="explainers"`, heading 해설, a one-line description, newest first), and do not also appear in an area section; the section renders nothing when there are zero published explainers. A section is not a tab: it is a heading inside the one scrolling list, with one filter over all rows, no separate URL or state, and the same `data-filter-section` hiding as every area section. It is there because explainers are the site's own differentiator and, tagged outside the area registry, they otherwise landed in 기타 at the very bottom. The breadcrumb crumb 해설 on a detail page links to `/{lang}/library/#explainers`. **Decision on a type facet: no new facet; `explainer` becomes one more value of the existing 종류 facet** (tool / repo / site / skill / reference / explainer). Reasoning: the 2026-10-04 revision removed the tabs because the split between 외부 링크 and Useful Feeds was *where an item was written*, which a visitor cannot see, and which therefore filtered nothing a visitor cares about. The explainer/resource difference is the opposite: a visitor sees it immediately (an on-site article with a review badge versus a link to another site), and it is the one thing a reader might reasonably want to narrow by ("only the explainers", or "no explainers"). That argues for a filter. It does not argue for a second filter group, a tab, or a page: 종류 already exists, is already "what kind of thing is this", and is already how the filter works, so one more value costs nothing and splits nothing. On-site versus external is additionally signalled on the row itself (a 2px accent rule on the left edge, no ↗, a 해설 eyebrow).
4. **Languages.** `resources` handles a non-canonical language page by listing the same record on every language's page with the text of the first available language: requested, then canonical, then any (`resolveByLanguagePolicy`, `src/utils/library.ts`). Explainers follow the same rule and are written in `canonicalLanguage: ko` only. The `ko`, `jp` and `en` Library pages all list a published explainer, with the Korean text and `lang="ko"` on it, under that language's page chrome. The detail route exists for all three languages, again the Korean text under localized chrome, with a one-line "available in Korean only" notice on `jp` and `en`; the `jp` and `en` pages carry `rel="canonical"` to the `ko` page and `noindex, follow`, so search engines see one URL. The sitemap lists the `ko` URL only. **There is no machine translation of an explainer**: a second language would be a new explainer in that language, which the schema's `canonicalLanguage` literal would be widened for.
5. **Published means approved and human reviewed.** An explainer is published only when `review.status === 'approved'` (a refine in `src/content.config.ts` and a check in `scripts/validate-explainers.mjs` both tie that to `review.humanReviewed === true` and a `review.reviewedAt` date). Anything else renders nowhere: no listing row, no detail route, no sitemap entry, no search entry. This is the same "Placeholder Content Is Unpublished" rule as for blog posts and reviews, and `getPublishedExplainers()` is the single definition, the way `getAllPosts()` is for posts.
6. **The schema is an allowlist, and its forbidden list lives in the new validator.** Quotes from the source, model names, costs, token counts, verification-check results and private signals can never appear in an explainer. `scripts/validate-explainers.mjs` rejects an unlisted field and rejects those names explicitly, with the reason. The existing forbidden lists in `contracts/research-os/research-item.schema.json` (`x-contract`) also apply to explainers (the validator reads them from that file) but are **not edited**: that file is vendored byte-for-byte by the private repository, so an edit here would leave the private copy stale for a collection it does not own.
7. **Presentation.** The row and the page follow the Atelier rules (`docs/ops/ui-conventions.md`): tokens only, serif titles, mono labels, one accent. A Japanese source is the deliberate differentiator and gets the loud chip (accent border and text); English and Korean sources get the quiet chip. The review badge is its own reusable component (`ProvenanceBadge`) with fixed segments, so `authorship: 'owner'` and an unreviewed state can be added without a layout change. The detail page reuses the blog shell (`.article-page`, `.prose`, table of contents, reading controls) and leaves out comments, the view counter and feedback.
8. **Out of scope.** The pipeline-side export, any model call from this repository, comments, subscriptions, newsletters, and Discover. The home page's Library block still lists external items only; explainers appear in the Library list.

## Revision 2026-10-04: one Library list

The repository owner made these decisions on 2026-10-04 ("라이브러리에 외부링크, 라이브러리에서 고른것 이런 애들이 정확하게 뭔지 모호함"; chose "탭 하나로 합치기"). They supersede #3 and #5 of the 2026-09-27 revision below.

1. **The Library is one list, no tabs.** 외부 링크 (`picks`, written here) and Useful Feeds (`resources`, exported from research-os) differed only in where an item was written, which visitors cannot see; on that day 외부 링크 had 0 public items and Useful Feeds had all 44. `/{lang}/library/` now lists approved resources and published picks together (`src/utils/library.ts`'s `getLibraryItems()`), newest first. `/{lang}/library/useful-feeds/` permanently redirects there (`vercel.json`). Pick section pages (`/{lang}/library/{section}/`) still exist so their URLs keep working, without the tab bar.
2. **Cards are image + title** (`src/components/library/LibraryCard.astro`): the preview image from research-os (og image or reviewed screenshot, WebP ≤ 1200 px in `public/images/resources/`, `resources.image` in `src/content.config.ts`), else a typographic card drawn from the title. Summaries are not shown on the card.
3. **Filtering reuses the blog's floating filter** (`BlogFilterBar.astro` + `public/scripts/blog-filters.js`, now parameterized by facet names and storage key): facets **분야** (디자인 / 코드·프론트엔드 / AI 엔지니어링 / 데이터 시각화 / 배움·생각 도구 / 창작 / 기타; tag → area map in `src/data/libraryAreas.ts`), **주제** (the resource's first tag, or a pick's section; once an area is picked only its topics are offered), and **종류** (tool / repo / site / skill / reference). A tag no area lists falls into 기타 and `library-page:validate` warns.
4. **Home has one Library block** (three newest items as cards) instead of "Useful Feeds" + "Library에서 고른 것". The "research-os" label is gone from the public site.

## Revision 2026-09-27: Research is own content, Library is curation

The repository owner made the following decisions on 2026-09-27. They supersede the parts of this record listed in [What This Revision Supersedes](#what-this-revision-supersedes); nothing below is deleted from the record it changes — the earlier text stands as history, and the change is recorded here, matching the convention in [`research-item-identity.md`](./research-item-identity.md#what-this-record-supersedes).

1. **Research is the owner's own research content**: paper cards (study log), academic reviews, learning paths, Featured Topics (the `topics` collection), and the owner's own decks. `/{lang}/research/` stays a first-class menu item, stays in the sitemap, and the home "논문 리뷰" block links to it.
2. **Decks move out of the Library** to `/{lang}/research/decks/`. Paper-presentation decks and project decks are listed there; a deck links to its related blog post when one exists. Test fixtures (`sample-deck`, `sample-slide-deck`) and the non-presentation `ontheblock-privacy-policy` legal document are not listed. Deck asset URLs under `/decks/` do not move. `/{lang}/library/decks/` permanently redirects to `/{lang}/research/decks/`.
3. **The Library has two URL-addressable tabs**: **외부 링크** (default, `/{lang}/library/`) — a new hand-curated `picks` collection of external tools and sites — and **Useful Feeds (research-os)** (`/{lang}/library/useful-feeds/`) — the existing `resources` collection, holding only items the owner hand-selected in the private research-os. Useful Feeds items render as delivered (title, source, date, link, and a summary only if the item already carries one); the site never enriches, summarizes, or translates them, and noncommercial lectures are link-only. The label may say "research-os" but never links to the private repository. The old "Useful Feeds" section card is replaced by the tab.
4. **The Library is not Discover.** The planned `DiscoverItem` feed stays deferred (see [`discover-direction.md`](./discover-direction.md)).
5. **외부 링크 layout**: a "최근 추가" strip (latest non-draft picks by `addedAt`), then picks grouped by popularity tier **필수 / 인기 / 발굴** with section filter chips; section pages use the same grouping, filtered. "발굴" is presented as hidden gems, not a lower rank. Empty sections are hidden rather than shown as "0개 / 준비 중".
6. **Popularity**: GitHub repos get a tier computed from stars; non-repo sites get a manual tier; a manual `tier` always overrides. Thresholds live in data (defaults: 필수 ≥ 10k★, 인기 ≥ 1k★, otherwise 발굴). Stars come from a committed snapshot (`src/data/popularity.json`, refreshed by an offline script using the official GitHub REST API), never fetched at build time, and are shown with the snapshot date.
7. **Pick dates and freshness**: `createdAt` (tool creation; automatic for repos from GitHub `created_at`, optional manual for sites), `lastActivityAt` (automatic for repos from GitHub `pushed_at`), `addedAt` (owner added it, manual), `checkedAt` (owner last verified it, manual, bumped by a script). Badges: "확인 필요" when `checkedAt` is older than 6 months; "업데이트 멈춤" when `lastActivityAt` is older than 12 months. Both thresholds live in data.
8. **외부 링크 holds external resources only.** The owner's own works (TouchDesigner, art, music) belong in posts or the future `experiments` collection ([`creative-direction.md`](./creative-direction.md#portfolio-decision)).
9. **Primary navigation stays 글 / 연구 / 라이브러리.**

### What This Revision Supersedes

| Superseded | Where | Replaced by |
|---|---|---|
| Library row: "Curated references: design, dev-docs, vibe-coding, useful-feeds, decks" | [Position](#position) surfaces table | Decks move to Research (#2 above); `useful-feeds` becomes one of two Library tabs, alongside the new `picks`-backed 외부 링크 tab (#3 above) |
| Any statement elsewhere in this record that decks live in, or render under, the Library | throughout | `/{lang}/research/decks/`, redirected from `/{lang}/library/decks/` (#2 above) |

## Problem

**Design has outrun content.** Measured on 2026-09-26 from a production build:

| Surface | Design and infrastructure | Real public content |
|---|---|---|
| Decision records | ~4,500 lines in `docs/decisions/` | — |
| Paper cards | identity, provenance, venue registry, vendored contract | 1 sample (`Sample Paper Title`) |
| Resources | 5 sections, facet registry | 3 samples |
| Topics | 32 active nodes | none has a real item attached |
| Academic reviews | dedicated layout and 6 components | 0 in git — the one local file is a `TEMP:` placeholder, gitignored (`.gitignore:33`) |
| Learning paths | dedicated routes | 1 |
| Blog | filters, quality gate, validators | 38 ko / 28 en / 5 jp published |

Two defects follow directly:

1. **Placeholder content is live.** The sample paper card and sample resources are `status: approved`, so they render on `/ko/`, `/ko/library/`, `/ko/library/design/`, `/ko/library/dev-docs/`, and `/ko/paths/blog-knowledge-hub/`. (Correction, same day: the `TEMP:` review was first listed here as live too. It is gitignored, so it renders only in local builds, never in production — it is set `draft: true` anyway so a local build matches production.) This is the same class of bug the frontmatter quality gate closed for blog posts on 2026-09-23 — placeholder content shipping as if real.
2. **One claim is split across five places.** "I studied this" is currently expressed by the Library's `ai-papers` section, `/reviews`, `/paths`, the blog's paper-review category, and (planned) Discover. A reader has no single place to see what the author has actually studied.

## Position

The public site has **three surfaces, one per stage of the loop** named in `discover-direction.md` (*Collect → Filter → Discover → Select → Study Deeply → Write*):

| Surface | Route | Stage | Claim | Content |
|---|---|---|---|---|
| **Writing** (글) | `/{lang}/blog/` | Write | "Here is what I think" | Blog posts — the human layer. Unchanged. |
| **Research** (연구) | `/{lang}/research/` | Study | "Here is what I studied, and what came of it" | Paper cards as a study log, academic reviews, learning paths, topic pages |
| **Library** (라이브러리) | `/{lang}/library/` | Collect | "Here is a good reference for X" | Curated references: design, dev-docs, vibe-coding, useful-feeds, decks |

Discover (Filter) is **not** built now. See [Discover Is Deferred](#discover-is-deferred).

Primary navigation becomes: **글 / 연구 / 라이브러리**, plus the existing search and utility icons. The header "카테고리" link is removed; the blog index already carries a category filter, and the categories page stays reachable from the blog index.

## The Research Hub

`/{lang}/research/` is a static page built entirely from existing collections. It adds no runtime, no API route, and no dependency. `scripts/validate-product-boundaries.mjs` must pass unmodified.

### Sections, in order

1. **Study log.** Approved paper cards with a non-null `studiedAt`, newest first. This is the public face of C4 in `research-item-identity.md`: a verified bibliographic record plus a dated statement that the paper was studied. Each entry links outward to the authoritative source and inward to any review or post about it.
2. **Selected, not yet studied.** Approved paper cards with `studiedAt: null`. Visibly secondary. This is a reading *log*, not a queue — it states intent, never progress (`readingState` stays forbidden in the projection).
3. **Reviews.** Academic reviews, newest first.
4. **Learning paths.** Published learning paths.
5. **Topics.** Only topics that have at least one linked item. See [Topic Pages](#topic-pages).

**Empty sections do not render.** When the whole hub is empty, it says so honestly in one line rather than showing scaffolding. An empty hub is the correct state today and must not be papered over with samples.

### Linking reviews and posts to paper cards

Links are declared on the **later** artifact and derived on the earlier one — the same "derived, never declared" rule `discover-direction.md` applies to taxonomy.

- `academicReviews` gains optional `paperId` — a `papers` entry `id`.
- `blog` gains optional `papers: string[]` — `papers` entry `id`s the post is about.
- A paper card never lists its reviews or posts. They are found at build time by walking those two fields.
- `scripts/validate-library.mjs` (or a sibling validator) rejects a `paperId` or `papers` value that does not resolve to an existing paper card.

Using the projection `id`, not `itemId`, is deliberate: this is a public-site join between public records, and `id` is the human-chosen, URL-bearing key. `itemId` remains the join key to the private Research OS.

### Topic pages

`/{lang}/research/topics/{topic}/` — generated only for **active topics with at least one linked item**. A topic's items are: approved paper cards whose `topics` resolve to it (via `scripts/lib/topic-resolution.mjs` semantics — stored id, owned alias, or `mergedInto` chain), plus the reviews and posts linked to those papers.

**Why the gate:** all 32 topics are empty today. Generating 32 empty pages would ship the same placeholder defect this record exists to remove, and would submit 96 thin pages (×3 languages) to search engines.

### Retired and redirected routes

| Old | New | How |
|---|---|---|
| `/{lang}/reviews/` (index) | `/{lang}/research/` | Page removed; permanent redirect in `vercel.json` |
| `/{lang}/reviews/{slug}/` (detail) | unchanged | Kept — review detail URLs are stable |
| `/{lang}/library/ai-papers/` | `/{lang}/research/` | Section removed from `librarySections`; permanent redirect |

## Placeholder Content Is Unpublished

- The sample paper card and three sample resources move to `status: draft`. They stay in the repository as schema examples; they no longer render.
- `academicReviews` gains `draft: boolean` (default `false`), filtered in every route, the sitemap, and any listing — the same rule as blog drafts. The `TEMP:` review is set `draft: true`.
- Any validator that relied on the samples being `approved` must be satisfied by a fixture or a relaxed count, never by re-approving placeholder content.

## Discover Is Deferred

`discover-direction.md` §Volume Reality already says Phase 3 should not ship until there are approximately 30 approved items. There is 1, and it is a sample. The record also states Discover Phases 1–3 are independent of the research system, so deferring loses nothing. **Decision:** no Discover route is built until the study log has real volume. Taxonomy work already done (Phase 1–2) stays.

## The Stopping Test, Restated For The Public Site

`research-discovery-system.md` §Research Notebook: *if the user will not keep structured notes on twenty papers, the Idea Graph, synthesis, hypothesis, and experiment layers have no input and should not be built.*

"Notes accumulating" means **the owner studies papers and records what they learned, questioned, or disagreed with** in the private notebook. The public site cannot see notes and must not. Its observable proxy is the study log: **the number of approved paper cards with a non-null `studiedAt`.**

**Decision:** until the study log reaches 20 entries, no further Research OS infrastructure, contract, or decision record is started beyond what is needed to record studying. Work in that window goes to studying and to the Research hub rendering what was studied.

## Out Of Scope

- Cleaning the 20 ko posts with `category: 'category'` and the 37 ko drafts. They are already excluded by the quality gate; cleaning them is an editorial task, not a structural one.
- Japanese coverage (5 published posts). Open question below.
- Re-rendering `blog/categories.astro` against the 4 normalized buckets (ui-ux-plan F7).
- Any graph or interactive visualisation of the research hub (governed by `creative-direction.md`).

## Amendments

- **`discover-direction.md` §Derived, never declared** names `/{lang}/discover/topics/{topic}/` as the topic route. Amended: topic pages live at `/{lang}/research/topics/{topic}/`. When Discover ships, it links to those pages rather than owning its own. One topic, one page.
- **`docs/features/library-page.md` / `library-data-model.md`**: the `ai-papers` section moves out of the Library. The `papers` collection is unchanged.

## Open Questions

1. **Japanese — decided 2026-09-26: leave as is.** 5 jp posts are published; the owner will translate gradually. No structural change to `/jp/`. The research hub still ships jp UI strings, so it is ready as content arrives.
2. **Where `studiedAt` is written.** C4 says the source of truth is the private study log. Until the private repository's projection writes it, it is set by hand in `src/content/papers/`. The first real cards will be hand-authored.

## Verification

`npm run build`, then `ui:validate`, `routes:validate`, `links:validate`, `seo:validate`, `csp:validate`, `product:validate`, `content:validate` all pass. No sample or `TEMP:` string appears in `dist/client/**/index.html`. `/{lang}/research/` exists for all three languages, and no topic page is generated for a topic with zero items.
