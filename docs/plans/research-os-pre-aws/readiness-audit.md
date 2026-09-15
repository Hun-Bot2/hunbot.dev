# Pre-AWS Readiness Audit

Audited: 2026-09-14. Method: direct inspection of schemas, validators, content, CI, and routes — not filenames, and not prior conversation.

Scope question: *what must be completed before introducing the AWS Research OS, so that temporary or inconsistent data structures are not frozen into DynamoDB, queues, APIs, or vector metadata?*

## How This Audit Was Done

1. Read `src/content.config.ts` in full — the schemas are the contracts that would be frozen.
2. Enumerated `scripts/` and `package.json` scripts against what the ADRs say should exist.
3. Enumerated `src/content/**` and `src/pages/**` to establish what is actually built versus described.
4. Read `.github/workflows/ci.yml` to establish the real enforcement gate.
5. Counted content state rather than sampling it.
6. Grepped for canonicalization, deduplication, and content-hash logic across `src/` and `scripts/`.

Step 6 found nothing, which is the most consequential result in this audit.

---

## Implementation Reality

**FACT — CI is strong and is the repository's real architecture.** `.github/workflows/ci.yml` runs 13 validators, `node --test test/`, and a full build on every push and PR. Source-level validators run before the build so content errors fail in seconds. This is an asset, not debt, and every prerequisite below should land as a validator rather than a convention.

**FACT — the public site's boundaries are enforced, not merely documented.** `scripts/validate-product-boundaries.mjs` asserts an exact approved API-route list, forbids payment/auth/newsletter dependencies, and fails if feedback is rendered as markup. `scripts/validate-library.mjs:7-13` forbids the field names `rawhtml`, `rawpdftext`, `fullpdftext`, `largecopiedtext`, `copiedabstract` anywhere in public collections. The public/private boundary is already machine-checked.

**FACT — Discover is entirely unimplemented.** `grep -rln "discover" src/ scripts/` matches exactly one file, a blog post. There are no `/discover/` routes, no `src/data/discoverFacets.ts`, no `scripts/validate-taxonomy.mjs`, and no `taxonomy:validate` script in `package.json`. Discover Phases 1, 2, and 3 from [`discover-direction.md`](../../decisions/discover-direction.md) are all unstarted.

**FACT — the Library collections contain only sample data.** Three resources, one paper, one topic — every one of them explicitly labelled a sample for schema validation. Content volume is effectively zero.

**FACT — tests exist but are not reachable from `package.json`.** `test/blog-routing.test.mjs` and `test/view-counter.test.mjs` run in CI via `node --test test/`; there is no `npm test` script, and `AGENTS.md` §3 states "Test: Not currently defined". A sub-agent following `AGENTS.md` would conclude there is no test infrastructure. There is.

### Content State

| Language | Files | Drafts | Placeholder tags | Placeholder series | Placeholder category |
|---|---|---|---|---|---|
| ko | 87 | 37 | 19 | 15 | 19 |
| jp | 55 | 50 | 4 | 0 | 4 |
| en | 57 | 28 | 4 | 0 | 4 |

`npm run blog:validate` reports 199 files validated and **14 files excluded** by the frontmatter quality gate, 12 of them sharing `duplicate title+pubDate` within `ko/devlog/ON-THE-BLOCK/`.

**FACT — the blog tag vocabulary is uncontrolled.** 176 distinct tag values across all languages; 164 after case-folding. **12 values differ only by case** (`vlm`/`VLM`, `local llm`/`Local LLM`). 36 distinct raw `category` values in Korean alone, collapsed to 4 display buckets by `normalizeCategory()` in `src/utils/blog.ts`.

---

## Documentation Reality And Mismatches

Each row is a documented decision checked against implementation.

