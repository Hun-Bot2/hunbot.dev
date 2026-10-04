# Explore / Living Atlas — InfoVis and Interaction Design

Status: **Design approved 2026-10-04. Phase 1 (contract, validation, adapters) complete. Phase 2 (core Living Atlas at `/{lang}/explore/`) implemented 2026-10-04, awaiting visual review.**
First draft 2026-10-03 · Revised 2026-10-04 with owner decisions (see [Decision log](#decision-log-2026-10-04)) · §2 updated to the as-built Phase 1 contract.

Constraint: the Atelier UI (`docs/plans/2026-10-03-atelier-redesign.md`, `docs/ops/ui-conventions.md`) is fixed. This document adds information and interaction *on top of* it: paper, ink, 1px rules, serif titles, mono labels, one accent, floating controls in the margins. Nothing here changes tokens, type scale, or list styles. The header gains one navigation item (§4.1).

Depends on, and does not override:

- `docs/decisions/creative-direction.md`: the gimmick test, interactive modules, "the site never moves unless the reader moved first", 3D only where the third dimension carries information.
- `docs/decisions/research-discovery-system.md`: verified / claimed / candidate edge classes, *candidate edges are never displayed*, Idea Graph edges are human-confirmed or they do not exist.
- `docs/decisions/research-os-data-contract.md`: the public projection publishes only human-reviewed, regenerable data.

---

## 0. The design in one paragraph

Explore is a top-level surface (`/{lang}/explore/`) built as a **lineage timeline**, not a graph. Time runs left to right. The five activity domains (Learn / Research / Build / Collect / Create) are horizontal lanes. Each published artifact is one mark in its lane at its date; projects and experiments are short spans. When the site has few links, they are all drawn. As links accumulate, the default view quietens to marks only, and hovering or selecting reveals relations. Selecting a mark lights up its whole **lineage** in the accent colour and opens an inspector in the right margin, where the visitor can **walk the chain** (`paper → project → experiment → writing`). Above the lanes, a **pipeline strip** shows the Research OS reading funnel (`discovered → selected → reviewed → used`) as aggregated counts. Individual corpus papers never appear unless they have a public card. Explore ships from day one in a deliberately designed **sparse state** and grows visibly with the site. Hun-Bot reads all of this through a **public artifact contract** that Hun-Bot owns. It never reads Research OS's internal schema.

---

## Decision log (2026-10-04)

| # | Decision | Where |
|---|---|---|
| D1 | Explore is its own top-level nav item, not under Research | §4.1 |
| D2 | Define a Hun-Bot-owned **public artifact contract** first; Research OS adapts to it; no coupling to Research OS internals | §2 |
| D3 | `projects`, `experiments`, `works` are designed as Hun-Bot collections that emit public artifacts | §2.5 |
| D4 | **No opening threshold.** Explore ships early with a designed sparse state and grows visibly | §4.2 |
| D5 | The article-level lineage strip is permanent, alongside Explore | §4.8 |
| D6 | Research OS papers stay aggregated, but by **pipeline stage**, not one monthly count | §2.4, §5.1 |
| D7 | Unverified `relatedTo` never appears as a public lineage edge | §1.3, §2.3 |
| D8 | `j`/`k` heading navigation is a hidden power-user enhancement; the floating TOC remains primary | §8.1 |
| D9 | Long code blocks are **not** auto-collapsed; collapse/expand is available | §8.1 |
| D10 | Papers/Library margin panels appear **on demand**; the default layout stays single-column | §8.2 |
| D11 | Default domain is derived from kind/category with an explicit per-item override; every emitted artifact carries the **resolved** domain explicitly | §2.2, §2.7 |
| D12 | Blog category → domain mapping is centralized (`src/data/artifactDomains.ts`); posts carry no domain metadata | §2.7 |
| D13 | `/projects/` and `/works/` are reserved; no empty pages and no Gallery nav item until there is real content | §2.5 |
| D14 | Korean nav label is **탐색**; "Living Atlas" stays the visualization's internal/display name | §4.1 |
| D15 | Pipeline aggregates start at top-level topics only; the contract can deepen later without a version change | §2.4 |
| D16 | Edge visibility is an **isolated, tunable policy**, not a hard 20-link rule | §4.2 |
| D17 | **Create is reserved for genuinely creative artifacts** (creative coding, visual experiments, artwork). Reflective/general writing maps to Learn; the writing fallback is Learn; individual posts are corrected through overrides | §2.7 |
| D18 | Paper rows carry a stable `#paper-<id>` anchor; paper artifacts link straight to it | §2.6 |
| D19 | The Build lane's size is data, not a design problem: no rebalancing, normalizing, or downsampling. Marks keep exact x; rows only avoid collisions | §4.12 |
| D20 | Axis customization is a registry of valid mappings with progressive disclosure: the axis label is the control | §4.12 |
| D21 | Topic has no data (0 of 47 artifacts carry a topic) and stays dormant until it does | §4.12 |
| D22 | Series joins the public artifact contract as an optional field and becomes the second Y axis; posts without a series are "standalone" | §2.2, §4.12 |
| D23 | Type stays implemented but hidden until the data holds more than one artifact kind | §4.12 |
| D24 | The legend explains only what is visible: x, rows, selection. Relations and type shapes appear only when meaningful | §4.12 |

---

## 1. Information model

### 1.1 What exists today (FACT, 2026-10-03)

| Source | Count | Notes |
|---|---|---|
| `blog` (published, all langs) | ~200 files, ~91 ko | Dated, has category/series. Tags still partly unreliable |
| `papers` | 1 (sample) | Carries Research-OS-shaped fields (`itemId`, `provenance`, …) |
| `academicReviews` | 2 | `paperId` link |
| `picks` | 3 | Collect |
| `resources` | 3 (samples) | |
| `topics` | 32, hierarchical | The curated taxonomy |
| projects / experiments / works | none | Designed in §2.5 |
| declared relations | `blog.papers[]`, `academicReviews.paperId` | Two edge types exist |

Explore will start mostly as Writing with few links. §4.2 makes that state look intended, not broken.

### 1.2 Artifact kinds (nodes)

| Kind | Default domain | Time shape | Produced by |
|---|---|---|---|
| `paper` | Learn | point (studied date) | `papers` collection now; Research OS export later |
| `review` | Research | point | `academicReviews` |
| `writing` | by category map (§11 Q2), overridable | point | `blog` |
| `project` | Build | span | new `projects` |
| `experiment` | Research (or Create) | span | new `experiments` |
| `resource` | Collect | point | `picks` (and `resources` once real) |
| `work` | Create | point | new `works` |

**A topic is not an artifact.** It is a region that connects many artifacts. It acts as filter, highlight, and inspector context, never as a peer node; a hub topic as a node becomes a hairball centre.

**Domain** is one primary value per artifact (it decides the lane) plus optional secondary domains (shown in the inspector only). One mark, one lane.

### 1.3 Relations (edges)

The vocabulary is small and closed, held in a registry (`src/data/relationTypes.ts`, data not Zod enum). Owner-authored edges are **declared on the later artifact**, as `academicReviews.paperId` and `blog.papers` already are.

| Relation | From → To | Declared on | Basis |
|---|---|---|---|
| `informed` | paper/resource/writing → project/experiment/writing/work | target | declared |
| `uses` | project/experiment/work → resource | source | declared |
| `developedInto` | project ↔ experiment | target | declared |
| `resultedIn` | experiment/project → writing/work | target | declared |
| `explains` | writing/review → project/experiment/paper/work | source | declared |
| `cites` | paper → paper | producer (Research OS) | verified only |

**`relatedTo` is not in the registry (D7).** `research-discovery-system.md` names `related_to` as the most dangerous relation because it is a candidate edge wearing a verified edge's name. Research OS may keep such edges privately. The public contract has no value that can carry them (§2.3), so they cannot leak by accident. Paper ↔ paper links in public come only from VERIFIED `cites`, or indirectly ("both papers `informed` this project").

The brief's "idea" step lives in the private, human-confirmed Idea Graph and is **not a public node in v1**. The public chain is `paper → project → experiment → writing`. An idea can later appear as an optional label on an edge.

### 1.4 Derived structures (build time)

- **Lineage of X**: transitive closure upstream and downstream, depth ≤ 4.
- **Chains**: maximal paths that cross ≥ 3 domains; candidates for featured stories.
- **Growth facts**: totals, first date, last-added date, artifacts added in the last 30 days.
- **Topic footprint**: topics resolved through `scripts/lib/topic-resolution.mjs`.
- **Pipeline aggregates**: per period × topic × stage counts (§2.4), read from the producer, never derived from individual corpus papers on this side.

---

## 2. Public artifact contract (Hun-Bot ⇄ Research OS)

### 2.1 Principle

```
 Research OS internal schema ──► [Research OS exporter] ──┐
   (items, personal state,         owned by Research OS    │
    edge classes, embeddings)                              ▼
                                               PUBLIC ARTIFACT CONTRACT  ◄── owned by Hun-Bot
 Hun-Bot collections ─────────► [Hun-Bot adapters] ───────┘   (contracts/public-artifact/)
   (blog, papers, reviews, picks,     src/utils/artifacts/            │
    projects, experiments, works)                                     ▼
                                                     Explore · lineage strip · Papers/Library
```

- **Hun-Bot owns the contract.** Research OS writes an exporter that maps *its* internals onto it. Hun-Bot never imports, vendors, or interprets Research OS's internal schema. The existing `contracts/research-os/` (vendored by the private repo, about the internal research item) is **not** extended for this. It stays as is.
- **Two producers, one shape.** Hun-Bot's own collections pass through adapters into the same shape. Explore and the lineage strip consume *only* the contract, so they work identically whether an artifact was authored in this repo or exported from Research OS.
- **Contract, not API.** Research OS output arrives as committed JSON files (`src/data/research-os-export/`), reviewed in a PR like any content. The build never calls Research OS. Hun-Bot builds and deploys with the export absent.
- **Opaque references only.** An artifact may carry `sourceRef` (e.g. a Research OS item id) as an opaque string for the producer's own round-tripping. Hun-Bot never parses it, joins on it, or displays it.

### 2.2 `PublicArtifact` (v1, as built in Phase 1)

Normative: `contracts/public-artifact/public-artifact.schema.json`. Vocabulary: `src/data/publicArtifactVocabulary.ts`. Types: `src/utils/artifacts/contract.ts`.

One producer emits one **export**: `{ contractVersion: 1, producer, generatedAt, artifacts[], relations[], aggregates[] }`.

```jsonc
{
  "id": "project:asr-pipeline",        // "<kind>:<local id>": namespaced, so kinds and producers can't collide.
                                       // Local id is lowercase, no spaces/":"/"?"/"#"; Unicode allowed (Korean blog slugs)
  "kind": "project",
  "domain": "build",                   // ALWAYS explicit and resolved by the producer; consumers never derive it
  "domainsAlso": ["research"],
  "title":   { "ko": "…", "en": "…" }, // ≥ 1 key of ko | en | jp | original; never machine-filled
  "summary": { "ko": "…" },            // same shape, or null
  "time": { "start": "2025-03", "end": null }, // YYYY-MM or YYYY-MM-DD; "end" only on span kinds (null = ongoing)
  "state": "ongoing",                  // per kind: paper selected|studied; spans planned|ongoing|paused|finished|abandoned; others published
  "topics": ["asr"],                   // ACTIVE topic ids, already resolved through aliases/merges
  "href": { "ko": "/ko/projects/asr-pipeline/" }, // internal paths only
  "externalUrl": null,                 // the outside source (papers, resources)
  "landmark": false,
  "addedAt": "2026-10-02",
  "origin": "hunbot",                  // must equal the export's producer
  "sourceRef": null                    // opaque producer reference; never parsed or displayed
}
```

**Minor revision 1.1 (D22): optional `series`.** `series: { id, title } | null`, absent for producers that predate it, so contract version stays 1. `id` is a language-independent lowercase lane key; `title` is the series name per language, and every artifact of one series carries the same id and title (validated). Hun-Bot emits it for blog writing. Blog `series` is free text per translation and not always spelled the same ("블로그 개발일지" / "Blog Devlog" / "blog-devlog"), so `src/utils/artifacts/series.ts` links spellings using only the data: spellings on translations of the same post are one series, and spellings that normalize to the same string (case, spaces, underscores folded to hyphens) anywhere are one series. No translation dictionary and no fuzzy matching; what stays unlinked stays separate, and spellings that disagree within a language are reported as warnings by `artifacts:validate`. `seriesOrder` is not part of the contract.

Relations are top-level, directed, and carry no authoring metadata:

```jsonc
{ "from": "paper:whisper", "to": "project:asr-pipeline", "rel": "informed", "basis": "declared" }
```

`title.original` holds text whose language is not a site language or is unknown (a paper's source title, a pick's name). Objects are **closed**: an unknown field is an error, so new fields arrive only through a contract version.

Rules enforced by `scripts/validate-artifacts.mjs` (`npm run artifacts:validate`, part of `content:validate`):

- Schema enums equal the vocabulary registry (drift between the document and the code fails the build).
- `id` matches `<kind>:<local>` and is unique across all producers; a producer may emit only the kinds the registry allows it (Research OS: `paper`, `resource`).
- Domain is present and valid; point/span time shape is right; dates are real calendar dates; `end ≥ start`; state is valid for the kind; topics are active ids; hrefs are internal `/<lang>/…/` paths.
- Relations: `rel` in the registry; `basis` allowed for that relation; `verified` only from a producer the relation allows (`cites` ← Research OS); both endpoints public; kind pair allowed; no self-loops or duplicates; time order per relation (`informed`: source no later than the target's end; `developedInto`/`resultedIn`: target not before source; `explains`/`uses`/`cites`: none).
- `relatedTo` in any spelling and the bases `candidate`/`claimed`/`inferred`/`proposed`/`unverified` are rejected **by name with an explanation**, not just as unknown values.
- Growth counters are printed as information, never as a gate (D4). `npm run artifacts:print` prints Hun-Bot's normalized export and the adapter report as JSON.

### 2.3 Relation basis

`basis` has exactly two values: `declared` (the owner asserted it) and `verified` (bibliographic evidence, `cites` only). There is no `candidate`, `claimed`, or `inferred` value, so the contract cannot represent an unverified relation. The Research OS exporter must drop them, and validation rejects them if it doesn't. The schema names them only in a documentary `x-never` list; the drift check fails if any of them appears anywhere else in the schema.

### 2.4 `PublicAggregate` (v1): the pipeline, aggregated (D6)

```jsonc
{
  "period": "2025-03",               // month
  "topic": "speech-ai",              // top-level topic id (parent: null), or null = all topics. Deeper levels are rejected for now;
                                     // allowing them later changes the validator's depth rule, not the contract
  "stage": "selected",               // registry: src/data/pipelineStages.ts
  "count": 38,                       // integer, or null = unknown (≠ 0)
  "coverage": "complete"             // complete | partial | unknown
}
```

Initial stage registry (ordered, extensible without a contract bump; unknown stages are ignored with a build warning):

| Stage | Meaning | Typical magnitude |
|---|---|---|
| `discovered` | Entered the Research OS corpus (ingested candidate) | thousands / month |
| `selected` | Owner chose it for reading (queued) | tens |
| `reviewed` | Owner read and assessed it (studied / reviewed) | a few |
| `used` | Fed an owner artifact (`informed`/`uses`/`explains`) | ≤ reviewed |

Only counts cross the boundary. No titles, no per-paper rows, no reading history. A paper becomes an individual mark in Explore only when it also has its own public `paper` artifact.

### 2.5 New Hun-Bot collections (D3) — schema sketch, needs approval

All three are YAML-frontmatter collections like `picks`, with a short owner-written Markdown body. Each emits one `PublicArtifact` through an adapter.

| Field | `projects` | `experiments` | `works` |
|---|---|---|---|
| `title` | ✓ | ✓ | ✓ |
| `summary` | ✓ | ✓ | ✓ |
| `start` / `end` | ✓ / nullable | ✓ / nullable | `date` (point) |
| `state` | ✓ | ✓ | — (published) |
| `domain` | default `build` | default `research` | default `create` |
| `topics` | ✓ | ✓ | ✓ |
| `repo` (`owner/name`) | optional | optional | — |
| `informedBy[]`, `uses[]`, `developedFrom` | ✓ | ✓ | ✓ (`informedBy`, `uses`, `resultsFrom`) |
| `writeup` (blog post id) | — | optional: if set, the experiment's `href` is that post | optional |
| `media` (poster, live module) | — | optional poster | poster required; `live: { module, weight, degradesTo }` optional |
| `landmark`, `draft`, `addedAt` | ✓ | ✓ | ✓ |

Routes (reserved, D13): `/{lang}/projects/{slug}/`, `/{lang}/works/{slug}/` (the Gallery archive is `/{lang}/works/`). No page is created until the collection has real entries, and Gallery joins the navigation only then. Experiments get a page only when they have no `writeup`. Otherwise they link to the post, per creative-direction's "experiments live inside posts".

Existing collections keep their schemas. `blog.papers` maps to `informed`/`explains` in the adapter, `academicReviews.paperId` to `explains`, and `papers.itemId` to `sourceRef`. Nothing is renamed.

### 2.6 Adapters for existing collections (Phase 1)

`src/utils/artifacts/adapters.ts`: pure functions over `{ id, data }` entries, the shape `getCollection()` returns. Node scripts get the same shape from `scripts/lib/read-artifact-sources.mjs`, which reproduces Astro's glob-loader ids (github-slugger per path segment, `data.slug` override) and date coercion. Each adapter reuses its collection's existing definition of *published*; the blog rules moved unchanged from `blog.ts` into `src/utils/blog-publishing.ts` so the site and the adapters share one definition.

| Collection | Published when | Artifact | id | Time | href | Relations |
|---|---|---|---|---|---|---|
| `blog` | `getAllPosts()` rules (not draft, no placeholder frontmatter, not a duplicate) | `writing`; translations sharing a slug merge into one artifact (Korean original sets date/category) | `writing:<slug>` | `pubDate` | each translation's post URL | `papers[]` → `explains` (writing → paper) |
| `academicReviews` | not draft | `review` | `review:<slug>` | `pubDate` | `/<lang>/reviews/<slug>/` | `paperId` → `explains` (review → paper) |
| `papers` | `approved` + human-reviewed | `paper`, `title.original`, summary from `tldr` | `paper:<id>` | `studiedAt`, else the listing date (`reviewedAt` → `firstSeenAt`); state `studied`/`selected` `/<lang>/research/#paper-<id>` (the row's stable anchor; `getPaperUrl()` in `src/utils/library.ts`, also used by `PaperRow`) | — |
| `picks` | not draft | `resource` | `resource:<file slug>` | `addedAt` | `/<lang>/library/<section>/` | — |
| `resources` | `approved` + human-reviewed | `resource` | `resource:<id>` | `publishedAt` → `firstSeenAt` | `/<lang>/library/useful-feeds/` | — |

Not mapped, deliberately: `papers.relatedResources`/`relatedDecks` (editorial "see also" links between cards, not directional lineage; mapping them would be `relatedTo` under another name), `itemId` beyond the opaque `sourceRef`, tags (not topics). Blog posts and reviews carry no topics yet.

A relation whose other end is not published (e.g. a post citing a pending paper) is **withheld**, never emitted dangling, and reported as a warning.

### 2.7 Domain resolution (D11, D12)

`resolveArtifactDomain()` resolves every artifact in this order and the result is written explicitly into the artifact:

1. an explicit `domain` field on the item (new collections only; the existing schemas have none and were not changed),
2. `artifactDomainOverrides` in `src/data/artifactDomains.ts`, keyed by artifact id,
3. for writing, `blogCategoryDomains` in the same file (raw `category`, trimmed and lowercased): the only place category → domain is defined,
4. the kind's `defaultDomain` (writing → `learn`).

Create is reserved for genuinely creative artifacts (D17). Reflective and general writing (`thoughts`, `contemplation`, `retrospective`, `career`, `misc`) maps to Learn as a migration fallback; a specific post is corrected with an override, never by changing the category map for one post.

A published category with no mapping is reported by the validator, so a new category shows up the first time it appears. An override key that matches no artifact is an error.

### 2.8 Versioning

`contracts/public-artifact/artifact.schema.json` and `aggregate.schema.json` carry `contractVersion`. Additive fields mean a minor change (old consumers ignore them). A meaning change means a major version, and the exporter writes both versions for one release. The export file declares its version, and the build fails on an unsupported major version.

---

## 3. Visualization alternatives

Evaluated against what this system needs: (a) chronology of one person's work, (b) influence chains across domains, (c) hundreds to low thousands of public artifacts, (d) a sparse, hand-declared, mostly forward-in-time edge set, (e) the Atelier vocabulary with one accent.

| Structure | Verdict | Reason |
|---|---|---|
| Force-directed graph | **Rejected** | Position means nothing, time is lost, layout unstable, hubs become hairballs, no keyboard order |
| **Swimlane timeline** (domain × time) | **Primary** | Position = facts (date, domain); deterministic; reads like Atelier list rows turned sideways; keyboard order = chronology |
| Arc diagram | **Adopted as edge style** | Sparse edges over an ordered axis; arc side shows direction in time |
| Sankey / alluvial (domain → domain) | Optional summary later | Good aggregate story, loses individual artifacts; looks falsely precise on few edges |
| Adjacency matrix | **Adopted as topic × time** | Scales, table-accessible, but no narrative as a node×node matrix |
| Funnel / small-multiple bars | **Adopted for the pipeline strip** | The four stages differ by orders of magnitude; separate aligned rows avoid a misleading shared scale |
| Hive plot | Rejected | Too much decoding; time becomes radial |
| Treemap / sunburst | Rejected | Category chart, no time, no influence |
| Storyline chart | Deferred | Beautiful for topic braiding but fragile on sparse data; a "year in review" post figure |
| Git branch graph | Rejected as a whole | Forces a code metaphor on reading and writing; its span-with-fork idea survives |
| 2D embedding map | Not Explore v1 | Gated by creative-direction Phase 5; position unexplainable |
| 3D atlas | Rejected | Third dimension carries nothing |
| Hand-drawn territories (prototype) | Rejected | Blob positions are invented |

Swimlanes with arcs win because every position is a fact and every drawn line is something the owner declared. It is also the closest structure to the prototype's `ActivityView`.

---

## 4. Interaction model

### 4.1 Navigation (D1)

Header nav becomes **글 / 연구 / 라이브러리 / 탐색** (Writing / Research / Library / Explore; `nav.explore` in `src/i18n/ui.ts` for ko/jp/en; D14). "Living Atlas" remains the visualization's own name, e.g. as the page's eyebrow, with the same active state (accent + underline). Below 1100px it joins the existing `#mobileMenu`. Explore is not nested under Research because it spans all five domains. Research keeps its own pages. New route `/{lang}/explore/`, added to `sitemap.xml.ts`. Header validators that check nav markup are updated in the same change.

### 4.2 Sparse and early state (D4)

Explore is live from the first build and is designed to **look right with little data and visibly fill in**:

- **Lanes exist before content.** All five lanes render from day one. An empty lane shows its label, a count of `0`, and one mono line in `--secondary` ("No builds recorded yet"). The empty lanes show the shape of the practice before content fills them.
- **The axis fits the data.** The time axis spans the first artifact to NOW, with a minimum of 12 months, so early data never looks lost in an empty decade.
- **Edge visibility is a policy, not a constant (D16).** Whether relations are drawn in the default state is decided by one isolated function, e.g. `edgeVisibility(view) → 'all' | 'on-demand'`, in its own module. It receives the visible relations *with their geometry*: count, total arc length, how many arcs cross, and how they bunch in time (ten links in one month clutter more than thirty spread over three years). The first version can be simple. The point is that the rule lives in one place, is unit-tested against fixture layouts, and can be tuned from real usage without touching rendering. Sparse views draw all edges as thin ink arcs, because then they are the content; dense views switch to marks only, with edges on hover/selection (§4.4). The visitor never has to find a toggle.
- **Growth line.** Under the page intro, in mono: `142 artifacts · 9 links · 3 chains · since 2023.04 · last added 2026.10.02`. Every new post or link changes this number.
- **Recently added.** Artifacts with `addedAt` in the last 30 days (computed at build, the same for every visitor) get a small notch above their mark and are listed in a "Recently added" line. No per-visitor state.
- **Unlinked artifacts are first-class.** A mark with no relations is drawn the same as one with many. There's no "orphan" styling, so the atlas doesn't push the owner to invent links.
- **Pipeline strip with missing data.** Before a Research OS export exists, the strip shows a single line: "Reading pipeline not connected yet". It is not an empty chart and not zeros.

### 4.3 Layout (desktop ≥ 1280px)

```
 ┌ header: 글 · 연구 · 라이브러리 · 탐색 ───────────────────────────────────────────┐
 │  EXPLORE · 142 artifacts · 9 links · since 2023.04 · last added 2026.10.02     │
 │                                                                                │
 │ [filter]  │ discovered ▁▂▃▂▅▃▂▁▃▅▆▄   (each row its own scale, max labelled)   │   ┌ inspector ┐
 │ (floating │ selected   ▁ ▁▂ ▁▃▁ ▂▁▃▂                                           │   │ on select │
 │  button)  │ reviewed   ·  ·· · ·  ··                ← pipeline strip, brushable │   └───────────┘
 │           │──────────────────────────────────────────────────────────────── │
 │           │ LEARN     ·  ·   ·  ··    ·   ·  ·    ·                          │
 │           │ RESEARCH        ▪       ▪──▪      ▪                              │
 │           │ BUILD       ━━━━━━━━━━        ━━━━━━━━━━━━→                      │
 │           │ COLLECT   ◦   ◦     ◦  ◦    ◦     ◦                              │
 │           │ CREATE    0 · No works recorded yet                              │
 │           │ 2024.01      2024.07      2025.01      2025.07      NOW          │
 │           │ x = date · lane = domain · lines = declared links only           │
 │           │ [ Lanes | Topics × time | List ]                                 │
 └────────────────────────────────────────────────────────────────────────────────┘
```

The chart stays inside `.page-frame` (980px). The filter panel and inspector use the margins **only when opened**, through the floating-control vocabulary (`src/utils/floating.ts`).

### 4.4 States

| State | Visitor sees | Changes |
|---|---|---|
| **Default** | Lanes, marks, axis, NOW rule, pipeline strip, legend; landmark labels (≤ 6); edges drawn only in sparse mode (§4.2) | Static. Nothing loads beyond the SVG |
| **Hover / focus** | Title, kind, date of that mark; its direct relations as thin ink arcs; non-neighbours dim to `--faint` | Instant under reduced motion, otherwise a 120ms fade |
| **Select** | Full lineage (depth ≤ 4) in `--accent`; inspector opens in the right margin; `?focus=<id>` in the URL | Shareable, back-button safe |
| **Trail** | Inspector becomes a step-through: upstream above, downstream below, grouped by verb; `[` / `]` walk the chain; the active edge highlights | Chain-following by clicks, not visual search |
| **Filter** | Non-matching marks dim (chronology stays truthful); lanes can collapse | `?domain=&kind=&topic=&from=&to=` |
| **Topic highlight** | All artifacts in a topic (and descendants) are outlined across lanes; the pipeline strip switches to that topic's counts | Answers "where did ASR show up in my work, and how much did I read about it?" |

`Esc` clears selection, then filters. Clicking empty space clears selection.

### 4.5 Inspector

A mono eyebrow `PROJECT · 2025.03 → ONGOING`, the serif title, the owner-written summary, and topic chips. Then **relations grouped by verb and direction** (localized verb and inverse from the registry), each re-selecting inside Explore, and finally "Open project ↗". For a hovered pipeline-strip month the inspector instead shows the funnel: `2025.03 · speech-ai — 1,240 discovered → 38 selected → 6 reviewed → 2 used`, with the coverage note when it is `partial`/`unknown`.

### 4.6 Other views

- **Topics × time:** rows = top-level active topics, columns = quarters, cell = artifact count (grey ramp on `--ink` opacity). It is a real `<table>`. Clicking a cell filters the Lanes view.
- **List:** a year-grouped `.rule-list` with relations inline. It is also the no-JS fallback and the screen-reader path.

### 4.7 Zoom and pan

There is no free zoom/pan. **Brushing the pipeline strip** sets the time window, a semantic zoom on x only. `-` / `+` widen and narrow the window around the selection. Page scroll is never captured.

### 4.8 Lineage strip on artifact pages (D5, permanent)

At the end of every post, review, project, experiment page, and work (above comments), when the artifact has ≥ 1 relation, a single row shows: `informed by 2 papers · resulted from Experiment X · explained in 1 post`, each a link, plus "See in Explore →" (`/{lang}/explore/?focus=<id>`). It uses no JS and is built from the same contract data. It stays after Explore exists. It is how a reader *inside* one artifact follows the chain without leaving reading mode, while Explore is for overview.

### 4.9 Search

A field in the Explore filter panel does type-ahead over public artifacts only (titles in all languages, topic names). It is a client-side filter over already-loaded data. Pagefind stays the site-wide search. Choosing a result = select.

### 4.10 Mobile and tablet

- **< 768px:** time runs **downward**. Rows are grouped by month, a five-column lane glyph sits at each row start, and the title follows. The pipeline strip becomes a vertical sparkline in the gutter. Tap = select, which opens a **bottom sheet** (the blog-filter pattern) with the inspector and trail. There's no hover state.
- **768–1279px:** horizontal lanes in the page frame. The inspector docks below the chart when opened. Filters stay on the floating button.

### 4.11 Accessibility and reduced motion

- Every mark is an `<a href>` to its page, in a `role="list"` group per lane. Tab order is chronological without JS.
- With JS, a roving tabindex: `←/→` moves within a lane, `↑/↓` to the nearest mark in the adjacent lane, `Enter` selects, `[`/`]` follow the chain, `Esc` clears. An `aria-live="polite"` region announces selection and relation counts.
- Meaning never relies on colour alone: kind = shape, state = fill, selection = accent + heavier stroke + inspector text.
- Reduced motion: every highlight is instant, and brushing and arcs don't animate.
- Each mark has a ≥ 24×24px hit area. Overlaps resolve to the nearest mark.
- Dimmed marks use `--faint` (decorative). Information-bearing text stays `--secondary` or `--ink`.

---

### 4.12 Axis encoding (Phase 2b)

The Atlas is a mapping `{ x, y }` over public artifacts, held in a registry (`src/utils/atlas/dimensions.ts`), not a chart builder. Only mappings that are semantically valid for the public artifact contract exist.

- **x:** `time`, a continuous axis, the only valid x today. A categorical x (Topic × Type) needs a grid layout of stacked marks rather than a time axis and is not built.
- **y:** a *categorical axis* with three parts: `lanes(artifacts)` (lane keys in display order; fixed vocabularies include empty lanes, so absence stays visible), `lanesOf(artifact)` (one or more lanes), and `offered(artifacts)` (whether the axis tells the visitor anything for this data).
- **Offered axes today:** **Activity** (default; fixed vocabulary Learn/Research/Build/Collect/Create) and **Series** (D22). **Type** (artifact kind; seven fixed lanes) is implemented but hidden until the data holds more than one kind (D23): while every artifact is writing it is one lane saying nothing the page does not. **Topic** is registered and dormant: it is offered only once a public artifact carries a topic, which is none of the 47 today (blog posts carry tags, not topics).
- **Series lanes:** one lane per series, ordered by when each series began (a cascade of work starting over time), then a **standalone** lane for artifacts that belong to no series. Offered once at least one series groups more than one artifact. Long names wrap at word boundaries (keep-all for Korean and Japanese), clamp to two lines, and keep the full name in the label's hover title. It is multi-valued, so an artifact appears in every one of its topic lanes, per-lane counts count memberships, and every total stays a count of distinct artifacts.
- **Rejected as axes:** language availability (paper and resource hrefs list every language's hub page whether or not translated, so it means different things per kind); anything the contract does not carry. A series field (a real authored grouping, the closest thing to "project" in the blog data) is the most useful next candidate, but needs a contract addition.
- **Rendering:** every offered axis is laid out at build time and rendered as its own view; the default is visible, the others `hidden`. Switching shows one and hides the others, with no layout work or fetch in the browser. Marks keep exactly the same x in every view; only lanes and rows change. The view is `?y=<axis>`, shared with `?focus=<id>`; the selection survives a switch.
- **Control:** the axis *label* is the control (`ACTIVITY ▾`, in the label column above the lanes), opening a compact bordered list of the offered axes. It is a disclosure menu (`menuitemradio`): Enter/↓ opens, ↑/↓/Home/End move, Enter chooses, Esc closes and returns focus. With one offered axis, or without JavaScript, it is a plain label. The X label (`TIME →`) sits under the track and becomes the same control when a second valid x exists.
- **Legend (D24):** "읽는 법" says three things and nothing else by default: horizontal position is when it was written, rows are the chosen axis (the sentence follows the view), and selecting a mark shows its details. A relations line appears only once public relations exist; glyph shapes only when more than one artifact kind is present (`src/utils/atlas/legend.ts`). The recently-added overline is not explained in the legend; the growth summary above the chart already says how many were added in the last 30 days.
- **Targets:** each mark's glyph stays small; its link is one lane-row tall and exactly as wide as the slot the row packing guarantees (`minGap`, 28 track units = 24px at full width, the WCAG 2.2 minimum), so no two targets overlap. Collisions add rows, never sideways movement.

## 5. Visual encoding rules

| Channel | Encodes | Rule |
|---|---|---|
| x position | Date | Linear time; NOW rule in `--rule-strong`; mono 11px ticks |
| y position (lane) | Primary domain | Fixed order Learn → Research → Build → Collect → Create; within-lane offset is collision avoidance only (stated in the legend) |
| Shape | Kind | paper = small circle · review = square · writing = short vertical tick · resource = hollow circle · work = diamond · project/experiment = horizontal span (an arrow cap means ongoing) |
| Length | Duration | Spans only |
| Fill | State | Filled = finished/published, outline = in progress (`abandoned` = outline with a short strike) |
| Colour | Selection/lineage only | `--ink` default, `--faint` dimmed, `--accent` selected lineage. **Domains have no hue.** The lane already encodes them, and the one-accent rule forbids more |
| Arc | Declared/verified relation | Forward in time = above the lanes, backward (`explains`) = below. 1px ink on hover / sparse default, 1.5px accent on selection. Verbs live in the inspector, not on the chart |
| Line style | — | Always solid. **There is no dashed "maybe" style**, because unverified relations do not exist publicly (§2.3) |
| Size | Nothing | Constant. Size-as-importance would be an invented metric |
| Notch | Recently added | A small tick above the mark, `addedAt` ≤ 30 days |
| Labels | Title | Landmarks by default; others on hover/selection |

### 5.1 Pipeline strip encoding (D6)

- **One row per stage** (`discovered`, `selected`, `reviewed`; `used` as accent-free ink ticks on the reviewed row), aligned to the same time axis.
- **Each row has its own y-scale, with its maximum labelled** in mono (`max 1.6k`, `max 41`). A shared scale would flatten the bottom stages to nothing. Separate rows are the honest way to show a funnel spanning three orders of magnitude.
- Bars in `--secondary`. `count: null` = a gap with a hatched baseline (unknown ≠ zero). `coverage: partial` = a lighter bar plus a note in the inspector.
- The **conversion ratio** (selected ÷ discovered, …) is shown only in the inspector as text, never as a third visual channel.
- Room to grow: a new stage in `pipelineStages.ts` becomes a new row with no layout change.

Density rule for lanes: when more than ~1 mark per 6px falls in one lane-month bin, they collapse into a mono **count glyph** that expands on hover or brush. The chart never overplots.

---

## 6. Data requirements from Research OS

Research OS's only obligation is to emit files that validate against `contracts/public-artifact/` (§2):

| Export | Content | Constraint |
|---|---|---|
| `artifacts.json` | `PublicArtifact[]` for papers (and later any other artifact) the owner published | Only human-reviewed items; `basis` only `declared`/`verified`; no `relatedTo`/candidate edges; titles are human-written or the source title |
| `aggregates.json` | `PublicAggregate[]` per month × top-level topic × stage | Counts only; `null` for unknown; coverage per row |
| `manifest.json` | `contractVersion`, `exportedAt`, producer version | Build fails on unsupported major version |

What stays private (never exported): reading priority, per-paper reading history for unpublished papers, notes, Idea Graph proposals, embeddings, candidate/claimed edges, internal ids (except as opaque `sourceRef`).

The topic vocabulary is Hun-Bot's (`topics` collection). The exporter maps Research OS topic labels onto Hun-Bot topic ids. An unmapped topic is exported as `null` (counted under "all topics"), never as a new id.

---

## 7. Performance strategy

Scale: public artifacts number in the hundreds to low thousands. The Research OS corpus has tens of thousands of papers, but it crosses into Hun-Bot only as aggregates (≈ 60 months × ~10 topics × 4 stages ≈ 2,400 integers, a few KB).

1. **Layout at build time.** Astro computes every mark's x/y, collision offsets, count-glyph bins, and arc paths while emitting the SVG. The client runs no layout algorithm.
2. **Static first paint.** SVG + List view are server-rendered. LCP is text. Nothing requires JS to read.
3. **Lazy module.** One bundled TS module loads on idle after interaction intent (pointer enters or focus moves into the chart), per creative-direction boundary 4. Budget **≤ 25 KB gzipped** for the route, enforced in `validate-performance-budget.mjs`.
4. **Precomputed adjacency.** CSR arrays (`offsets[]`, `targets[]`). Lineage BFS over ≤ 4 hops runs in microseconds.
5. **Highlight by attribute.** Selection flips `data-state` on existing nodes. Only the selected lineage's arcs are created at runtime (in dense mode).
6. **Canvas past a threshold.** If a view exceeds ~3,000 marks, the dimmed base layer moves to `<canvas>` and the SVG keeps ≤ 200 interactive marks. It isn't needed in v1 and is recorded here so nobody builds it early.
7. **Payload.** Columnar arrays, titles split per language (load only the page language). Target < 60 KB gzipped at 2,000 artifacts.

---

## 8. Other surfaces

### 8.1 Articles: reading utility

The **floating TOC dropdown remains the primary navigation** (D8). Additions, in priority order:

1. **TOC shows position.** The pill shows `3 / 7 · Method`. The open popover marks the current section in accent and read sections in `--secondary`. It reuses the existing scroll observer.
2. **Heading anchors.** A mono `#` appears on heading hover/focus and copies the deep link.
3. **Code blocks (D9).** Every block gets a copy button and a mono language label. **Nothing is collapsed by default.** Blocks over ~40 lines get a small "Collapse" `.btn-text` the reader can use. An author can opt a specific block into starting collapsed (e.g. a `collapsed` meta on the fence) for appendix-style dumps. Collapsed content stays in the DOM (find-in-page and print still work).
4. **Wide content expansion.** Tables, figures, and display math wider than the measure get an "Expand" control that opens a full-viewport `<dialog>` (focus-trapped, `Esc` closes).
5. **Sidenotes (≥ 1280px).** Footnotes sit beside their reference in the right margin. Below that width they stay footnotes, with a reference popover.
6. **Link preview.** Hovering or focusing an internal link to a post/paper shows its title, date, and description in a small popover (from a build-time index).
7. **Lineage strip** at the end (§4.8).
8. **Hidden power-user keys.** `j`/`k` jump between `h2`/`h3`, inactive while typing. They are **not advertised in the UI** (no help button, no hint). The only mention is a line in an about/colophon page. The TOC never depends on them.

Not included: animated headings, scroll-linked prose effects, parallax, text reveal.

### 8.2 Papers (Research hub) and Library: functional margins on demand (D10)

**The default layout is unchanged: one column, exactly as today.** Nothing occupies the margins until the reader asks.

- **Filters, opened on demand.** The existing floating filter button (the `BlogFilterBar` pattern) is the entry point. At ≥ 1280px, opening it docks the panel **in the left margin** beside the column instead of covering it, so results stay visible while filtering. Below 1280px it stays a popover / bottom sheet. Facets: Papers = topic (hierarchical, counts), state, venue, year, has-review, has-code. Library = section, kind, tier, freshness, plus sort. Filters write URL params, so a filtered URL reopens filtered with the panel collapsed and an active-count badge on the button. The panel closes with `Esc` or the button. Open state persists only within the session (`sessionStorage`, like the floating controls).
- **Preview, opened on demand.** Each row gets a small mono "Preview" affordance (`.btn-text`, also `Space` on a focused row). Activating it opens a detail panel **in the right margin** (≥ 1280px). For a paper: venue/acceptance via display helpers, summary, topics, review/post links, lineage. For a pick: owner note, stars, freshness, "used by" (from `uses` edges). **No hover-triggered panels.** The row title stays a normal link to the page, so preview never replaces navigation. Below 1280px, Preview is absent and the row link is the only path.
- **At most what was asked for.** Opening one panel never opens the other. Both can be open at once only if the reader opened both. Panels are draggable/collapsible through `floating.ts`.
- **Keyboard:** `↑/↓` move between rows, `Space` previews, `Enter` opens, `/` opens filters and focuses its search.
- **Later, only if used:** pin up to 3 papers to compare in the preview panel.

### 8.3 Gallery (`works`)

- **Archive (`/{lang}/works/`):** the Library `.knowledge-item` grid: poster still, mono `KIND · YEAR`, serif title, one line. No hover video, no autoplay.
- **Work detail:** the normal Atelier frame with poster, statement, and lineage strip. An explicit **"Enter work"** switches to *stage mode*: the header recedes, the stage goes full-bleed, and the live piece (Three.js / canvas / video) is dynamically imported at that moment. Sound stays muted until the reader turns it on. `Esc` / "Leave" returns, and `?stage=1` keeps the back button working. Reduced motion or no WebGL shows the poster and a recorded video if one exists, plus "Run anyway". Each work declares `live: { module, weight, degradesTo }`.
- **Process panel:** "How it was made" opens notes and stills, linking to the experiment and writeup.

---

## 9. Implementation boundaries

| Layer | Use | Don't use |
|---|---|---|
| Contract | `contracts/public-artifact/*.schema.json` (Hun-Bot-owned), `src/utils/artifacts/` adapters, `scripts/validate-artifacts.mjs` | Importing or vendoring Research OS internal schemas; extending `contracts/research-os/` for this |
| Rendering | Astro components emitting SVG at build; one TS module per route | React/Preact islands; client-side rendering of the base chart |
| Scales/shapes | `d3-scale`, `d3-array`, `d3-shape` at **build time only** | Full `d3`; `d3-force`; `d3-zoom` |
| Interaction | Vanilla TS, `floating.ts`, a hand-rolled 1D brush | Cytoscape / Sigma / vis-network (force layouts, 100 KB+) |
| Motion | Existing transitions; motion tokens if creative-direction Phase 1 has shipped | GSAP / Framer |
| 3D | Gallery stage mode only, dynamic import after an explicit click | Three.js in Explore, Papers, Library, Articles |
| Styling | Existing tokens, `lists.css`, `LibraryPageStyles`; one `explore.css` | New colours, fonts, domain hues |
| i18n | Nav item, lane names, relation verbs + inverses, stage names, empty-state lines, legend in `ui.ts` | Hard-coded strings |
| Validation | `validate-artifacts.mjs` (with growth counters), performance budget, a no-JS check that the List view contains every artifact | A data threshold gate |

### Phase order (each needs its own go-ahead)

1. **Contract:** `contracts/public-artifact/`, `relationTypes.ts`, `pipelineStages.ts`, adapters for existing collections, `validate-artifacts.mjs`. No schema change to existing collections.
2. **New collections:** `projects`, `experiments`, `works` schemas and routes (§2.5). *Schema addition, needs approval.*
3. **Lineage strip** on posts/reviews/projects. Static, zero JS.
4. **Explore static + nav item:** Lanes SVG with the sparse state, List view, Topics × time table. Live immediately.
5. **Explore interactive:** hover, select, inspector, trail, filters, brush, keyboard.
6. **Research OS export:** exporter on the Research OS side, `src/data/research-os-export/`, pipeline strip.
7. **Article utilities** (§8.1). Independent and can run any time after 1.
8. **Papers/Library on-demand margins** (§8.2). Independent.
9. **Gallery** once `works` has real entries.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Early Explore looks empty or broken | Designed sparse state (§4.2): lanes before content, axis fitted to the data, all edges drawn while few, growth line, recently-added notches |
| Links invented to make the atlas look connected | Unlinked marks are first-class; edges need a registry relation, a kind-pair check, and time sanity |
| `relatedTo` / candidate edges leaking | No contract value can represent them (§2.3); schema validation rejects them |
| Contract drift between repos | Hun-Bot owns the schema; versioned; exporter output is validated at build; an unsupported major version fails loudly |
| Margins clutter the quiet default | Panels open only on explicit action, never on hover, never by default |
| Scope creep | Each phase is useful alone; phases 1–3 already deliver chain-following |

## 11. Open questions

Resolved 2026-10-04 (see D11–D16): domain derivation, category map location, routes, Korean label, aggregate granularity.

Resolved at Phase 1 review: reflective writing → Learn, Create reserved (D17); paper row anchors (D18).

Still open: highlighting an anchored paper row after navigation, deferred to the Atlas interaction phase.
