# Discover: Product Direction

Status: Direction approved. Implementation phased, not yet started.

Reviewed: 2026-09-10

This record supersedes the deleted `docs/service-plans/001-product-service-direction.md`. It defines what Discover is, how it relates to the blog, the taxonomy it uses, and the order in which it gets built.

## Problem

Too much happens in AI to follow meaningfully. Papers, repositories, engineering blogs, model releases, benchmarks, and product updates arrive faster than any individual can triage. Most are interesting. Very few change how a specific person studies, builds, or does research.

Existing options do not solve this:

- Aggregators (`discuss.pytorch.kr/c/news`) optimize for coverage. The reader still triages.
- Editorial AI blogs (`heisenberg.kr/category/ai`) are professional but reflect one person's fixed interests, which may not match the reader's.

Neither lets a reader say "these four things are what I care about; show me only those."

## Position

Discover is a **filter**, not a coverage play. It does not claim an item is objectively important. It claims an item is **potentially relevant to the topics the reader selected**.

This framing is the differentiator and also the reason the work is sustainable solo: the editorial burden is "is this real, and who would care?" rather than "is this among the most important papers of the year?"

Non-goals:

- Being the fastest AI news source.
- Covering all of AI.
- Ranking research by universal importance.
- Replacing arXiv, Papers with Code, or Hacker News.

## Two Surfaces, Two Roles

| | Discover | Blog / Notes |
|---|---|---|
| Audience | Anyone filtering the AI ecosystem | Readers following one person's learning |
| Volume | Many short items | Few long posts |
| Claim | "This may be relevant to your topics" | "I studied this and here is what I found" |
| Depth | Summary, why it matters, limitations, link | Reproduction, comparison, critique |
| Cadence | Continuous | When something earns it |

The loop between them is: **Collect → Filter → Discover → Select → Study Deeply → Write**.

Discover items may link forward to a blog post that goes deep on them. That link is the visible evidence of the loop and the main reason a reader would trust the filter.

## Placement

Discover lives inside `hun-bot.dev` at `/{lang}/discover/`, not as a separate product or domain.

Rationale: it reuses the existing Astro build, i18n routing, Pagefind index, content collections, and validators. It adds no infrastructure and no runtime cost. The blog already carries the trust; a separate domain would start SEO from zero and split maintenance.

It is a **new surface alongside** the Library, not a replacement for it. The Library stays what it is — hand-picked reference material organized by section (design, dev docs, decks). Discover is time-ordered, faceted, and personalized. They read from overlapping collections but answer different questions: "what is a good reference for X?" versus "what happened recently in the parts of AI I care about?"

## Taxonomy

The taxonomy is **data, not code**. No domain, topic, or facet value appears in a Zod enum, a TypeScript union, a route file, or a component. Every level lives in `src/content/topics/` as one Markdown file per node, and every reference to it is validated by cross-checking the collection rather than by matching a fixed list.

The practical test: **adding, renaming, merging, re-parenting, or retiring any part of the taxonomy must be a content change with no code change and no route regression.** If a taxonomy edit requires touching a `.astro` or `.ts` file, the design is wrong.

### Shape

A topic file gains three fields beyond the current schema:

- `parent` — a topic ID, or `null`. A node with `parent: null` is a domain. This is the only thing that makes a domain a domain.
- `order` — display weight within its parent.
- `aliases` — previously used IDs that must keep resolving.

Nesting is not limited to two levels. Two is what the current interests need; three costs nothing if a topic later needs subdivision.

### Starting set

This is a starting point, not a fixed structure. It is expected to be wrong in places and to change.

**`agents`** — AI Agents & AI Engineering
`coding-agents`, `agent-planning`, `agent-memory`, `context-engineering`, `tool-use`, `multi-agent`, `agent-evaluation`, `model-routing`, `agent-infra`