| # | Decision | Source | State | Evidence |
|---|---|---|---|---|
| D1 | Topic `parent` / `order` / `aliases` / `mergedInto` | discover-direction, Phase 1 | **Absent** | `src/content.config.ts:221-246` has none of the four |
| D2 | `scripts/validate-taxonomy.mjs`, wired into `content:validate` | discover-direction, Phase 1 | **Absent** | Not in `scripts/`; `content:validate` chains 6 validators, none taxonomy |
| D3 | 4 domains, ~36 topics | discover-direction | **Absent** | One topic file exists: `src/content/topics/ai-agents.md` |
| D4 | `contentType` / `depth` / `publishedAt` / `canonicalLanguage` / `whyRelevant` | discover-direction, Phase 2 | **Absent** | Resource and paper schemas carry none |
| D5 | `src/data/discoverFacets.ts` | discover-direction, Phase 2 | **Absent** | `src/data/` holds decks, learningPaths, mediaCompanions, reviewTopics |
| D6 | Replace hard-coded fallback chains with canonical-language resolution | discover-direction, Phase 2 | **Absent** | Chains still literal at `src/utils/library.ts:61` and `:78`, exactly as the ADR predicted |
| D7 | Venue registry: canonical ID, aliases, tier, access, `signalAvailability` | research-discovery-system | **Contradicted** | `topics.venues` is `z.array(z.string())`; `ai-agents.md` stores `["ICLR","ICML","NeurIPS","ACL","EMNLP"]` as bare strings. `papers.venue` is a free string |
| D8 | No single numeric quality score | research-discovery-system | **Contradicted** | `src/content.config.ts:157-167` defines `signals.topicScore`, `sourceScore`, `usefulnessScore`, `freshnessScore`, and `totalScore` (0–20) |
| D9 | Provenance tier (`VERIFIED`/`RADAR`) separate from honors | research-discovery-system | **Contradicted** | `papers.decision` at `:147` is one enum conflating both: `accepted, oral, spotlight, poster, preprint, workshop, rejected, unknown`. It cannot express "accepted **and** oral" |
| D10 | External IDs as a **map** (DOI among the schemes) | research-discovery-system | **Contradicted** | `papers.source` has fixed `openReviewId`, `semanticScholarId`, `arxivId` columns and no DOI scheme at all. **Corrected 2026-09-14 (T01):** this row originally read "DOI required". `research-discovery-system.md:274` requires the *map*, never a required DOI — requiring one would make preprints unrepresentable. The map is the contradiction; DOI is a supported scheme, not a mandatory field |
| D11 | One entity per *work*, with `same_work_as` | research-discovery-system | **Absent** | No identity-linking field; `papers.id` is a hand-written slug |
| D12 | Deterministic dedup, canonical URL first | discover-direction, Ingestion | **Absent** | No canonicalization, dedup, or content-hash code anywhere in `src/` or `scripts/` |
| D13 | Blog draft filter through `getAllPosts()` | site-hardening §6 | **Implemented** | Enforced by `scripts/validate-blog-content.mjs` |
| D14 | Placeholder-frontmatter exclusion | CLAUDE.md | **Implemented** | `getFrontmatterIssues()` in `src/utils/blog.ts` |
| D15 | Public/private field boundary | library-data-model | **Implemented** | `forbiddenFieldNames` in `scripts/validate-library.mjs` |

### Conflicts Requiring Human Judgment

Two rows above are genuine contradictions between approved records, not merely unbuilt work. **This audit does not pick a side.**

