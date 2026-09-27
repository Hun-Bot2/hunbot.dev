# Site Structure: Writing, Research, Library

Status: Decided by the repository owner, 2026-09-26. Implemented on `feat/site-structure-research-hub` (2026-09-26) — verification: `npm run build`, `content:validate`, `ui:validate`, `routes:validate`, `links:validate`, `seo:validate`, `csp:validate`, `product:validate`, `homepage:validate`, `blog:listing:validate`, `search:validate`, and `npm test` all pass; no sample or `TEMP:` string in `dist/client/**/index.html`; `/{lang}/research/` exists for ko/jp/en; zero topic pages generated (0 approved papers today, as expected).

Reviewed: 2026-09-26

This record sets the public information architecture of `hun-bot.dev` so that the public site reflects the Research OS loop instead of running ahead of it. It amends [`discover-direction.md`](./discover-direction.md) on topic-page placement only (see [Amendments](#amendments)). It does not change any data contract in [`research-item-identity.md`](./research-item-identity.md) or [`research-os-data-contract.md`](./research-os-data-contract.md).

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