**`ml-systems`** — ML Systems & Applied Research
`inference`, `training-systems`, `serving`, `retrieval`, `mlops`, `distributed-systems`, `data-systems`, `systems-evaluation`

**`language-multimodal`** — Language & Multimodal AI
`llms`, `nlp`, `speech-ai`, `asr`, `multimodal`, `language-learning`

**`human-centered`** — Human-Centered AI & Learning
`ai-hci`, `personalized-learning`, `education`, `human-ai-interaction`, `productivity`

The existing `src/content/topics/ai-agents.md` is promoted to the `agents` domain and keeps `ai-agents` as an alias.

### Lifecycle

Interests drift, and a taxonomy that cannot absorb that drift silently rots. Each change type has a defined mechanism:

| Change | Mechanism | Effect on existing items |
|---|---|---|
| Add | New file, `status: "active"` | None |
| Rename | Change ID, add old ID to `aliases` | Old URL redirects; item tags still resolve |
| Merge | Set `status: "archived"`, `mergedInto: "<id>"` | Items re-resolve to the target automatically |
| Split | New children, parent stays as an umbrella | Items stay valid on the parent until re-tagged |
| Re-parent | Change `parent` | None; only navigation moves |
| Retire | `status: "archived"` | Hidden from filters, existing pages stay reachable |

Nothing here deletes. Archived topics stop appearing in filter controls but their routes keep resolving, because published links must not break.

### Derived, never declared

Everything downstream reads from the collection at build time:

- Filter checkboxes are generated by walking active topics — not hand-written markup.
- `/{lang}/discover/topics/{topic}/` routes are generated from `getStaticPaths` over the collection, including alias redirects.
- An item's domain is derived by walking its topics to their roots, not stored separately. Storing it would let the two disagree.
- Per-domain RSS feeds are generated per root node, so a new domain gets a feed automatically.

### Validation

A `taxonomy:validate` check enforces what an enum used to: every `parent` resolves, no cycles, no duplicate IDs or aliases, every item's topics resolve to active or merged nodes, and archived topics have no active children. This is what makes a dynamic taxonomy safe rather than merely loose.

## Facets

Beyond topics, each item carries facets that describe the item rather than the reader's interest.

**Content type** — what the thing is. A registry in `src/data/discoverFacets.ts`, not an enum, so a new type is a one-line data change validated by cross-reference:
`paper`, `repo`, `engineering-blog`, `tool`, `benchmark`, `product-release`, `discussion`, `news`

**Depth** — who it is written for. This one stays a closed, ordered set of four:
`beginner`, `practical`, `engineering`, `research`

Depth is deliberately the exception to the dynamic rule. It is an ordered scale used for range filtering and sorting, so its cardinality and order are structural. A fifth value would change what the other four mean.

**Recency** — original publication or release date, not the date it was added.

Content type does not replace the existing `type` field on resources, which stays as-is for Library rendering; breaking that enum would touch every Library route for no gain.

## Item Contract

Every approved Discover item must have: title, original source URL, source name, a short original summary, topic tags, content type, depth, publication date, and a one-line **why this may be relevant**.

Featured items must additionally answer all five questions in the summary body:

1. What changed?
2. Why does it matter?
3. Who should care?
4. What are the limitations?
5. How could this actually be used?

Requiring all five on every item would make the feed impossible to sustain. Requiring them on featured items keeps the standard visible without making volume impossible. This is the intended editorial load, not a temporary compromise.