**C1 — `signals.totalScore` versus the signal sheet (D8).** The `papers` schema implements a composite 0–20 score. [`research-discovery-system.md`](../../decisions/research-discovery-system.md#quality-signals) decides the opposite: *"no single numeric quality score… A paper carries a signal sheet"*, plus *"the system never ranks a CHI paper against an OSDI paper on quality."* The schema predates the ADR. Either the ADR supersedes the schema and `totalScore` is removed, or the ADR is amended to permit a within-field composite. **Human decision required.** See `T01`.

**C2 — `papers.decision` versus the provenance model (D9).** One enum currently carries acceptance status and honors. The ADR requires them separate, because provenance tier drives TTL, display separation, and ranking eligibility. Splitting the field is a breaking schema change to a collection with one sample record — cheap now, expensive after DynamoDB holds items keyed on it. **Human decision required** only on whether the public `papers` collection adopts the split, or whether the split lives solely in the private item contract. See `T01`.

A third, quieter conflict is worth naming:

**C3 — where the canonical research item lives.** [`library-data-model.md`](../../features/library-data-model.md) states *"The public collections are not a private candidate store."* [`research-discovery-system.md`](../../decisions/research-discovery-system.md#storage-shape) puts the corpus in a local relational store. [`research-os-cloud-architecture.md`](../../decisions/research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution) puts personal state in DynamoDB and keeps the corpus local. The public `papers` collection is therefore a **published projection**, not the canonical item. No code or document currently says so, and nothing stops a future agent from treating `papers` as the item model. See `T02`.

---

## Classification

Ordered by what actually gets frozen into infrastructure. The test applied to each item: *if a note, queue message, or DynamoDB key is written against today's shape, what breaks later, and can it be repaired without touching stored data?*

### BLOCKER — must be resolved before any AWS resource exists

| ID | Item | Why it is a blocker |
|---|---|---|
| B1 | **Canonical item identity** (D10, D11) | DynamoDB partition keys and every note, queue state, and reading-state record are keyed on item identity. Today that is a hand-written slug with no DOI and no external-ID map. Changing it after persistence orphans every note — and notes are the one thing [`research-discovery-system.md`](../../decisions/research-discovery-system.md#research-notebook) identifies as unrecomputable |
| B2 | **Provenance representation** (D9, C2) | `VERIFIED` versus `RADAR` determines TTL, display separation, and ranking eligibility. The cloud ADR applies TTL to Radar candidates and permanence to saved items. A field that cannot express the distinction cannot drive that behavior, and TTL is destructive |
| B3 | **Deterministic canonicalization and dedup** (D12) | No such code exists. The dedup key *is* the DynamoDB primary key. Without it, the same work arrives as a paper, a repo, and three blog posts and creates duplicate rows whose notes cannot be merged afterwards |
| B4 | **Topic ID lifecycle** (D1, D2) | Notes and saved items reference topic IDs. `aliases` and `mergedInto` are the mechanism that lets a topic be renamed or merged without breaking stored references. The ADR designed this lifecycle; nothing implements it. Renaming a topic after persistence silently breaks references with no migration path |
| B5 | **Corpus / personal-state boundary as a written contract** (C3) | The cloud ADR's cost and durability model depends on DynamoDB holding *only* small personal state. Nothing in the repository defines the boundary, so the first implementing agent will guess |

### REQUIRED — before the first AWS *write path* ships

| ID | Item | Why |
|---|---|---|
| R1 | **Venue registry** (D7) | Free-form venue strings written into item records become permanent dirty data. The registry is already a decided design; it is cheap now and a migration later |
| R2 | **C1 resolved and recorded** (D8) | Ranking fields written to persisted items must match the decided model, or the score is recomputed against a schema that no longer exists |
| R3 | **Facets and canonical language** (D4, D5, D6) | `canonicalLanguage` is the field the shared fallback resolver keys on; items persisted without it cannot be rendered consistently later. `publishedAt` is required for the Radar TTL decision |
| R4 | **Queue/API payload contract** | Queue messages are a wire format. An unversioned payload cannot be evolved once messages are in flight |
| R5 | **Vector-readiness field set** | See [Vector Readiness](#vector-readiness). Small, and cheap only if decided now |
| R6 | **Test/validator harness reachable from `package.json`** | Every prerequisite above lands as a validator. Sub-agents must be able to run and extend them without discovering the harness |

### RECOMMENDED — valuable, not blocking

| ID | Item | Why not blocking |
|---|---|---|
| N1 | Author the 4 domains and starting topics (D3) | The *mechanism* (B4) is what gets frozen. The *content* can be authored at any time and is a content change by design |
| N2 | Boundary-validator hardening | Extends existing enforcement; the boundary is already checked |
| N6 | **Non-deterministic build output** | **FIXED 2026-09-16, and the original entry understated it.** Not one unsorted list but four: the Library hub sliced topics *and* papers with no comparator at all, while `sortPapersByFreshness`, `getFeaturedResources`, `sortBlogPostsByDate` and `sortAcademicReviewsByDateDesc` ended on a key that ties (title, or date alone) and left the rest to input order. `src/utils/ordering.ts` now supplies one shared total order — ties fall back to id by code point, deliberately not `localeCompare`, which varies with the runtime's ICU data. Also fixed `sitemap.xml`, which stamped `lastmod` from the build clock: false (a rebuild changes nothing), self-defeating (search engines discount an unreliable `lastmod`), and the last artifact that differed between builds. **Verified by building twice and diffing: all 162 HTML pages and the sitemap are byte-identical.** Held by 9 tests using a seeded shuffle, proven to fail when the sort is removed. | Fixed |
| N5 | **Alias-aware topic resolution across every validator** | **Added 2026-09-14, from a bug T04 surfaced.** `discover-direction.md:96-97` guarantees that on rename *"item tags still resolve"* and on merge *"items re-resolve to the target automatically"*. Three validators checked topic references and only one honoured that: `validate-taxonomy.mjs` resolved aliases, while `validate-library.mjs:45` and `validate-learning-paths.mjs:27` each built a bare `Set` of current ids. Promoting `ai-agents` to `agents` broke both. Fixed by extracting `scripts/lib/topic-resolution.mjs` and sharing it. **The general lesson: the same invariant implemented independently in three places will diverge** — and this one is the mechanism that will later protect stored note anchors in DynamoDB, so it had to be right before AWS, not after. Note this is deliberately *not* the venue rule, where alias-only references are rejected: that was a one-time normalisation, whereas topics carry a lifecycle guarantee |
| N4 | **Display values for stored ids** | **Added 2026-09-14, from a real regression.** T05's venue migration made the public Library pill render `iclr` instead of `ICLR`, because a stored canonical id was being rendered directly. Fixed by adding `shortName` + `getVenueDisplayName()`. The general rule — *a stored identifier is never a display value* — applies to every id-bearing field T09 migrates, and is now recorded in T09's packet |
| N3 | Clean up the 12 duplicate `ON-THE-BLOCK` files | Already excluded from every public surface by the existing gate |
| N7 | Contract fixtures are 11,085 lines of committed near-duplicate | T10 added 11 fixtures under `test/fixtures/validate-research-contract/`, each a full copy of the ~1,000-line contract with one mutation. They were generated from the real file, but they are *stored* static — so when the real contract's shape changes they become copies of an obsolete shape that still pass. Generating them in test setup from the real file would be ~15 lines and would remove the drift. Recorded 2026-09-15; not pre-AWS, and the checks themselves are verified correct. | Observation — owner's call |

### DEFER — explicitly not pre-AWS work

| ID | Item | Why deferred |
|---|---|---|
| F1 | **Blog tag/category/series normalization** (176 tags, 36 categories) | The Research OS stores *papers and research items*, not blog posts. Blog `tags` are free-form strings with **no code path connecting them to the `topics` collection** — verified by inspecting `src/utils/blog.ts` and `src/content.config.ts`. It is a real prerequisite for the site's knowledge-graph and reading-path *visualisation* work, per [`creative-direction.md`](../../decisions/creative-direction.md#prerequisite-the-metadata-problem) §Phase 0, and it is **not** a prerequisite for AWS. Keeping it out holds the pre-AWS set to schema work rather than 199 files of content editing |
| F2 | Discover routes, surface, RSS (Phase 3) | Public-site work. No AWS dependency in either direction |
| F3 | Embeddings, vector store, graph store | Explicitly out of scope. Only field *compatibility* is in scope |
| F4 | Ingestion adapters, collectors | Belong in the private pipeline repository, after the contracts exist |
| F5 | AWS infrastructure itself | Out of scope by definition |

**Scope discipline note.** F1 is the largest single body of work visible in this repository and the most tempting to bundle. It is deferred on evidence: no code path connects blog frontmatter to the research item model. Bundling it would roughly triple the pre-AWS set and delay AWS for reasons unrelated to AWS.

---

## Vector Readiness

Assessed per the instruction to require only fields justified by migration safety, and to add no speculative schema.

| Field | Verdict | Justification |
|---|---|---|
| Canonical item ID | **Required** | Already B1. A vector record without a stable join key is unusable |
| Content hash / version | **Required — the only genuinely new field** | Determines when a stored embedding is stale. Without it, re-embedding is either unconditional or wrong. It also does double duty as a dedup input for B3, so it is justified twice over |
| Language | **Required** | Already R3 via `canonicalLanguage` |
| Topic IDs | **Required** | Already exist; stability is B4 |
| Document type | **Required** | Already exists as `type` / planned `contentType` |
| Timestamps | **Required** | Already exist as `firstSeenAt` / `lastCheckedAt` |
| Provenance | **Required** | Already B2 |
| Chunk ↔ document relationship | **Deferred** | Chunking strategy is unknown and unknowable before a retrieval design exists. A stable document ID is sufficient to attach chunks later. Adding a chunk model now would be speculative bloat |

**Conclusion: vector readiness adds exactly one field — a content hash — beyond what identity, provenance, and dedup already require.** That is the entire cost of not foreclosing embeddings, and it is small enough that deferring it has no upside.

---

## What Does Not Need Fixing

Recorded explicitly so later agents do not re-open settled ground:

- The CI pipeline. It is the enforcement mechanism the plan builds on.
- The public/private field-name boundary in `validate-library.mjs`.
- The blog draft and placeholder gates.
- The blog routing, RSS, sitemap, and SEO layer. No task in this plan touches it.
- Astro, Vercel, or the static-first architecture. Nothing here changes the public site's runtime.
- The `academicReviews` collection. It is a separate public content type with no Research OS coupling. **OPEN** whether it should eventually reference a canonical paper ID; not pre-AWS.
