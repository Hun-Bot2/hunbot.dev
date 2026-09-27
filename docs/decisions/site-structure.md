# Site Structure: Writing, Research, Library

Status: Decided by the repository owner, 2026-09-26. Implemented on `feat/site-structure-research-hub` (2026-09-26) — verification: `npm run build`, `content:validate`, `ui:validate`, `routes:validate`, `links:validate`, `seo:validate`, `csp:validate`, `product:validate`, `homepage:validate`, `blog:listing:validate`, `search:validate`, and `npm test` all pass; no sample or `TEMP:` string in `dist/client/**/index.html`; `/{lang}/research/` exists for ko/jp/en; zero topic pages generated (0 approved papers today, as expected). Revised by the repository owner, 2026-09-27 — see [Revision 2026-09-27](#revision-2026-09-27-research-is-own-content-library-is-curation), which supersedes the parts of this record it contradicts.

Reviewed: 2026-09-27

This record sets the public information architecture of `hun-bot.dev` so that the public site reflects the Research OS loop instead of running ahead of it. It amends [`discover-direction.md`](./discover-direction.md) on topic-page placement only (see [Amendments](#amendments)). It does not change any data contract in [`research-item-identity.md`](./research-item-identity.md) or [`research-os-data-contract.md`](./research-os-data-contract.md).

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