Language requirements for these fields are in [Language Policy](#language-policy).

## Language Policy

Decided: 2026-09-10.

**Scope: Discover items only.** This policy governs feed items — papers, news, issues, repos, tools, releases, discussions. It does not apply to blog posts, which stay Korean-primary and are unaffected by anything in this document.

Discover is **English-primary**. Korean follows for every item. Japanese is manual and optional.

The reason is source language. Nearly all papers, repositories, and engineering blogs Discover draws from are published in English, so drafting in English keeps the summary close to the source and avoids a translate-then-summarize round trip that loses precision. English → Korean is then a short, cheap translation of already-condensed text.

| Language | Requirement | Produced by |
|---|---|---|
| `en` | Required for every approved item | Drafted from the source |
| `ko` | Required for every approved item | Translated from `en`, human-reviewed |
| `jp` | Optional | Written by hand when an item warrants it |

This makes Discover the **first surface on the site where Korean is not the editorial primary.** The split is deliberate and follows from where the source material lives, but it must be explicit rather than implied, because the current schema and helpers assume Korean everywhere.

The two surfaces are not inconsistent — they serve different things. A Discover item is short, close to an English source, and aimed at anyone filtering the ecosystem. A blog post is a long piece of original thinking written in the author's own language for readers who follow that thinking. Keeping the feed English-primary and the writing Korean-primary is the correct expression of that difference, not a compromise between them.

A consequence: a Discover item may link forward to a Korean deep-dive post. That cross-language link is expected and fine, but the language of the linked post must be labeled, and following it must never silently switch the reader's language preference.

### Canonical Language, Not Per-Surface Fallback

Rather than giving Discover its own `en → ko → jp` fallback chain alongside the Library's `ko → en → jp`, every item declares a `canonicalLanguage`. One rule then covers both surfaces:

**requested language → item's canonical language → any available.**

Library and paper entries are canonically `ko`; Discover items are canonically `en`. Existing content keeps its current behavior with `canonicalLanguage` defaulting to `ko`, so this is additive. Two competing hard-coded chains in the same codebase would be a durable source of confusion; one rule plus a per-item field is not.

This replaces the fallback chains currently hard-coded at [`src/utils/library.ts:61`](../../src/utils/library.ts) and `:78`.

### Consequences For `/jp/`

The Japanese Discover feed will mostly render fallback text rather than Japanese. Two rules follow:

- Untranslated items must be visibly marked as such, not silently served as if Japanese.
- Do not emit a `hreflang="ja"` alternate for a page whose content is fallback English. Claiming a translation that does not exist is worse for SEO than having no alternate, and `BaseHead.astro` is SEO-critical.

Revisit if Japanese coverage ever becomes substantial.

## Personalization Without Accounts

Reader interests are selected through checkboxes and stored **only in the reader's browser**.

- Filter state lives in URL query parameters, so a filtered view is shareable and linkable.
- The last-used selection is mirrored to `localStorage` so it persists across visits.
- Nothing is sent to a server. There is no account, no login, no database, no user record.
- The page renders every approved item as static HTML; the client script only shows and hides. With JavaScript disabled the full feed is visible and usable.

This satisfies the entire personalization spec in the original brief with zero backend. It is the single most important architectural decision here, because it is what keeps Discover inside the existing static-first, no-auth guardrails.

See the amendment in [`product-boundaries.md`](./product-boundaries.md) for why local filter preferences are distinct from the "saved resources" feature that document defers.

## Public / Private Boundary

Unchanged from [`../features/library-data-model.md`](../features/library-data-model.md) and [`product-boundaries.md`](./product-boundaries.md). Discover raises the stakes because it introduces volume.

Public, in Git:

- Approved item metadata and original summaries.
- Topic and domain definitions.

Private, outside the repository:

- Candidate queues and unreviewed items.
- Raw fetched HTML, abstracts, or PDF text.
- Embeddings and any vector index.
- Unreviewed LLM-drafted summaries.
- Private scoring notes.

The human review rule holds without exception: `status: "approved"` requires `review.humanReviewed: true`. AI may draft; AI may not publish. Automating ingestion must never become automating publication.

## Ingestion Architecture

The pipeline is: source → extraction → deduplication → classification → AI draft summary → facet proposal → candidate store → human review → promotion → static build.

### Postgres Is A Candidate Store, Not A Serving Database

The pipeline terminates at **human review**, not at the feed. Approved items are promoted into `src/content/` as Markdown and the public feed is generated at build time from those files, exactly as in Phase 3.

A database that serves the feed directly would mean a running backend, a hosting bill, a migration story, a backup policy, and eventually authentication — and it would put unreviewed rows one query mistake away from being public. Keeping the database strictly on the private side of the boundary means the worst case of a pipeline bug is a bad draft in a review queue, not a bad item on the site.

This is the load-bearing decision in this section. Everything below follows from it.

### The Bottleneck Is Review, Not Compute

Realistic volume is a few hundred candidates per week across all domains, narrowing to perhaps 20–40 that survive filtering, of which one person can meaningfully review a fraction. Every stage before human review is small-data work.

Sizing infrastructure for the collection stage optimizes the part that was never going to be the constraint.

### Run It Locally First

Phase 4 runs on the development machine: a local Postgres (or SQLite until concurrent access is actually needed), scheduled scripts, and a review CLI. No cloud account, no IAM, no VPC, no deployment.

Escalate only when a specific trigger fires, and only to the next rung:

| Trigger | Response |
|---|---|
| Collection must run when the machine is off | Scheduled GitHub Actions job — already available, no new vendor |
| Actions job needs shared state between runs | Managed Postgres free tier |
| Managed free tier outgrown, or heavy embedding work | Reconsider a cloud provider, with numbers |

Most of these triggers may never fire. "Which cloud provider" is the wrong question until at least the second rung is reached; the honest answer at Phase 4 is neither.

### Stage Notes

**Source.** Prefer official feeds and APIs over scraping: RSS/Atom for lab and engineering blogs, the arXiv API for papers, the GitHub API for repositories. Respect `robots.txt` and published rate limits. A source without a feed is a source to reconsider, not a scraping target.

**Extraction.** Use the structured field the source already provides — an arXiv abstract, a GitHub README, a feed summary — before parsing HTML. Extracted text is working data and stays private; storing it publicly would violate the boundary above.

**Deduplication.** Canonicalize the URL first — strip tracking parameters, resolve redirects, normalize host and trailing slash. This catches most duplicates at near-zero cost. Add title normalization next. Reach for embedding similarity only for the cross-source near-duplicates that survive both, since the same work reappears as a paper, a repo, and three blog posts.

**Classification.** The topic schema already carries `positiveKeywords` and `negativeKeywords`. Use them as the first-pass filter: free, deterministic, debuggable, and defined in the same file as the topic itself, so improving classification is a taxonomy edit. Escalate to a model only for items that survive the keyword pass.

**AI draft summary.** Runs only on the small set that survives classification. Drafts fill the item contract fields and are marked `review.aiDraftUsed: true`. Cost at this volume is negligible — far below the monthly cost of the smallest managed database, which is the clearest argument that compute is not what makes this project expensive.

**Facet proposal.** The model proposes topics, content type, and depth. All three are proposals. The review CLI shows them as editable defaults, never as decisions.

**Promotion.** Writes the approved item into `src/content/` with review metadata set. This is a human action and has no automated path.

## Build Order

Each phase is independently shippable and has an exit condition. Do not start a phase before the previous one's exit condition is met.

### Phase 1 — Taxonomy

Add `parent`, `order`, `aliases`, and `mergedInto` to the topic schema. Author the starting domain and topic files. Promote `ai-agents.md` to the `agents` domain with an alias. Add `scripts/validate-taxonomy.mjs` and wire `taxonomy:validate` into `content:validate`.

*Exit:* `npm run build` passes; the validator catches an unresolved parent, a cycle, a duplicate alias, and an archived parent with active children. Verify by adding a throwaway bad topic file and confirming each failure, then deleting it.

### Phase 2 — Facets

Add `contentType`, `depth`, `publishedAt`, `canonicalLanguage`, and localized `whyRelevant` to the resource schema. Relax the hard `summary.ko` requirement to "canonical language required" per [Language Policy](#language-policy) — note the current failure message at [`src/content.config.ts:120`](../../src/content.config.ts) names Korean explicitly and must change with it. Add `depth`, `publishedAt`, and `canonicalLanguage` (defaulting to `ko`, so existing entries are unaffected) to the paper schema. Add `src/data/discoverFacets.ts` and validate `contentType` against it by cross-reference. Extend `scripts/validate-library.mjs` to enforce the item contract on approved items.

*Exit:* validators enforce the contract; adding a new content type requires editing only `discoverFacets.ts`; existing Korean-canonical sample content still builds unchanged; the shared fallback helper resolves requested → canonical → any.

### Phase 3 — Surface

Add `src/utils/discover.ts` normalizing resources and papers into one `DiscoverItem` type. Add `/{lang}/discover/` and `/{lang}/discover/topics/{topic}/`. Filter controls read and write URL params and `localStorage`, in `public/scripts/discover-filters.js` — an external script, not inline, so this does not add new CSP debt (see SEC-005 in [`security.md`](./security.md)). Add per-domain RSS at `/{lang}/discover/{domain}/rss.xml`. Register routes in `src/pages/sitemap.xml.ts` and strings in `src/i18n/ui.ts`.

*Exit:* `npm run build`, `routes:validate`, `seo:validate`, `csp:validate`, `links:validate` pass; feed usable with JS disabled; all three languages render; no `hreflang="ja"` alternate is emitted for fallback-only content.

### Phase 4 — Ingestion

Build the pipeline described in [Ingestion Architecture](#ingestion-architecture), locally, in a **separate private repository**. Keeping it out of this repo is what lets the public repo's guardrails stay meaningful: `scripts/validate-product-boundaries.mjs` rejects database and auth dependencies here, and that check should keep passing rather than be loosened to accommodate private tooling.

Build it in the pipeline's own order, so each stage is usable alone: sources and extraction first, then dedup, then keyword classification, then the review CLI, and only then AI drafting. The review CLI is worth building before the AI stage — reviewing keyword-classified candidates by hand immediately reveals whether the taxonomy is right, which is the thing most likely to be wrong.

*Exit:* one full week of items collected, reviewed, and promoted through the pipeline rather than by hand. No cloud account created.

### Phase 5 — Cadence

Establish and hold a publishing rhythm. Add per-domain RSS to the site footer and the language feeds. Track which items lead to blog posts.

*Exit:* four consecutive weeks of items without a gap.

## Volume Reality

Current approved content is three sample resources, one sample paper, and one topic. The bottleneck is ingestion, not interface.

A useful feed needs roughly 5–15 items per domain per month. Below that the filter has nothing to filter. Phase 3 should not ship publicly until there are enough approved items that a reader selecting a single narrow topic still sees something — approximately 30 items across the four domains.

If sustaining that volume proves impossible after Phase 4, the correct response is to cut domains, not to lower the review standard or auto-publish.

## Success Signals

Meaningful:

- A reader selects topics, returns later, and their selection is still applied.
- Discover items become blog posts, and those posts cite where the item was found.
- Per-domain RSS subscriptions.
- Repeated requests for coverage of a topic that does not yet exist.

Not meaningful:

- Total item count.
- Publishing speed relative to other sources.
- Breadth of coverage.

## Open Questions

- Should a Discover item ever be retired when it becomes obsolete, or does the archive stay permanent with a staleness marker?
- Does the Library eventually fold into Discover as a set of saved filter views, or stay a separate hand-curated surface? Revisit after Phase 4.
- Should topics carry the `positiveKeywords` / `negativeKeywords` already in the schema into Phase 4 as classifier hints, making the taxonomy file the single place that defines both what a topic *is* and how candidates are matched to it? This is attractive but couples curation to ingestion; decide when Phase 4 starts.
