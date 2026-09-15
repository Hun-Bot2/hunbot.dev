# Research Discovery And Learning System

Status: Design only. No implementation approved. No phase started.

Reviewed: 2026-09-14

This is the durable architectural reference for a research discovery, understanding, and idea-development system. It defines the problem, the data model, the evidence rules, the ranking philosophy, the reading and research-thinking workflow, the evaluation method, and the build order, so that implementation work starts from a stable definition rather than rediscovering requirements.

The system is not a discovery pipeline with a summarizer attached. It is a loop: **Discover → Understand → Question → Hypothesize → Verify Prior Art → Experiment → Evaluate → Revise → Discover again.** Discovery is the entry point, not the product.

It **amends and extends** [Discover: Product Direction](./discover-direction.md), it is **constrained by** [Product Separation Boundaries](./product-boundaries.md), and it inherits the reading-experience constraints in [Creative Direction](./creative-direction.md). Where it conflicts with those records, the conflict is named explicitly in [Amendments Required](#amendments-required-to-existing-records) rather than resolved silently.

## Marker Convention

Used throughout. The point is that a later reader can tell what was verified from what was believed.

| Marker | Meaning |
|---|---|
| **FACT** | Verifiable now, from this repository or from stable public knowledge |
| **ASSUMPTION** | Believed but not verified; wrong values change the design |
| **DECISION** | A design choice made in this document, with its reason |
| **VERIFY** | Depends on an external API, license, or access permission that has not been checked |
| **OPEN** | Genuinely unresolved; do not pretend otherwise |

Nothing marked **VERIFY** may be relied on in an implementation plan until it has been checked and the marker replaced with a FACT and a date.

## Document Map

**Discovery half** — Problem, Product Definition, Users, Principles, Relationship To Discover, Source Strategy, Venue Registry, Provenance, Data Model, Taxonomy, Research Graph, Quality Signals, Personalization, Ranking, Reading Path Generation.

**Understanding and idea half** — AI Usage, AI-Assisted Reading, Paper Analysis, Idea Graph, Cross-Paper Synthesis, Research Notebook, Active Recall, Hypothesis Generation, Prior-Art Verification, Experiment Design, Experiment Tracking And Idea Revision, Guardrails.

**Delivery** — Product Surfaces, Blog Integration, Evaluation, MVP Scope, Phased Plan, Risks, External Dependencies, Amendments, Open Questions, Non-Goals.

---

## Problem

A person entering or tracking a research area faces two distinct problems that are usually confused with each other.

**The learning problem.** "I want to understand AI visualization. Where do I start, what must I read to follow current work, and in what order?" This is a curriculum problem. Its answer is a small ordered set with explained roles.

**The tracking problem.** "I already understand this area. What appeared recently that I would regret missing?" This is a filtering problem. Its answer is a very small unordered set with justifications.

**The idea problem.** "I have read these papers. What do they collectively imply, what is still unresolved, and what should I investigate?" This is neither a curriculum nor a filter. It is an analysis problem, and it is the one that determines whether reading produces anything.

Existing tools solve none of the three well, and almost nothing addresses the third at all.

- **arXiv.** **FACT:** not peer reviewed. Useful as an early signal, useless as a quality filter, and the volume makes unfiltered reading impossible.
- **Conference accepted-paper lists.** A genuine quality prior, because acceptance is expert judgment. But a single year of a single large venue is hundreds to thousands of papers. **ASSUMPTION:** order of magnitude per year — NeurIPS and ICLR in the low thousands, CHI around one thousand, IEEE VIS in the low hundreds of full papers. Exact figures **VERIFY**. The prior narrows quality; it does not narrow volume.
- **Google Scholar / Semantic Scholar.** Excellent once you know the query. They answer "find me this"; they do not answer "what should I read first."
- **Social media and newsletters.** Fast, popularity-biased, and structurally incapable of surfacing a 2016 paper that is still the right starting point.
- **AI paper-summary services.** They compress what exists. They rarely answer *why read this*, *what came before*, *what is foundational*, or *what next* — which are the four questions that actually determine whether reading is worth the hours.
- **Professor-curated reading lists.** The best existing solution, and the model this system imitates. They mix foundational and current work, they explain roles, and they are ordered. **FACT:** they are manually produced, scoped to one course or one lab, and go stale.

The gap is not summarization. It is **structure and role assignment** — knowing that a paper is foundational, or a bridge, or a frontier probe, and being able to say why with evidence — and then **structured analysis**: turning what was read into strengths, weaknesses, trade-offs, open questions, and eventually experiments.

Summarization tools compress a paper. This system is trying to do the opposite of compression: to make the *argumentative structure* of a literature explicit, including the parts no single paper states.

### The Honest Limit

**DECISION:** the system attempts to reproduce *part* of the value of expert curation. It does not claim to replace expert judgment, and the design must never be arranged so that it implicitly does. Where the system cannot supply evidence for a claim, it must say so rather than generate a plausible sentence. This is the single constraint that most shapes the rest of the document.

---

## Product Definition

A system that tracks trusted academic venues, reconstructs the structure and lineage of research areas from bibliographic evidence, identifies high-value work using field-appropriate signals, and produces explained reading paths from foundational work to the frontier.

Two modes, because the two problems above are different:

**Learn Mode.** Given a topic, produce an ordered path with role-labeled stages — Foundation → Core → Bridge → Current → Frontier — and an evidence-backed explanation for every placement.

**Research Radar Mode.** Given established interests, surface the small number of recent items worth checking, with acceptance status always visible and preprints never mixed indistinguishably with published work.

**Read Mode.** Given a paper the user has chosen, reduce the cost of *navigating and comprehending* it without replacing it — progressive depth, every important claim traceable to a location in the original.

**Think Mode.** Given papers the user has actually read, support the analysis that follows reading: strengths and weaknesses, trade-offs across approaches, recurring unresolved limitations, candidate questions, prior-art checks, experiment designs, and the revision of ideas after results — including results that fail.

The first two modes answer *what should I read*. The third answers *what should I understand*. The fourth answers *what should I investigate next*. **DECISION:** the fourth is the reason the system exists; the first three are infrastructure for it. Any trade-off that improves discovery at the cost of the thinking layer is resolved against discovery.

The optimization target is **reduction**. A version of this system that shows more papers than the previous version has, by default, gotten worse. **DECISION:** every surface has a hard item cap, set at design time, and improving the system means improving what occupies those slots — never adding slots.

### What Success Looks Like

The system is working when a person who does not know a field can reach informed reading in one session, and a person who does know a field can clear a week's tracking in five minutes. Both of those are measurable against gold sets (see [Evaluation](#evaluation--gold-sets)); neither is measurable by item count.

---

## Users And Use Cases

**FACT:** there is one user today — the site author. **DECISION:** design for one user, but keep every mechanism that could serve many from being *structurally* single-user, because the cost of doing so is near zero and the cost of undoing it later is not.

There is a second class of beneficiary who is not a user of the system: a **reader of the site**, who consumes published outputs — a reading path rendered as a static page, a Discover feed item — without any account, state, or personalization on the server. That distinction is load-bearing and is enforced in [Blog Integration](#blog-integration).

| Use case | Mode | Frequency | Output shape |
|---|---|---|---|
| Enter a new area cold | Learn | Rare, high value | 8–15 papers, ordered, role-labeled, explained |
| Prepare for a project in a known area | Learn | Occasional | 5–8 papers, mostly Core and Current |
| Weekly tracking of known areas | Radar | Weekly | 3–5 items, with acceptance status |
| Check whether a preprint matters | Radar | Ad hoc | One item, with prior-work context |
| Decide what to write about next | Both | Monthly | Candidates already in the reading queue |
| Publish a curated path for readers | Learn | Rare | A static page with human-written framing |

The last row is the only one whose output is public by default. Everything else is private working state.

---

## Design Principles

These are the twelve from the brief, restated with their reasons, because a principle without a reason gets traded away under pressure.

1. **Quality over quantity.** Reduction is the product. Volume is the failure mode being solved.
2. **Provenance over unsupported inference.** Every claim carries its source. A claim without a source is not displayed, not scored, and not stored as if it were fact.
3. **Accepted work and preprints stay distinguishable.** They are different epistemic objects. Merging them destroys the main quality signal the system has.
4. **Collection is independent of interests.** Interests drift; re-ingesting history is expensive and sometimes impossible. Collect broadly, rank narrowly.
5. **Relationships are evidence-backed.** A hallucinated lineage is worse than no lineage, because it is confidently wrong in a domain where the user cannot easily check.
6. **Ranking is interpretable.** If a placement cannot be explained in one sentence naming its signals, it cannot be debugged, and it cannot be trusted.
7. **Fields need different signals.** A CHI paper and an OSDI paper are not commensurable. Pretending otherwise produces a ranking that quietly favors whichever field the signals were designed around.
8. **AI reduces reading load.** Generating more text to read is the opposite of the product.
9. **Build understanding, not novelty.** Novelty is a component of ranking, not the goal.
10. **Human judgment is the final editorial layer.** Inherited from [`discover-direction.md`](./discover-direction.md): AI may draft, AI may not publish.
11. **Small benchmarkable corpus first.** Scaling ingestion before proving ranking optimizes the part that was never the constraint.
12. **The data architecture absorbs new fields and venues without redesign.** Verified by a concrete test, stated in [Venue Registry](#venue-registry).

### The Principle That Was Missing

13. **DECISION — Absence is reportable.** The system must be able to say "I have no foundational paper for this topic," "citation data for this venue is unavailable," or "this edge is unverified." Most discovery systems fail by being unable to express absence, so they fill it with something plausible. Every model, every ranking output, and every generated explanation in this design has an explicit representation for *unknown*, distinct from *zero* and from *not applicable*.

### Principles Added By The Reading And Thinking Layer

14. **DECISION — AI is a navigation layer, not a substitute for the paper.** Its job is to reduce the cost of finding and understanding the relevant part, not to stand in for the source. The enforceable form of this is stated in [AI-Assisted Reading](#ai-assisted-reading), because the slogan version is not enforceable.
15. **DECISION — Uncertainty is preserved verbatim.** Author hedging is content. "Our results suggest" never becomes "the method proves." A summary that is more confident than its source is a factual error, not a stylistic one.
16. **DECISION — Human notes and machine output never merge.** They are separate fields, separately styled, separately queryable, and never concatenated into one block of prose. Once merged they cannot be separated again, and the human layer is the only part with durable value.
17. **DECISION — Failure is preserved.** Failed hypotheses, negative results, contradictory evidence, and unexpected observations are first-class records with the same status as successes. A system that keeps only what worked produces a distorted picture of the user's own research history, which is the one history it exists to maintain.

---

## Relationship To Discover

This is the most important architectural question in the document and the brief does not settle it, so it is settled here.

**FACT:** [`discover-direction.md`](./discover-direction.md) already defines Discover as an approved product direction with a four-domain topic taxonomy, an English-primary language policy, an item contract, a human review gate, and a static build output. Its `paper` content type and the existing `papers` collection overlap directly with this system.

**DECISION: this system is the research substrate beneath Discover, not a replacement for it, and not a second competing product.**

| | Discover | This system |
|---|---|---|
| Scope | The AI ecosystem — papers, repos, blogs, tools, releases | Peer-reviewed research across CS fields |
| Claim | "This may be relevant to your topics" | "This is worth reading, here is why, here is the order" |
| Structure | Time-ordered, faceted feed | Graph, with reading paths over it |
| Output | Feed items | Feed items **and** reading paths |
| Taxonomy | Reader-facing interest tree, 4 domains | Internal multi-dimensional research annotation |
| Audience | Site readers | The author first; readers via published artifacts |

Concretely:

- Discover's **Research Radar** content — the `paper` content type — becomes an **output** of this pipeline rather than a separately sourced stream. The item contract in `discover-direction.md` is unchanged and still applies to anything published.
- Discover's **surface, routes, taxonomy, language policy, and review gate are unchanged.** This document adds no requirements to them.
- **Reading paths are a new surface**, not a Discover view. They are ordered, small, and rarely updated, which is the opposite of a feed.
- The **Reading Queue is not a public surface at all.** See [Product Surfaces](#product-surfaces) — it conflicts with an approved guardrail and is resolved there.

The reason to subordinate rather than replace: Discover's Phases 1–3 are pure content and routing work with no external dependencies, and they are the cheapest way to prove the taxonomy and the review loop. This system's Phase 1 depends on external data availability that is currently **VERIFY** across the board. Building the dependent thing first would stall on an unverified dependency while the independent thing sat undone.

**DECISION:** Discover Phases 1–3 proceed on their own schedule and are **not blocked** by this document. This system's Phase 0 may run in parallel, because it is design and verification work with no code.

---

## Source Strategy

Three trust layers, and the layering is structural rather than a display preference.

**CORE.** Major, broadly trusted conferences and journals. Acceptance here is a meaningful expert prior.

**EXTENDED.** Strong domain-specific venues. Same kind of prior, narrower community, sometimes weaker or less legible metadata.

**RADAR.** arXiv, OpenReview submissions, workshop papers, and anything else not formally accepted at a registry venue.

**DECISION:** provenance is a required field on every paper, with exactly two values at the top level — `VERIFIED` (accepted or published at a registry venue, established from an authoritative source) and `RADAR` (everything else). This is not a score and not a confidence level. It is a statement about which process the work has been through.

**DECISION:** the two are never merged in a ranked list without a visible boundary. A Radar item may appear above a Verified item when signals justify it, but the surface must make the status legible at a glance without the user hovering, expanding, or reading a badge in small type.

**DECISION:** arXiv is a **discovery** source and a **linking** source, never a quality filter. An arXiv preprint that is later accepted is the same work with a changed status — see [Provenance Model](#provenance-model) for how that transition is handled, because it is the single most common lifecycle event in this data and getting it wrong produces duplicates.

### Why Not Just Rank Everything

A tempting simplification is to drop the layers and let signals sort it out, since venue is a signal anyway. It fails for one reason: **the signals are missing exactly where they are most needed.** A three-week-old preprint has no citations, no follow-up work, no replication, and no adoption. Every signal except the text itself is undefined. Without a structural layer, the ranking silently degrades to semantic similarity for precisely the items where the user most needs a quality judgment.

---

## Venue Registry

**DECISION:** venues are data in a registry, never logic distributed through the system. No venue name, acronym, or special case appears in a conditional anywhere in the pipeline.

This mirrors the taxonomy rule already established in [`discover-direction.md`](./discover-direction.md) — *taxonomy is data, not code* — and it exists for the same reason: the set is large, it changes, and it will be wrong at first.

**The test this design must pass:** adding a venue, renaming one, merging two, retiring one, or adding an entire research field must be a registry edit plus at most one new ingestion adapter. If it requires touching ranking code, path generation, schema definitions, or route files, the design is wrong.

### Registry Entry Shape

| Field | Purpose |
|---|---|
| `id` | Canonical, stable, lowercase. Never reused |
| `name` | Full official name |
| `aliases` | Historical names, acronym variants, DBLP keys, other systems' identifiers |
| `fields` | One or more research fields. Multi-valued deliberately — venues are not partitioned by field |
| `type` | `conference`, `journal`, `workshop`, `symposium` |
| `tier` | `CORE` or `EXTENDED` |
| `acceptanceSource` | Authoritative source for *what was accepted* |
| `proceedingsSource` | Authoritative source for *published metadata* |
| `tracks` | Named tracks, where a venue has them |
| `signalAvailability` | Which quality signals exist for this venue at all |
| `adapter` | Which ingestion adapter handles it |
| `access` | Licensing and access status. **Required.** See below |
| `provenanceNotes` | Free text on quirks — renames, merges, years with different processes |

**DECISION:** `signalAvailability` is a required structured field, not documentation. Awards, orals, spotlights, and review scores exist for some venues and not others, and a ranking function that silently treats "this venue publishes no review scores" as "this paper had bad reviews" is broken in a way that is nearly invisible. Every signal read must consult availability first and return *unknown* rather than a default. This is principle 13 made mechanical.

**DECISION:** `access` is required and blocks ingestion. A venue whose access status is unverified cannot be ingested, regardless of how much its papers are wanted. This is what prevents a licensing problem from being discovered after the corpus is built.

### Coverage

The registry should eventually span the fields named in the brief: ML/AI, NLP, Speech/Audio, Vision, HCI, Visualization, Systems, ML Systems, PL, SE, Databases, IR/Web, Security/Privacy, Robotics, Multi-Agent, Networking, Architecture, Graphics, Ubiquitous Computing.

**DECISION:** the registry is authored incrementally and field coverage is explicitly partial. A field with no venues is a legitimate registry state, not a gap to be filled before shipping. The alternative — authoring a hundred venue entries before proving the ranking works — is exactly the sequencing error principle 11 forbids.

**FACT:** venue prestige is a prior on quality, not a measurement of it. A weak paper at a top venue and an important paper at a workshop both exist and are common. **DECISION:** venue tier enters ranking as one bounded signal among many and is capped so that it can never by itself move an item into a top slot.

---

## Provenance Model

The rule: **authoritative publication metadata and enrichment metadata are separate fields with separate write paths, and enrichment never overwrites authority.**

### Hierarchy

For acceptance status and canonical publication record, prefer the venue's own source, per the registry's `acceptanceSource`.

**VERIFY — every row below.** Names are recorded as the intended direction, not as confirmed availability, format, licensing, or permission. None may be relied on before checking.

| Venue family | Intended authoritative source |
|---|---|
| ICLR | OpenReview conference records |
| NeurIPS | Official proceedings |
| ACL family | ACL Anthology |
| IEEE VIS | Official VIS / IEEE publication records |
| CHI, UIST, CSCW | Official ACM / conference records |

Enrichment — abstracts, citation counts, references, author disambiguation, topic labels, code links — may come from **OpenAlex, Semantic Scholar, Crossref, arXiv, OpenReview, GitHub, Papers With Code or equivalents**. All **VERIFY** for availability, rate limits, licensing, and redistribution rights.

### The Rules

1. **Every field carries its source and fetch time.** Not per record — per field. A paper's venue may come from one place and its citation count from another, and a year later it matters which.
2. **Enrichment cannot change acceptance status.** If an enrichment source disagrees with the authoritative one, the disagreement is recorded and surfaced for review. It does not silently resolve.
3. **Conflicts are data.** A `conflicts` list on the record, not an exception and not a last-writer-wins overwrite.
4. **Refresh is per-source.** Citation counts change weekly; acceptance status essentially never does. One global refresh timestamp would force re-fetching stable authoritative data to keep volatile enrichment current.

### Preprint-To-Published Identity

**FACT:** the same work commonly exists as an arXiv preprint, a conference submission, and a published paper, with different identifiers and often a different title.

**DECISION:** one `Paper` entity per *work*, carrying multiple external identifiers and a status history — not one entity per artifact. The alternative produces visible duplicates and, worse, splits citation evidence across records, which silently corrupts every graph-derived signal downstream.

**DECISION:** linking a preprint to a publication is an **evidence-backed claim with a confidence level**, never an inference the system treats as settled. An explicit identifier link from an authoritative source is high confidence. A title and author-set match is a candidate requiring review. **OPEN:** the review threshold, and whether medium-confidence links are auto-accepted in Radar but not in reading paths.

---

## Data Model

Raw source data, derived computation, and AI interpretation are **three separate namespaces** on every entity. The reason is auditability: when a ranking is wrong, the first question is whether the input was wrong, the computation was wrong, or the model made something up, and a flat record cannot answer it.

### Paper

**Identity:** internal ID; external IDs as a map (DOI, arXiv, OpenReview, DBLP, OpenAlex, Semantic Scholar, ACM DL, IEEE) — a map, not fixed columns, so a new source is data.

**Bibliographic (authoritative):** title, abstract, authors (with ordering and affiliation where available), year, venue ID, track, paper type, acceptance status, provenance tier, honors (award / oral / spotlight), official URL, PDF URL.

**Enrichment:** project URL, code repository, datasets, tasks, methods, keywords, references, citations, citation counts and velocity, replication and follow-up links.

**Derived:** embeddings, graph-computed measures, topic assignments with confidence, role candidacy scores.

**AI-generated:** summaries, explanations, prerequisite claims, proposed relations. Every field here carries the model, prompt version, and generation time, and is marked as interpretation wherever it is displayed.

**Operational:** ingestion timestamp, per-source refresh timestamps, conflicts, review state.

**DECISION:** authors are an entity, not a string list, but **author disambiguation is explicitly out of scope for the MVP.** It is a hard, well-known problem; getting it wrong corrupts the lab-history signal. Until it is solved, author-derived signals are marked low confidence and excluded from reading-path role assignment. This is preferable to a silently wrong author graph.

**DECISION:** `abstract` may be unavailable or non-redistributable for some venues (**VERIFY** per venue). The model must function with a missing abstract — degraded, not broken — because access constraints are likely to bite exactly where the gold set lives.

### Other Entities

`Venue` (the registry entry), `Topic` (taxonomy node), `Method`, `Dataset`, `Task`, `Author`, `Relation`, `ReadingPath`, `QueueItem`.

**DECISION:** `Method`, `Dataset`, and `Task` are **not** authored by hand and are **not** a controlled vocabulary at MVP. They are extracted, low-confidence, and used for retrieval and faceting only. Promoting one to a curated entity is a deliberate later act. Building a curated method ontology up front is a multi-year task that would consume the entire project.

### Storage Shape

**DECISION:** relational primary store, with the graph as derived tables and the vector index as a separate artifact. A graph database is not justified at the assumed corpus size; a relational store with a well-indexed edge table handles millions of citation edges and keeps provenance columns natural.

**FACT:** per [`product-boundaries.md`](./product-boundaries.md) and `scripts/validate-product-boundaries.mjs`, no database may be a dependency of the public repository. **DECISION:** the store lives entirely in the private pipeline repository, consistent with the Phase 4 decision already made in `discover-direction.md`. The public site consumes static files only.

---

## Taxonomy

The brief asks for multi-dimensional annotation — field, subfield, topic, target, problem, technique, evaluation, with a paper holding several values per dimension. That is right for retrieval and wrong for a reader-facing filter, and the two must not be the same structure.

**FACT:** Discover's taxonomy is a reader-facing interest tree — four domains, roughly nine topics each — deliberately small, because a reader picks from it with checkboxes.

**DECISION: two taxonomies, one mapping.**

**Research annotation (private, rich, multi-dimensional).** Lives in the pipeline. Every dimension is a separate facet; a paper holds multiple values per dimension with confidence and provenance. Grows to hundreds of values. Never rendered as a filter UI.

**Reader taxonomy (public, small, curated).** The existing `src/content/topics/` tree, unchanged, with the lifecycle rules already defined in `discover-direction.md`.

**A published mapping** from research annotation values to reader topics, itself reviewable content.

Why not one taxonomy: a filter UI over several hundred facet values is unusable, and a four-domain tree cannot express "visual analytics ∧ LLM ∧ model understanding ∧ projection ∧ user study," which is precisely the query that makes reading-path generation work. Each structure is correct for its job and wrong for the other's.

**DECISION:** dimensions are themselves data. Adding an eighth dimension is a registry edit. The starting seven — field, subfield, topic, target, problem, technique, evaluation — are a hypothesis, and **OPEN** whether `target` and `problem` survive contact with non-AI fields, where "the thing being studied" may not decompose the same way.

**DECISION:** annotation confidence is mandatory and three-valued: `curated` (human), `derived` (deterministic, from metadata), `proposed` (model). Reading-path role assignment may use `curated` and `derived`. It may **not** use `proposed` alone, because a hallucinated topic label would place a paper in a stage it does not belong in, which is the exact failure this system exists to avoid.

---

## Research Graph

The graph is what separates this system from a search index. It is also where a system like this most easily starts lying.

### Edge Classes

**DECISION:** three classes, permanently distinguished in storage and in every display.

**VERIFIED.** Derived from bibliographic evidence: `cites`, `published_at`, `authored_by`, `same_work_as`. A verified edge names its source and can be traced back to a record.

**CLAIMED.** Asserted by the paper's authors in their own text: "we extend X," "unlike Y, we...", "we build on Z." The evidence is the quoted sentence, stored with the edge. **DECISION:** a claimed edge without a stored quotation is invalid and is dropped, not downgraded. This makes the class self-auditing — the quote either supports the claim or visibly does not.

**CANDIDATE.** Suggested by similarity, co-citation, or a model. **DECISION:** candidate edges are never displayed as relationships and never used in role assignment. They exist to generate work for verification and to widen retrieval. They are the class most likely to be quietly promoted under deadline pressure, so the prohibition is absolute rather than discretionary.

### The Relation Vocabulary Is Deliberately Small

The brief lists eleven relation types: `cites`, `extends`, `builds_on`, `compares_with`, `uses_method`, `uses_dataset`, `studies`, `evaluates`, `introduces`, `followed_by`, `related_to`.

**DECISION: implement four at MVP.** `cites` and `same_work_as` (verified), `claimed_extends` and `claimed_compares_with` (claimed, quotation-backed).

The reason is that the rest are not separately determinable with acceptable reliability. `extends` versus `builds_on` is a distinction that reference sections do not mark and that a model will guess at, and the guess will be confident. `followed_by` is `cites` reversed plus a judgment about significance that belongs in ranking, not in the graph. `related_to` is a candidate edge wearing a verified edge's name, and it is the single most dangerous entry on the list because it looks harmless.

**DECISION:** expanding the vocabulary requires demonstrating, on a gold set, that the new relation can be assigned correctly more often than a human reviewer would tolerate being wrong. **OPEN:** what that threshold is. It should be set before the first expansion is attempted, not after a candidate implementation exists and wants to ship.

### This Graph Is Documents Only

**DECISION:** the Research Graph described here models *documents and their bibliographic relationships*. Relationships between **ideas** — strengths, weaknesses, trade-offs, what addresses what — are a separate layer with a different epistemic status, defined in [Idea Graph](#idea-graph). Merging them would let interpretive claims inherit the credibility of citation evidence, which is the most consequential category error available in this design.

### Citation Direction Carries Time

**FACT:** citations point backward in time, so the citation graph over a fixed corpus is close to a DAG. This is the property that makes evidence-based role assignment possible at all — it is what lets "foundational" be computed rather than asserted. It is also fragile: preprint-versus-published dates, simultaneous work, and revised versions all introduce apparent cycles. **DECISION:** cycles are detected, logged, and excluded from role computation rather than broken arbitrarily.

### Coverage Is A First-Class Property

**ASSUMPTION:** citation and reference coverage varies substantially by venue, field, and age, and is likely worse for older papers and for venues behind restrictive publisher access.

**DECISION:** every graph-derived signal is accompanied by a coverage estimate for the region of the graph it was computed over, and a reading path computed in a low-coverage region says so on the page. A confident path built from 20% of the edges is worse than an explicit refusal, because the user cannot see the difference from the output alone.

---

## Quality Signals

**DECISION:** no single numeric quality score, and no LLM-assigned quality judgment anywhere in the system. A paper carries a **signal sheet**: a set of named, independently sourced, independently interpretable observations, each with a value, a provenance, and an availability state.

### Universal Signals

Venue tier, award, oral/spotlight, review scores where legitimately available (**VERIFY** per venue; **DECISION:** never used where publication was not intended to be public), citation count, citation velocity, code availability, dataset availability, replication work, follow-up work, adoption by later research, benchmark impact, community usage, author and lab history (low confidence until disambiguation is solved).

Every one of these is `available`, `unavailable`, or `not-applicable-for-this-venue`. **Unavailable is never zero.**

### Field-Specific Signals

**DECISION:** field-specific signals are part of the field's definition in the registry, not a hardcoded branch. The brief's examples — ML benchmark strength and reproducibility; HCI study design and participant methodology; Visualization design-study quality and evaluation methodology; Systems experimental rigor and workload realism — are correct in spirit.

**OPEN, and this is the hardest unsolved problem in the document:** most field-specific signals are not mechanically extractable from metadata. "Participant methodology quality" and "workload realism" are expert judgments that live in the full text. Three options, none obviously right:

1. Extract structured proxies only — participant count, ablation presence, artifact-availability badge — accepting that proxies are shallow.
2. Use a model on full text for a small number of high-value candidates, marked as interpretation and excluded from ranking.
3. Defer field-specific signals entirely until the universal set has been evaluated against gold sets.

**DECISION for MVP: option 3**, with option 1 as the first extension. Option 2 is deferred until there is an evaluation method that can detect when it is wrong — otherwise it reintroduces the opaque LLM quality score under a different name.

### No Cross-Field Comparison

**DECISION:** the system never ranks a CHI paper against an OSDI paper on quality. Signals are comparable within a field and are not commensurable across fields. Where a user's interests span fields, results are grouped by field rather than interleaved by score.

This costs a unified "top papers" view. That view would have been a fiction, and its plausibility is exactly what makes it harmful.

---

## Personalization

**DECISION, inherited and unchanged:** collection is independent of interests. The pipeline ingests everything the registry covers. Interests affect ranking only.

The test: **changing every interest weight must require no re-ingestion and no backfill.** If a change to interests requires re-fetching anything, interests have leaked into collection.

Interests are weighted, multi-topic, and expressed over the reader taxonomy — not the research annotation — so they stay small enough to edit by hand.

**Two personalization contexts, and they are not the same:**

**Private (the author).** A weighted interest profile, reading history, and queue state. Lives in the pipeline repository. Rich, stateful, per-person — permitted because it never touches the public site.

**Public (site readers).** **FACT:** `product-boundaries.md` permits only URL parameters and `localStorage`, with the governing test that *the site must not be able to tell two readers apart*. **DECISION:** published reading paths and feed items are static and identical for every reader. Client-side filtering may show and hide. Nothing is sent to a server, and no page is rendered differently per reader.

---

## Ranking

Five concepts stay separate all the way to the surface, each computed from its own signals:

| Concept | Question | Primary inputs |
|---|---|---|
| **Significance** | Is this important to the field? | Venue, honors, citations, velocity, follow-up, adoption |
| **Relevance** | Does it match stated interests? | Topic overlap, embedding similarity, method and dataset overlap |
| **Learning value** | Does it build understanding? | Graph position, role candidacy, survey status, prerequisite depth |
| **Novelty** | Is it new relative to what is known? | Distance from the read corpus, claimed contribution, recency of the *idea* |
| **Recency** | Is it new in time? | Publication date |

**DECISION:** no production weights are assigned in this document. Inventing them now would produce numbers that look authoritative, get copied into code, and never get revisited. Weights are fitted against gold sets in Phase 4, and the fitting procedure — not the resulting numbers — is the durable artifact.

**DECISION:** the ranker is a linear or otherwise directly inspectable model over named features. Not because a learned nonlinear model would rank worse, but because principle 6 requires a one-sentence explanation naming the signals that moved an item, and because with one user there is nowhere near enough labeled data to justify a complex model.

**DECISION:** the four concepts combine differently per mode, and this is the point of separating them. Radar weights significance and recency and suppresses learning value. Learn Mode weights learning value and significance and nearly ignores recency — a 2016 paper should win a Foundation slot against a 2025 paper routinely. A single global formula cannot do both, which is why the brief's `Relevance × Significance × Learning × Novelty` is a useful decomposition and a poor production formula.

### Ranking Errors Must Be Nameable

**DECISION:** the error taxonomy is defined before the ranker, because a system that cannot name its failures cannot improve:

- **Miss** — a gold-set paper not retrieved at all. Usually a coverage or annotation failure, not a ranking failure.
- **Burial** — retrieved but ranked below the cut.
- **Intrusion** — a non-gold paper ranked above gold papers.
- **Misrole** — correctly retrieved and ranked, wrong path stage.
- **Misorder** — right stage, wrong position within it.

Misses and intrusions are ranking problems. Misroles are path-generation problems. Conflating them sends fixes to the wrong component, which is the most common way systems of this kind stall.

---

## Reading Path Generation

The differentiating feature, and the one most likely to fail quietly.

**DECISION:** roles are assigned from graph evidence and temporal structure, not from a model's opinion. Each role has a computable definition over the topic subgraph.

Given a topic, take the subgraph of papers annotated to it plus their citation closure. Then:

**Survey** — paper type is survey or review, from authoritative metadata or a title and structural pattern. The most reliable role, because it is nearly a metadata lookup.

**Foundation** — high in-degree *from within the topic subgraph*, early relative to the topic's own timeline, and still cited by recent work. **DECISION:** in-degree must be measured inside the subgraph, not globally, or every path's Foundation stage fills with famous general papers — Adam, ResNet, "Attention Is All You Need" — that are foundational to *everything* and therefore explain nothing about this topic. This single scoping choice is the difference between a useful path and a generic one.

**Core** — high in-degree within the subgraph, dated in the field's middle period, and forming a connected component with Foundation. These are the papers current work assumes you have read.

**Bridge** — high betweenness on the citation DAG between the early and recent temporal strata: cites the early cluster substantially and is cited substantially by the recent cluster. **DECISION:** this is the role that most justifies building a graph at all. It is not derivable from similarity, recency, or citation count alone, and it is the role a newcomer most needs and least knows to look for.

**Alternative approach** — a distinct method cluster addressing the same problem, with low citation overlap with the main line. Identified by clustering over method annotation and embedding, with an explicit low-overlap requirement, so the path shows a competing lineage rather than a near-duplicate.

**Current** — recent, accepted, well-connected to Core.

**Frontier** — very recent, weakly connected, often Radar tier. **DECISION:** Frontier is always visually separated and always shows provenance, because it is the stage where the system's confidence is lowest and the user's ability to check is weakest.

### Explanation

**DECISION:** every placement gets a sentence built from the *evidence that produced it*, not written freely by a model. "Cited by 14 of the 20 Core papers in this topic, published 2016, still cited by 2025 work" is an explanation. "This seminal paper laid the groundwork for the field" is a generated sentence that would be equally fluent if the placement were wrong. A model may improve the *phrasing* of an evidence-derived sentence; it may not supply the *content*.

### Refusal

**DECISION:** the system refuses to emit a path when evidence is insufficient — too few papers, citation coverage below threshold, no Foundation candidate, no Bridge. Partial paths are permitted and must be labeled as partial, with the missing stages named.

This is principle 13 at the point where it costs the most, and where the temptation to fill the gap with something plausible is strongest. A reading path is consumed by someone who by definition cannot evaluate it — that is why they asked. **OPEN:** the specific thresholds, which should be set from gold-set experiments rather than chosen in advance.

---

## AI Usage

### Two Regimes, Not One

**DECISION:** there are two distinct AI regimes in this system, with different economics, different risk profiles, and different rules. Conflating them is how a cheap pipeline becomes an expensive one and how a careful reader becomes a careless summarizer.

| | Pipeline regime | Reading regime |
|---|---|---|
| Trigger | Scheduled ingestion | The user opens a paper |
| Input | Metadata, abstracts | Full text, figures, tables |
| Volume | Thousands of items | Single papers, a few per week |
| Cost per item | Must be near zero | May be substantial |
| Failure cost | A bad candidate in a queue | A wrong belief the user acts on |
| Governing rule | Cheap filters first, model last | Grounding required on every claim |

The funnel below governs the **pipeline regime** only. The reading regime is not a funnel: it is invoked deliberately, on one paper, by a user who has already decided the paper matters, and its constraint is not cost but **traceability**.

**DECISION:** the two regimes never share a prompt, a model configuration, or an output namespace. A pipeline-regime summary is a triage artifact and must never be displayed where a reading-regime explanation would be expected, because they carry different evidentiary weight.

### Pipeline Regime

**DECISION:** models run late, on small sets, on high-value candidates, and never as the first filter. The funnel from the brief is adopted as a design target — roughly 5,000 collected → 500 topically plausible → 80 candidates → 15 inspected → 3–5 recommended — with the stage sizes treated as an **ASSUMPTION** to be re-derived from real volumes.

Stages, cheapest first: registry and metadata filters (free, deterministic) → taxonomy keyword filters, reusing the `positiveKeywords` / `negativeKeywords` already in the topic schema → embedding retrieval → graph signals → model inspection of a handful.

**FACT:** `discover-direction.md` already establishes keyword-first classification with model escalation. This is the same architecture applied to a larger corpus.

### What Models Are Allowed To Do

Permitted: draft summaries from source text; extract structured claims *with quotations*; propose topic annotations as `proposed`; propose candidate relations; improve the phrasing of evidence-derived explanations.

**Prohibited, as design constraints rather than preferences:**

- Assign a quality score.
- Assert a relation without a quotation.
- Determine acceptance status.
- Decide a path role.
- Generate a prerequisite claim not backed by a citation edge.
- Write anything published without human review.
- Assert that a research idea is novel.
- State a paper's weakness without either an author statement or a citing paper's criticism behind it.

**DECISION:** AI output is stored in its own namespace, is marked as interpretation wherever displayed, and carries model and prompt version. **FACT:** `discover-direction.md` already requires `review.aiDraftUsed: true` and human review before publication; that gate is unchanged and extends to everything here.

### Explanations Worth Generating

What problem is solved; what prior work did; what is new; why it matters; why *this user* should read it; prerequisite concepts; what to read before and after; limitations; code and data availability.

**DECISION:** "what to read before" must be backed by a citation edge or it is not emitted. It is the field most likely to be fabricated, because a fluent model can always name a plausible predecessor, and it is the field a learner is least able to check.

---

## The Research Thinking Loop

Everything from here to [Guardrails](#guardrails) serves one loop:

```
Discover → Understand → Question → Hypothesize
    ↑                                    ↓
Revise ← Evaluate ← Experiment ← Verify Prior Art
```

**Why it is modeled explicitly.** Each arrow is a place where work is normally lost. A paper is read and the criticism is never written down. A question occurs and is forgotten. A hypothesis is pursued without checking whether it was answered in 2019. An experiment fails and the failure is discarded rather than interpreted. **DECISION:** every arrow in this loop has a durable record, and the records are linked, so the loop can be traversed backward — from a result, to the hypothesis, to the question, to the paper, to the passage.

**Three layers of navigation, one workflow.** The layers must compose rather than sit beside each other:

| Layer | Granularity | Moves between |
|---|---|---|
| Research-level | A field | Foundation → Core → Bridge → Current → Frontier |
| Paper-level | One paper | Triage → guided understanding → selective source reading → full reading |
| Thinking-level | An idea | Understand → Critique → Compare → Question → Hypothesize → Verify → Experiment → Revise |

**DECISION:** the layers are connected by shared entities, not by navigation links. A path stage contains papers; a paper contains notes; a note can become a question; a question can become a hypothesis; a hypothesis names the papers that motivated it. Because the entities are shared, moving between layers requires no export step, and nothing has to be re-entered by hand. Features that merely link to each other decay; features that share a record do not.

**ASSUMPTION:** the loop is entered most often in the middle, not at Discover. The most common real entry point is "I read something and disagreed with it." The design must not require starting at the top.

---

## AI-Assisted Reading

**Why it exists.** Reading a paper linearly from abstract to references is the wrong strategy for most papers, and the right strategy for a few. The cost being attacked is **navigation and comprehension**, not the act of reading. A reader who knows which section answers their question, and what the paper's argument is before they start, reads faster and understands more.

**What problem it solves.** The decision of *how much* of a paper to read is currently made either arbitrarily or after the cost has already been paid.

### The Guardrail, Stated Honestly

The brief's rule is "AI must not replace reading the original paper." **DECISION: that rule is kept, but restated, because the slogan version is unenforceable and quietly false.** A Level 2 explanation good enough to be useful *is* sufficient for most papers most of the time — that is precisely its value. Deliberately degrading it to force source reading would make the system worse at its actual job.

The enforceable rule is:

> **Every non-trivial claim in a generated explanation carries a location in the source, and opening that location costs one action.**

The design target is not "make the summary insufficient." It is "make checking nearly free." A reader who never checks has made a choice; a reader who *cannot* check has been given a black box.

**DECISION — the measurable proxy:** the **source-open rate** — how often a reading session results in the user opening at least one cited location. **ASSUMPTION:** a healthy rate is well above zero and well below one. If it trends to zero, the system has become a replacement regardless of intent, and that is a design failure to be acted on, not a usage statistic to note. **OPEN:** the threshold at which to act.

### Progressive Reading Levels

**Level 1 — Triage.** One-minute overview: research problem, main contribution, why it may matter, prerequisite knowledge, and an explicit **reason to read / reason to skip** pair.

*Behavior:* generated from abstract and metadata only, so it is cheap enough to run on everything in the queue. *Evidence:* abstract, venue, honors, and the signal sheet. *Failure:* a fluent overview that makes a weak paper sound worth reading — mitigated by requiring the reason-to-skip field to be non-empty. A triage card with no reason to skip is incomplete, not a strong endorsement.

**Level 2 — Guided Understanding.** The paper's argument: background, previous approach, research gap, core idea, method, experiments, main results, limitations, important figures and tables, key assumptions.

*Behavior:* requires full text. Each element carries a source location. *Evidence:* the paper itself, section by section. *Failure:* the two failure modes are **confidence inflation** (hedged claims rendered as settled) and **gap fabrication** (a research gap the authors never claimed). Both are checked in the grounding audit below.

**Level 3 — Selective Deep Reading.** The user asks a question; the system answers *and* points to the evidence.

```
Question: Why did the authors choose this projection method?

AI interpretation: <explanation>

Source evidence:
  Section 4.2 — Projection Method
  Figure 3
  Page 7
  [open]
```

*Behavior:* this is the level where the system is genuinely a navigation layer rather than a summarizer, and **DECISION:** it is the level whose quality matters most. A wrong location is worse than no location, because it spends the user's trust and their time simultaneously. *Evidence:* a resolved structural location in the parsed document. *Failure:* plausible-but-wrong locations — the single most damaging defect in the whole reading layer, because it is invisible unless checked.

**Level 4 — Full Reading.** Recommended, not performed. **DECISION:** the system explicitly recommends full reading when the paper is foundational in a path, is intended for citation, is to be reproduced, is methodologically central to the user's own work, or introduces theory that a summary cannot carry. Naming these conditions makes full reading a deliberate decision rather than a thing that never happens.

### Source Grounding

**DECISION:** four content classes, never merged, distinguishable at a glance and in storage.

| Class | Origin | May be published? |
|---|---|---|
| `SOURCE_FACT` | Stated in the paper, with a location | Location yes, passage no |
| `AI_INTERPRETATION` | Generated inference | Only as human-rewritten prose |
| `USER_NOTE` | Written by the user | Yes, it is the user's own writing |
| `HYPOTHESIS` | Candidate claim, unverified | Only when labeled as such |

**DECISION — uncertainty is preserved verbatim.** Hedging language is copied, not paraphrased. "Our results suggest" stays "suggest." **DECISION:** this is partially checkable by machine — comparing hedge-word density between a source passage and its rendering flags the most common form of confidence inflation without needing a human to read both.

**DECISION — grounding quotations never leave the private side.** **FACT:** [`product-boundaries.md`](./product-boundaries.md) already requires raw PDF text and copied paper text to stay private. Locations (Section 4.2, Figure 3) are references and may be published; reproduced passages may not, regardless of length. **VERIFY:** quotation rights differ by publisher and this line is drawn to avoid needing the answer. Private reading tooling quoting into the user's own notes is ordinary personal use; a published page reproducing passages is redistribution.

### Language

**DECISION:** Level 2 and Level 3 output is **Korean prose with technical terminology preserved in English**. `contrastive representation learning` stays in English; the explanation around it is Korean.

This is deliberately the **inverse** of the Discover language policy, and the inversion is correct rather than an inconsistency. **FACT:** [`discover-direction.md`](./discover-direction.md) makes Discover English-primary because its items are short, close to English sources, and aimed at readers filtering an ecosystem. The AI Reader is private, long-form, and aimed at one person thinking — for which the native language is faster and the English terms are the actual searchable, citable handles. Translating a term makes it unlookuppable, which defeats the purpose.

**DECISION:** a small **term glossary** records which terms stay in English and how each is explained, so the same term is not explained three different ways across three papers. It is a by-hand artifact and stays small.

### How It Is Evaluated

**DECISION — the grounding audit.** Sample N claims from generated Level 2 and Level 3 output. Score each:

- `supported` — the cited location says this
- `overstated` — the location supports something weaker
- `unsupported` — the location does not support it
- `location wrong` — the cited location is not where this is discussed

**DECISION:** `location wrong` and `unsupported` are release-blocking defects; `overstated` is tracked as a rate. **OPEN:** the acceptable rates. They should be set from a first audit rather than guessed, but they must be set before the reader is relied on for anything that becomes writing.

Secondary measures: source-open rate; hedge-preservation checks; and comprehension, measured indirectly through [Active Recall](#active-recall).

---

## Paper Analysis

**Why it exists.** Problem / Method / Result / Limitation is a summary template. It describes a paper in isolation, and papers are not written in isolation — they are moves in an argument. A reader who does not see the move cannot evaluate whether it was a good one.

**What problem it solves.** The reason a paper was written is usually the most useful thing about it and the least likely to be stated plainly.

**Behavior.** For every paper read at Level 2 or deeper, produce an **idea-transition record**:

```
Previous idea → Strength → Weakness → Modification → Improvement → New trade-off → Open problem
```

Answering, at minimum: what was the dominant prior approach; what was *good* about it and why researchers used it; what was missing, and of what kind — technical, conceptual, evaluative, scalability, usability, generalization, or cost; what this paper changed; which prior strengths it preserved; which weakness it targeted; what new trade-offs it introduced; what it assumes; whether the evidence actually supports the claims; what remains unresolved.

**DECISION:** "which prior strengths did it preserve" is mandatory and is the question most often skipped. Papers describe what they improved; they rarely state what they kept. That omission is exactly where an incautious reader concludes the new method dominates the old one, when it usually trades.

### Where Weakness Evidence Actually Comes From

This is the crux, because "what is wrong with this paper" has no authoritative source. Three real sources, in descending reliability:

1. **The authors' own limitations section.** `SOURCE_FACT`, with a location. Reliable and systematically incomplete — authors disclose the limitations they are comfortable disclosing.

2. **Criticism in later citing papers.** **DECISION — this is the highest-value under-used signal in the system.** When a 2023 paper writes "unlike X, which requires per-dataset tuning," that is an *expert-authored, evidence-backed, externally-sourced weakness claim about X*. It reuses the `claimed_*` edge mechanism already defined in [Research Graph](#research-graph): the evidence is the quoted sentence, the provenance is the citing paper. Mining related-work sections for criticism of earlier work converts the citation graph into a weakness graph, and unlike an LLM's opinion it is attributable to a named researcher who put it in print.

3. **Public peer review.** **VERIFY:** OpenReview reviews appear to be public for some venues and years. Where available they are the densest source of expert-identified weaknesses in existence. **DECISION:** where a venue publishes reviews, weakness extraction uses them as a primary source. **FACT:** this does not help the MVP — IEEE VIS does not publish reviews (**VERIFY**) — which is a real argument for a second gold set from a venue that does.

**DECISION:** a weakness with no source from 1–3 is an `AI_INTERPRETATION` and is labeled as such wherever it appears. It is not forbidden — a reader's own critical reaction is valuable — but it is never presented as something the literature says.

**What can go wrong.** Manufactured lineage: the model names a "previous dominant approach" that was not dominant, or was not what these authors were responding to. **DECISION:** the previous-approach claim must be backed by a citation edge *from this paper* or by the paper's own text. Papers say who they are arguing with, usually in the first two paragraphs.

**How it is evaluated.** Against papers whose lineage is independently known — typically the gold set, where the sequence is documented. Score: is the named prior approach the one the paper actually responds to; is the preserved-strength claim correct; is any stated weakness traceable to source 1, 2, or 3.

---

## Idea Graph

**Why it exists.** Research progress happens at the level of ideas, and ideas do not map one-to-one onto documents. One paper can introduce three ideas; one idea can span a decade and twelve papers. A graph whose only nodes are documents cannot express "this weakness has gone unaddressed since 2017," which is exactly the observation that produces research questions.

**DECISION: the Idea Graph is a separate layer from the Paper Graph, with a fundamentally different epistemic status, and the difference must never blur.**

| | Paper Graph | Idea Graph |
|---|---|---|
| Nodes | Documents | Ideas, problems, strengths, weaknesses, trade-offs, assumptions, hypotheses, experiments, results |
| Edges | `cites`, `same_work_as` | `addresses`, `preserves`, `introduces`, `assumes`, `contradicts`, `combines_with`, `supports`, `challenges` |
| Ground truth | Exists, externally verifiable | **Does not exist anywhere** |
| Scale | The whole corpus | Only what the user has read |
| Author | The pipeline | The user, assisted |

**The load-bearing consequence.** A citation edge is checkable against a reference list. "Idea B addresses Weakness W" is checkable against nothing — no paper contains a machine-readable list of the weaknesses it addresses. The Idea Graph is *interpretation by construction*. Every mitigation elsewhere in this document relies on being able to point at a source; here there frequently is none.

**DECISION: Idea Graph nodes and edges are human-confirmed or they do not exist.** The model proposes; the user confirms, edits, or rejects; only confirmed elements enter the graph. Proposals live in a separate holding area indefinitely and are never traversed, queried, or displayed as relationships.

**Three consequences follow, and they are the reason this decision is worth its cost:**

1. **The Idea Graph is a byproduct of reading, not a pipeline output.** It grows when the user reads and thinks. It cannot be batch-generated, and an attempt to batch-generate it would produce a large, plausible, unfalsifiable object — the single worst outcome available anywhere in this design.

2. **It does not scale to the corpus, and must not try.** **ASSUMPTION:** it covers tens of papers per year, not thousands. That is small enough to be stored as inspectable, hand-editable files and reviewed in full periodically. No embedding infrastructure is needed for it.

3. **[Research Notebook](#research-notebook) must be built first.** The Idea Graph's nodes are, almost entirely, confirmed notes. Building the graph before notes exist means designing a schema for data that has never been collected — and the shape of real notes is the thing most likely to invalidate the schema.

**Edge requirements.** Every edge carries provenance (which paper, which passage, or which note), evidence (the quotation or note text), confidence, and **explicit versus inferred**. An inferred edge is displayed differently and is excluded from any query whose result would be presented as a finding.

**What can go wrong.** The graph becomes a private wiki that is written and never read — plausible, and mitigated only by [Cross-Paper Synthesis](#cross-paper-synthesis) giving it a read path. And confirmation drift: the user clicks "confirm" on fluent proposals without checking. **DECISION:** confirmation requires selecting or writing the evidence, not just accepting. Making confirmation cost something is the only defense against rubber-stamping.

**How it is evaluated.** Not by size — a large Idea Graph is not a good one. By whether queries over it produce observations the user did not already hold, and by periodic re-review: sample confirmed edges after three months and ask whether they still look right. Edges that decay on re-reading indicate the confirmation step is too easy.

---

## Cross-Paper Synthesis

**Why it exists.** The most valuable observations in a literature are usually not in any single paper: a limitation that recurs across ten papers and is solved by none; two lines of work that optimize opposite ends of one trade-off without citing each other; an assumption everyone shares and nobody tests.

**What problem it solves.** Reading papers one at a time systematically hides exactly this class of pattern.

**Behavior.** Over a set of papers the user has read, build a comparison matrix — problem, core idea, assumptions, strengths, weaknesses, evaluation, results, trade-offs, open problems — and then surface candidate patterns: recurring weaknesses, opposing trade-offs, shared assumptions, contradictions, complementary strengths, and unexplored combinations.

Example output, and note its labeling:

```
AI ANALYSIS — inferred, not stated by any source

Paper A: high accuracy, poor interpretability
Paper B: good interpretability, lower fidelity
Paper C: strong scalability, weak human evaluation

Observation: these appear to optimize different sides of one trade-off.
Basis: confirmed weakness nodes W3, W7, W7, W11 across the three papers.
```

**DECISION:** synthesis output is always `AI_INTERPRETATION`, always names the confirmed nodes it was computed from, and is never stated as a fact about the literature. A synthesis that cannot name its basis nodes is not emitted.

**DECISION:** synthesis runs only over **confirmed** Idea Graph elements. Running it over proposals would compound interpretation on interpretation, and the output would be fluent, specific, and untethered.

**DECISION — do not flatten methodological differences.** When two papers differ in a way the matrix cannot represent, the matrix cell must say so rather than pick the nearer label. A comparison matrix is a lossy projection, and the lossiness is where the false equivalences get made.

**What can go wrong.** Pattern-matching on vocabulary rather than substance: two papers that both say "scalability" meaning different things. **DECISION:** patterns cite the underlying notes, so the user can see whether the shared word is a shared concept — which is a check the user can perform in seconds and the system cannot perform at all.

**How it is evaluated.** By whether the user acts on a synthesis output — turning it into a question, a hypothesis, or a post. **DECISION:** synthesis that is read and never acted on for an extended period is a feature to cut, not to tune. It is the most seductive feature in the document and needs the strictest justification.

---

## Research Notebook

**Why it exists.** It is the only part of the system whose content cannot be recomputed. Papers can be re-fetched, graphs rebuilt, summaries regenerated. What the user thought while reading exists nowhere else.

**DECISION: this is the highest-value, lowest-cost, earliest-shippable component in the entire document, and it should be built first in the thinking track — before the AI Reader, before the Idea Graph, before synthesis.**

The argument: it requires no pipeline, no model, no full-text access, and no graph. It is typed notes attached to paper records. And it is the input everything downstream consumes — the Idea Graph is confirmed notes, synthesis runs over confirmed notes, and the best hypothesis source is recurring patterns in notes. Building the consumers before the producer means designing against imagined data.

It is also the cheapest possible validation of the entire second half of this document. **DECISION:** if the user will not keep structured notes on twenty papers, the Idea Graph, synthesis, hypothesis, and experiment layers have no input and should not be built. That is a real stopping test, it costs almost nothing to run, and it should be run before anything expensive is committed to.

**Behavior.** Typed notes: *I learned*, *I disagree*, *interesting result*, *important limitation*, *question*, *potential hypothesis*, *experiment idea*, *related to my project*, *related paper*, *need to revisit*, *unexpected observation*.

**DECISION:** the types are data, not an enum — same rule as the taxonomy and the venue registry. They will be wrong at first. **DECISION:** a note may anchor to a location in a paper, and an anchored note is more valuable than a floating one, but anchoring is never required. A required anchor would suppress the note that matters most: the vague disagreement that has not yet found its target.

**Pattern surfacing.** Over time, report recurrences: *"you have marked evaluation reliability as an important limitation in 7 papers over three months"*; *"three papers in different domains describe the same stability problem."*

**DECISION:** this is the system's best hypothesis generator, and it is better than a model prompt because it is grounded in accumulated human judgment rather than plausibility. It is also why note types must be consistent enough to aggregate — the one place where a little schema rigidity pays.

**The cold start is real.** **ASSUMPTION:** pattern surfacing needs somewhere around fifty notes across twenty-plus papers before it says anything non-obvious. **DECISION:** do not build pattern surfacing until that volume exists. Building it early produces an empty feature that teaches the user it has nothing to offer, which is hard to undo.

**What can go wrong.** Write-only notes: captured, never revisited, no value returned. Mitigated only by pattern surfacing and synthesis actually working — which is why those are the payoff and not the point.

**How it is evaluated.** Notes per paper read; proportion revisited; how many become questions, hypotheses, or blog posts. **DECISION:** the last is the real measure. A notebook that never produces writing is a diary, which is fine but is not this system.

---

## Active Recall

**Why it exists.** Reading a good explanation produces a strong feeling of understanding that is weakly correlated with actual understanding. This is the well-known fluency illusion, and an excellent AI Reader makes it *worse*, not better — smoother explanation, stronger illusion.

**What problem it solves.** It is the only mechanism in the document that measures whether the reading layer worked.

**Behavior.** After guided reading, optionally ask: explain the problem in your own words; why was the previous approach insufficient; what is the strongest contribution; which assumption seems most fragile; which experiment matters most; **what result would invalidate the authors' claim**; which limitation would you attempt to address; how would you combine this with another method you have read.

**DECISION:** the falsification question — what result would invalidate the claim — is mandatory for any paper the user marks as important. It is the single question that most reliably separates understanding from familiarity, and it doubles as preparation for [Experiment Design](#experiment-design).

**DECISION:** opt-in, capped at a handful of questions, and skippable without friction. A mandatory quiz after every paper would be abandoned within a month and would take the notebook with it.

**DECISION:** answers are `USER_NOTE`. They are the user's own thinking and belong in the notebook, not in a score.

**DECISION:** the system does not grade answers. It may show what the paper says on the same point and let the user compare. Grading understanding is a claim to authority the system has not earned, and a wrong grade is worse than none.

**What can go wrong.** It becomes a chore, or it drifts into trivia about the paper rather than questions about the research. **DECISION:** questions must be answerable only by someone who followed the argument — no questions whose answers are single facts retrievable from the abstract.

**How it is evaluated.** Whether the user can answer without re-reading the summary; whether answers become notes; completion rate over time, read as a signal about the feature rather than about the user.

---

## Hypothesis Generation

**Why it exists.** Observed limitations should become investigable questions rather than remaining observations.

**This is the feature most likely to be worthless, and the design says so.** LLM-generated research questions are fluent and overwhelmingly either trivial, already answered, or unfalsifiable. The generation step is cheap and low-value; the **verification** step is expensive and high-value.

**DECISION — invert the generator.** The system's primary role is not to invent research questions. It is to take a question the user already has — from a note, a disagreement, a recurring pattern — and *formalize and attack* it: make it falsifiable, name its assumptions, identify what would refute it, and find the prior work that may have settled it.

Model-generated questions are permitted as a secondary prompt, clearly marked, and are expected to be mostly discarded. **DECISION:** they are never presented as research directions, only as prompts to react to. The value of a bad generated question is the user's articulation of why it is bad.

**Behavior.** A hypothesis record carries: the observation that motivated it, with its source; the question; the hypothesis as a falsifiable statement; assumptions; what would refute it; the prior-art check and its outcome; the experiment design if it survives; results; revisions.

Worked example, in the shape the record should take:

```
Observation   Projection output changes substantially across random seeds.
Source        Note N41 on Paper P12 (anchored, Section 5.3) + confirmed weakness W7.
Question      Can a stability-aware projection improve cross-run consistency?
Hypothesis    Adding stability constraints improves cross-run consistency
              without significantly degrading neighborhood preservation.
Refuted by    Neighborhood preservation degrades beyond <threshold>, or
              cross-seed variance does not decrease.
Status        CANDIDATE HYPOTHESIS — prior art not yet checked.
```

**DECISION:** every generated idea enters as `CANDIDATE HYPOTHESIS`. **The system never uses the word "novel" about a user's idea, in any surface, at any stage.** Not "potentially novel," not "appears novel." Novelty is a claim about the entire literature, and nothing here can support it.

**What can go wrong.** Motivated reasoning — the user's preferred hypothesis is formalized rather than challenged. **DECISION:** the *refuted by* field is mandatory and must be filled before the record can advance to prior-art checking. A hypothesis with no refutation condition is not a hypothesis.

**How it is evaluated.** What proportion survive prior-art checking; what proportion reach an experiment; what proportion of *those* are revised rather than abandoned. **DECISION:** a very high survival rate indicates the prior-art check is too weak, not that the ideas are good.

---

## Prior-Art Verification

**Why it exists.** The most common failure in independent research is spending months on a question answered in 2019. This is also where the discovery half of the system pays for itself — it is the one place the corpus, graph, and retrieval are directly useful to the thinking layer.

**Behavior.** Candidate idea → generate search concepts → search → compare against what is found → classify:

| Outcome | Meaning |
|---|---|
| A | Already explored |
| B | Partially explored |
| C | Similar but meaningfully different |
| D | No closely matching prior work found **in the searched scope** |
| E | Insufficient evidence to judge |

**DECISION:** outcome D is phrased that way permanently, in storage and in every display. "No prior work found" and "no prior work exists" differ by everything, and the shorter phrasing is what turns a search result into an unfounded novelty claim. **DECISION:** absence of a result is never recorded as evidence of novelty — this is [principle 13](#the-principle-that-was-missing) applied where it is most tempting to violate.

**DECISION:** every check records its exact scope — sources searched, query concepts used, date range, venues covered, corpus version, and date. Without the scope, outcome D is uninterpretable a month later, and the record's whole purpose is to be interpretable later.

**DECISION:** outcome E is a first-class result and must not be avoidable by picking A–D. The honest answer is frequently "I cannot tell," particularly where the corpus is narrow — which, in the MVP, it certainly is.

**What can go wrong.** A narrow corpus produces false D outcomes with high confidence. **DECISION:** where the search scope is narrower than the idea's field, the record says so explicitly and D is downgraded to E. **ASSUMPTION:** in the VIS-first MVP this will be the common case, and the system should feel appropriately unhelpful about it rather than falsely reassuring.

**How it is evaluated.** Plant hypotheses whose prior art is known to exist in the corpus and check they are found — the same method as the discovery half's gold sets, applied to idea-level retrieval. **DECISION:** this is a required test before prior-art verification is trusted for a real decision.

---

## Experiment Design

**Why it exists.** An idea that survives prior-art checking is still not investigable until it has a design. Writing the design is also the cheapest way to discover the idea is not testable.

**Behavior.** The system helps structure: research question; hypothesis; independent variables; dependent variables; baselines; datasets, participants, or workloads; metrics; controls; ablations; expected outcomes; **failure conditions**; alternative explanations; threats to validity; and a **minimum viable experiment**.

**DECISION:** *failure conditions* and *alternative explanations* are mandatory. They are the two fields that make an experiment falsifiable rather than demonstrative, and they are the two most often omitted.

**DECISION:** the *minimum viable experiment* is mandatory and is derived before the full design. **ASSUMPTION:** most candidate ideas are abandoned, so the first version of any experiment should be the cheapest thing that could refute the hypothesis. Designing the complete study first is how solo research projects die.

**DECISION — the system actively resists confirmation-biased design.** Concretely: it flags a design with no condition under which the hypothesis loses; it requires baselines the user did not choose to favor; it asks what result the user expects and then asks what *else* could produce it. **DECISION:** this adversarial posture is a stated design property, because the natural failure mode of an assistant is agreeableness, and an agreeable experiment designer is worse than none.

**DECISION:** field-appropriate structure comes from the registry's field definition, not from a generic template. A user study and a systems benchmark share almost no design vocabulary, and a template that covers both covers neither.

**What can go wrong.** Over-design — a beautiful protocol that is never run. Mitigated by the minimum-viable-experiment requirement. And metric selection driven by what is easy to measure rather than what the hypothesis is about.

**How it is evaluated.** Proportion of designs actually executed; proportion whose results were interpretable; how often a design was revised *before* running because writing it exposed a flaw. **DECISION:** the last is the feature's best outcome and should be counted explicitly — an experiment abandoned at the design stage is a success, not an attrition.

---

## Experiment Tracking And Idea Revision

**Why it exists.** The loop does not assume experiments succeed. **FACT:** most do not. A system that records only successful outcomes produces a false history of the user's own research and destroys the information that failure carries.

**Behavior.** Every experiment has a record linked to its hypothesis, with an outcome:

`SUPPORTED` · `PARTIALLY SUPPORTED` · `NOT SUPPORTED` · `INCONCLUSIVE` · `UNEXPECTED RESULT`

**DECISION:** `UNEXPECTED RESULT` is deliberately not a variant of the others. It is the outcome most likely to be scientifically interesting and most likely to be discarded as noise or error, so it gets its own status and is never auto-collapsed into `NOT SUPPORTED`.

**DECISION:** outcomes are immutable. A revision creates a *new* linked record rather than editing the old one. The chain of what was believed, tested, and revised is the research history, and editing it away is the specific loss this section exists to prevent.

**After a result, the system prompts interpretation** rather than closing the record: why did it fail; was the assumption wrong; was the metric inappropriate; was an uncontrolled variable responsible; did the failure reveal a phenomenon; should the *question* change rather than the method.

**DECISION:** the last question is the most important and the least often asked. A failed experiment more often indicts the question than the method.

**Revision loop.** `Hypothesis → Experiment → Observation → Interpretation → Revised hypothesis`, with every step linked backward. **DECISION:** a revised hypothesis inherits the full lineage, so the eighth version can be traced to the note on the paper that started it. That traceability is the point — it is the thing a lab notebook does and a pile of files does not.

**What can go wrong.** Failures silently stop being recorded, because recording a failure is unpleasant and nothing forces it. **DECISION:** an experiment record created without an outcome is surfaced as open indefinitely. Unfinished is a visible state, not an absent one. **OPEN:** whether to distinguish *abandoned* from *unfinished* — abandonment is itself a result, but a status nobody selects is not a status.

**How it is evaluated.** Proportion of experiments with recorded outcomes; proportion of failures with recorded interpretations; how often an unexpected result led to a new question. **DECISION:** a suspiciously high supported rate is treated as a recording problem, not a research triumph.

---

## Guardrails

Consolidated from the whole document. Each names the mechanism that enforces it, because a guardrail without a mechanism is a wish.

| Failure mode | Mechanism |
|---|---|
| AI replaces the original paper | Locations on every claim; one-action open; source-open rate monitored |
| Hallucinated paper claims | Grounding audit; `location wrong` and `unsupported` are release-blocking |
| Hallucinated research lineage | Prior-approach claims require a citation edge or paper text |
| Unsupported novelty claims | The word "novel" is never applied to a user idea; outcome D is scope-qualified |
| Citations treated as proof of quality | Signal sheet, no single score, no cross-field comparison |
| Experiments without hypotheses | *Refuted by* is mandatory before an idea can advance |
| Confirmation-biased design | Mandatory failure conditions and alternative explanations; adversarial posture |
| Uncertainty summarized away | Verbatim hedging; hedge-density comparison |
| User speculation becoming fact | Four content classes, never merged; `HYPOTHESIS` is its own class |
| Failed experiments lost | Immutable outcomes; revisions are new records; open experiments stay visible |
| AI notes merged with human notes | Separate namespaces, separate storage, separate display; never concatenated |
| Synthesis presented as source fact | Always `AI_INTERPRETATION`; must name its basis nodes or is not emitted |
| Idea Graph filled with fluent guesses | Human confirmation required; confirmation requires selecting evidence |
| Proposals promoted to confirmed under pressure | Separate holding area; proposals are never traversable |

**DECISION:** these are testable properties, not review guidelines. Each should eventually have a check that fails rather than a person who remembers.

---

## Product Surfaces

Six surfaces. **DECISION:** exactly one of them is public. The rest are private tooling, which is what keeps the guardrails in [`product-boundaries.md`](./product-boundaries.md) intact without a single carve-out.

| # | Surface | Question it answers | Public? |
|---|---|---|---|
| 1 | Research Radar | What new research is worth checking? | Output only, via Discover |
| 2 | Research Map / Reading Path | What should I read, in what order? | Output only, as static pages |
| 3 | Reading Queue | What have I decided to read? | No |
| 4 | AI Reader | How do I understand this paper without replacing it? | No |
| 5 | Research Notebook | What did I learn, question, or disagree with? | No — derived writing may be |
| 6 | Idea / Experiment Workspace | What should I investigate next? | No |

**DECISION:** surfaces 4–6 produce no public artifact directly. They produce the *input to human writing*, which is published through the blog by a person. This is the same rule as "AI may draft, AI may not publish," extended to the thinking layer, and it is what stops the system from becoming a content generator.

### A. Research Radar

Recent work in known areas. Verified and Radar tiers visibly separated. Hard cap on item count. Output is Discover feed items under the existing item contract.

### B. Research Map / Reading Path

Topic in, explained ordered path out. Rare updates, small output, evidence-backed placements, explicit partiality when evidence is thin.

### D. AI Reader

Progressive reading over one paper. Defined in [AI-Assisted Reading](#ai-assisted-reading).

### E. Research Notebook

Typed human notes against papers, ideas, and experiments. Defined in [Research Notebook](#research-notebook). **DECISION:** this is the system's durable asset. Everything else can be recomputed from sources; notes cannot.

### F. Idea / Experiment Workspace

Ideas, hypotheses, prior-art checks, experiment designs, and results. Defined in [Hypothesis Generation](#hypothesis-generation) through [Experiment Tracking And Idea Revision](#experiment-tracking-and-idea-revision).

### C. Reading Queue — Conflict, And Resolution

**FACT:** the brief describes per-user state — Saved, Reading, Read, Review Candidate, Reviewed. **FACT:** `product-boundaries.md` prohibits saved resources on a server, user accounts, and any content visible only to some readers, under the test that *the site must not be able to tell two readers apart*.

**DECISION: the Reading Queue is private tooling in the pipeline repository, not a public site feature.** Full state machine, full history, single user, never served.

**DECISION:** what *may* become public is a **reading log** — a curated, human-authored, static list of what was read and what came of it. That is content, not user state. It is identical for every reader and requires no carve-out.

Making the queue a public feature would require authentication, which needs the separate product decision `product-boundaries.md` already specifies. **DECISION:** that decision is not made here, and nothing in this design should be built in a way that assumes it will later be made.

**DECISION:** UI design is deliberately out of scope. The information model and state transitions are the durable artifact; the interface is not.

---

## Blog Integration

**FACT, unchanged:** `Research World → collection → filtering/ranking → Discover → selection → Reading Queue → human reading → notes → human-written review`.

**DECISION:** AI summaries never become blog posts. The blog is the human layer — interpretation, critique, comparison, reproduction, judgment. This is the site's actual editorial asset, and automating it would destroy the thing the automation exists to serve.

### The Thinking Layer Changes What Feeds The Blog

The original loop ended at *human reading → notes → written review*. With the thinking layer, the blog draws from richer inputs, all of them human-authored or human-confirmed:

| Source | Post it tends to produce |
|---|---|
| Notebook notes on one paper | A paper review with actual disagreement in it |
| A confirmed idea transition | A "how this line of work evolved" post |
| Cross-paper synthesis, acted on | A comparison or survey-style post |
| A prior-art check | A "what has already been tried" post |
| An experiment, including a failed one | A reproduction or negative-result post |

**DECISION:** every one of these is drafted by the user, not generated. What the system supplies is the *material and its provenance* — the notes, the confirmed claims, the locations, the results — so that writing does not begin with re-finding what was already read.

**DECISION:** a post derived from the thinking layer should cite the evidence the layer recorded: which paper, which section, which experiment. **FACT:** [`discover-direction.md`](./discover-direction.md) already names Discover-item-to-post links as the visible evidence of the loop. This extends the same standard to the research layer, and it is also what makes negative-result posts defensible.

**DECISION:** quotations from sources stay private per [Source Grounding](#source-grounding). A published post cites locations and paraphrases; it does not reproduce passages.

### Technical Boundary

**FACT:** the site is static-first, and per [`creative-direction.md`](./creative-direction.md) the core reading experience must not depend on client-side JavaScript.

**DECISION:** the pipeline runs entirely outside the public repository and emits **static artifacts** — JSON, Markdown, or generated pages consumed at build time. No runtime API. No database dependency in the public repo. The public repository's guardrails stay exactly as strict as they are today, and `scripts/validate-product-boundaries.mjs` keeps passing without modification.

**DECISION:** a rendered reading path is a static page. Any graph visualization of it is subject to the interactive-module rules in `creative-direction.md` — scoped, lazily loaded, budgeted, and shipping an authored static fallback. A reading path that is only legible as an interactive graph fails that document's degradation test and must be authored as an ordered list first.

---

## Evaluation / Gold Sets

**DECISION:** the system is evaluated against human-curated reading lists, treated as **expert evidence rather than ground truth**. An expert list reflects one expert's emphasis and its own moment; a paper absent from it is not thereby unimportant.

### Gold Set 1 — Information Visualization

Papers named in the brief: CNNVis (2016), DeepEyes (2017), AttentionViz (2023), ConceptViz (2025), LayerFlow (2025), Embedding Atlas (2025), plus further VIS + X / VIS + Human papers. **VERIFY:** venue, year, and identifier for each, from an authoritative source, before use.

This set is well chosen for a reason worth stating: it spans 2016–2025, which means a system that only surfaces recent work fails it visibly. It is also narrow enough that a Foundation stage is checkable by hand.

### Metrics

Quantitative: Recall@K (did the corpus contain them), Precision@K, NDCG with graded relevance. Reported **per gold set**, never averaged across fields.

**DECISION:** Recall@K is the primary early metric, and it measures ingestion and annotation rather than ranking. A gold paper that is not in the corpus is a collection failure that no ranking improvement can fix, and confusing the two wastes the most time.

Qualitative, for reading paths, where rank metrics do not apply:

- Is the Foundation stage genuinely foundational *for this topic*, not globally famous?
- Does the order respect dependency?
- Does each explanation cite evidence a reader could check?
- Are Bridge papers real bridges?
- Are the gaps honest?

**DECISION:** qualitative evaluation is a written rubric scored by hand on a fixed set of topics, re-scored after each change. It is slow, and it is the only thing that measures the actual product.

### Evaluating The Understanding And Idea Layers

Ranking metrics do not apply here. Each layer has its own measure, defined with the layer:

| Layer | Primary measure |
|---|---|
| AI Reader | Grounding audit — `supported` / `overstated` / `unsupported` / `location wrong` |
| Reader, secondary | Source-open rate; hedge preservation |
| Paper Analysis | Correct prior-approach identification on papers with known lineage |
| Idea Graph | Re-review of confirmed edges after three months; not size |
| Synthesis | Whether output is acted on |
| Notebook | Notes per paper; proportion that become questions or posts |
| Active Recall | Answerable without re-reading the summary |
| Prior-Art | Planted-hypothesis retrieval, the idea-level analogue of a gold set |
| Experiment | Proportion with recorded outcomes; proportion of failures interpreted |

**DECISION:** the grounding audit and planted-hypothesis retrieval are the two that block reliance. The rest are health signals. **DECISION:** all of them are scored by hand at low volume — there is one user, and inventing automated proxies for a sample of twenty would cost more than reading twenty.

**OPEN:** the single hardest evaluation question in the document — how to tell whether the system improved the user's *understanding*, as distinct from their reading speed. Active recall is the best available proxy and it is a weak one. No better method is proposed here, and the honest position is that this may only be answerable retrospectively, by whether the research and writing got better.

### Second Gold Set

**DECISION:** a second gold set from a different field is required before any ranking weights are generalized. One gold set produces a system tuned to one field's signal profile while appearing to be general. **OPEN:** which field, constrained by what is accessible — see [External Dependencies](#external-dependencies-requiring-verification).

**DECISION — a new criterion for choosing it.** The second gold set should come from a venue family that **publishes peer reviews**, so that [Paper Analysis](#paper-analysis) can be validated against expert-identified weaknesses rather than only against author-disclosed limitations. **VERIFY:** OpenReview-based venues appear to satisfy this; IEEE VIS does not. This makes the second gold set do double duty — testing cross-field generalization *and* unlocking the strongest weakness-evidence source — and it partly answers the open question above.

---

## MVP Scope

**DECISION:** the MVP is *one topic, one gold set, one mode*: an Information Visualization reading path, evaluated against Gold Set 1.

In scope: a registry with a small number of venues; ingestion for those venues; the Paper model with provenance; verified citation edges; topic annotation sufficient for one topic; role assignment; evidence-derived explanations; gold-set evaluation.

Out of scope: Radar, multi-field ranking, field-specific signals, author disambiguation, the public surface, claimed-relation extraction, and every venue not needed for Gold Set 1.

**Amended by the thinking layer.** Two components move *into* the MVP, and one moves further out.

**In, and earlier than the discovery work:** the [Research Notebook](#research-notebook) and the Reading Queue. Both are private, both need no pipeline, both are single-user CRUD over records the user creates by hand, and together they are the stopping test for the entire second half of this document. **DECISION:** they are built first, in parallel with Phase 0, using manually entered paper records. If twenty papers do not accumulate notes, everything downstream of the notebook is cancelled rather than deferred.

**In, once a corpus exists:** AI Reader Levels 1 and 2 over the Gold Set 1 papers, with the grounding audit. These are the papers the user will actually read during MVP evaluation, so the reader is exercised on real work rather than a demo set.

**Further out:** the Idea Graph, synthesis, hypothesis, prior-art, and experiment layers. All of them consume notes. None should be designed before real notes exist to design against.

### The Phase 1 Venue Conflict

The brief proposes starting with IEEE VIS, CHI, ICLR, and NeurIPS. **Two problems.**

**First — scale.** **ASSUMPTION:** NeurIPS and ICLR are in the low thousands of papers per year each; a decade of four venues is plausibly tens of thousands of papers. That corpus tests ingestion throughput, which is not in doubt, while the thing actually in doubt — whether role assignment reproduces expert judgment — is testable on a far smaller corpus.

**Second — the gold set does not need them.** Gold Set 1 is Information Visualization. Its papers are, per the brief's own description, VIS-family work. NeurIPS and ICLR contribute almost nothing to evaluating an InfoVis reading path, but they contribute most of the corpus, most of the ingestion effort, and most of the access risk.

**DECISION: Phase 1 ingests IEEE VIS plus the citation closure of Gold Set 1**, to a bounded depth. **ASSUMPTION:** low thousands of papers — large enough for real graph structure, small enough to inspect by hand. Hand-inspectability is the property that matters at this stage, because the first version of role assignment will be wrong in ways only manual reading reveals.

**Third, and most serious — access.** **VERIFY:** IEEE VIS and CHI are published through IEEE and ACM respectively, whose bulk access and redistribution terms are likely the most restrictive of the venues named, while ICLR, NeurIPS, and the ACL Anthology are likely the most open. If that holds, the brief's Phase 1 pairs the most valuable gold set with the least accessible source. **DECISION:** access verification for IEEE VIS is the **first task in Phase 0**, ahead of all modeling work, because a negative answer changes the choice of gold set and therefore the entire phase plan.

---

## Phased Implementation Plan

No phase is approved. Each needs its own decision. No phase starts before the previous one's exit condition is met.

**DECISION: two tracks, not one sequence.** The discovery track builds infrastructure; the reading track builds the thing the infrastructure is for. They are largely independent and meet at two points only.

```
Track A (Discovery)   A0 ── A1 ── A2 ── A3 ── A4 ── A5 ── A6 ── A7
                             │     │
                             ▼     ▼
Track B (Reading)     B1 ── B2 ── B3 ── B4 ── B5 ── B6 ── B7
```

Two dependencies, and only two: **B2 needs A1** (a corpus with full text), and **B6 needs A2** (retrieval over the graph, for prior-art checking). Everything else runs in parallel.

**DECISION — B1 starts immediately, in parallel with A0.** It depends on nothing in Track A. It is the cheapest component in the document and the validation gate for half of it, and running it during the months of access verification costs nothing while answering the most important open question: whether the user will actually keep notes.

### Track A — Discovery

#### A0 — Design And Verification

Resolve every **VERIFY** in this document: access, licensing, rate limits, and redistribution rights for IEEE VIS and every enrichment source. Confirm the Gold Set 1 papers and their identifiers. Author the registry schema and the first entries. Fix the provenance rules and the model definitions. Write the evaluation rubric **before** anything can be evaluated by it.

*Exit:* IEEE VIS access answered definitively; Gold Set 1 verified with identifiers; registry schema authored; evaluation rubric written and scored once by hand against the gold set, to check the rubric itself is usable.

**DECISION:** if IEEE VIS access fails verification, stop and re-choose the gold set. Do not proceed with a plan whose foundation is a blocked source.

#### A1 — Corpus And Provenance

Ingest IEEE VIS plus the gold set's citation closure. Populate the Paper model with full per-field provenance. Measure Recall@K for Gold Set 1.

*Exit:* every Gold Set 1 paper is in the corpus with verified provenance; Recall@K is measured and reported; citation coverage for the subgraph is measured and stated as a number, not an impression.

#### A2 — Annotation And Graph

Research annotation dimensions; verified citation edges; subgraph extraction for one topic; temporal stratification; coverage measurement.

*Exit:* the topic subgraph is extractable and hand-inspectable; coverage is reported per region; cycles are detected and logged rather than silently broken.

#### A3 — Reading Path

Role assignment from graph evidence. Evidence-derived explanations. Refusal and partial-path behavior. Score against the rubric.

*Exit:* a path is generated for the gold-set topic and scored; the Foundation stage is topic-scoped rather than globally famous; every placement cites checkable evidence; at least one deliberately under-evidenced topic correctly produces a refusal or a labeled partial path.

#### A4 — Ranking

Interpretable feature model. Weights fitted against gold sets. Error taxonomy instrumented so every failure is classifiable.

*Exit:* Precision@K and NDCG reported per gold set; every error in a sample is classifiable into exactly one taxonomy category; weights are reproducible from a documented procedure rather than hand-tuned.

**DECISION:** A4 does not complete on one gold set. A second field's gold set is required.

#### A5 — Venue Expansion

Only now. Expand the registry and adapters toward broader coverage, driven by the second gold set's needs rather than by list completeness.

*Exit:* a new venue is added with a registry entry plus one adapter and no changes to ranking, path, or schema code. That is the test from [Venue Registry](#venue-registry), executed.

#### A6 — Research Radar

arXiv and OpenReview as an explicitly separated Radar layer. Provenance visible everywhere. Hard item cap.

*Exit:* Radar output flows into the Discover item contract; Verified and Radar are never displayed indistinguishably; a week of output stays under the cap without manual pruning.

#### A7 — Blog Integration

Static artifact generation. Reading-path pages. Connection to the human review workflow.

*Exit:* `npm run build` passes with generated artifacts; `product:validate` passes unmodified; the reading-path page is fully legible with JavaScript disabled.

### Track B — Reading And Thinking

#### B1 — Research Notebook And Reading Queue

Typed notes and queue states over manually entered paper records. No AI, no pipeline, no full text.

*Exit:* twenty papers carry structured notes accumulated through actual reading — not backfilled in one sitting, which would prove nothing.

**DECISION:** this exit is a **go/no-go for B4 onward.** If it is not met within a reasonable period, the Idea Graph, synthesis, hypothesis, and experiment layers are cancelled and this document is revised to a discovery-only system. That is a legitimate outcome, and finding it out here costs weeks rather than a year.

#### B2 — AI Reader, Levels 1–2 *(requires A1)*

Triage cards and guided understanding over the Phase A1 corpus. Korean prose with English terminology. Four content classes enforced in storage.

*Exit:* a grounding audit over a sample of claims is run and scored; zero `location wrong` and zero `unsupported` in the sample; the `overstated` rate is recorded as the baseline for future comparison; hedge preservation checked on a subsample.

#### B3 — Level 3 Grounding

Question-to-location navigation. Structural parsing sufficient to resolve sections, figures, tables, and pages.

*Exit:* location accuracy measured on a labeled sample; the reader opens sources from within the workflow in one action; source-open rate instrumented and baselined.

#### B4 — Paper Analysis And Idea Graph *(requires B1 exit)*

Idea-transition records. Weakness extraction from author limitations and from criticism in citing papers. Human-confirmed Idea Graph nodes and edges, with a separate proposal holding area.

*Exit:* idea transitions produced for the gold-set papers and checked against known lineage; confirmed nodes exist for at least ten papers; a three-month re-review of a sample of confirmed edges is scheduled and the first one held.

#### B5 — Synthesis And Pattern Surfacing

Comparison matrices and recurring-pattern detection over confirmed elements only.

*Exit:* gated on roughly fifty notes existing; at least one surfaced pattern is acted on — becoming a question, a hypothesis, or a post. **DECISION:** if nothing is acted on, cut the feature rather than tune it.

#### B6 — Hypothesis And Prior-Art Verification *(requires A2)*

Hypothesis records with mandatory refutation conditions. Prior-art checks with recorded scope and the five outcomes.

*Exit:* planted-hypothesis retrieval passes — hypotheses whose prior art is known to be in the corpus are found; at least one real candidate is correctly classified as already explored; scope recording is complete enough that a check is interpretable a month later.

#### B7 — Experiment Design And Tracking

Design structure with mandatory failure conditions and alternative explanations. Immutable outcome records with the five statuses and linked revisions.

*Exit:* one experiment designed, run, recorded, and interpreted — **including the case where it does not succeed**, which is the outcome the layer exists for.

---

## Risks And Failure Modes

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Access denied for IEEE VIS or CHI** | Kills the chosen gold set | Verify first in Phase 0; re-choose the gold set rather than proceed |
| **Citation coverage too sparse** | Every graph-derived role becomes unreliable | Measure coverage before computing roles; refuse below threshold |
| **Foundation fills with globally famous papers** | The most likely path failure; output looks plausible and teaches nothing | Subgraph-scoped in-degree; checked explicitly in the rubric |
| **Candidate edges promoted to verified** | Fabricated lineage that a learner cannot detect | Separate storage classes; quotation requirement; never under deadline discretion |
| **Preprint/published duplicates** | Splits citation evidence, corrupting every downstream signal | One entity per work; explicit identity linking with confidence |
| **Silent overfitting to one gold set** | A field-specific system that appears general | Second gold set required before generalizing weights |
| **Unavailable read as zero** | Systematically penalizes venues with less metadata | Three-state availability; `signalAvailability` in the registry |
| **Scope collapse into "an arXiv feed with summaries"** | The exact product this exists to not be | Reading paths are the differentiator; if they fail, stop rather than ship the easy part |
| **Review capacity exhausted** | **FACT:** `discover-direction.md` already identifies review as the bottleneck | Hard item caps; reduction as the optimization target |
| **The project becomes the product** | A year of pipeline building with no reading done and no posts written | Phase exits are evaluation results, not built components |
| **Wrong source locations** | Spends trust and time at once; invisible unless audited | Grounding audit; `location wrong` is release-blocking |
| **Confidence inflation** | A hedged finding becomes a belief the user acts on | Verbatim hedging; hedge-density comparison |
| **The reader becomes a replacement** | The stated guardrail fails silently while everything looks fine | Source-open rate monitored as a design signal, not a usage stat |
| **Idea Graph batch-generated** | A large, plausible, unfalsifiable object — the worst outcome available here | Human confirmation required; confirmation requires selecting evidence |
| **Notebook never starts** | Every layer downstream of it has no input | B1 is the go/no-go gate, run before anything expensive |
| **Write-only notebook** | Notes captured, never revisited, no value returned | Pattern surfacing and synthesis are the payoff; both gated on real volume |
| **False "no prior work found"** | An unfounded novelty belief, acted on for months | Outcome D is scope-qualified permanently; narrow scope downgrades D to E |
| **Motivated experiment design** | Confirms what was wanted; the assistant's natural failure is agreeableness | Mandatory refutation conditions; adversarial design posture |
| **Failures stop being recorded** | The research history becomes false in the direction that flatters | Immutable outcomes; open experiments stay visible indefinitely |

**The most likely failure is still the project becoming the product.** This system is more interesting to build than to use, and its value is realized only in reading and writing that happen outside it. **DECISION:** if two consecutive phases pass without a blog post that cites the system as its source, that is a signal to stop and reconsider, not to build the next phase.

**The second most likely failure is now B1 never starting.** The notebook is unglamorous, requires discipline rather than engineering, and gates half the document. **DECISION:** it is scheduled first precisely because it is the part most likely to be postponed indefinitely in favor of more interesting work.

---

## External Dependencies Requiring Verification

Nothing here is confirmed. Every row must be checked and this table updated with a date and an answer before any implementation relies on it.

| Dependency | What must be verified |
|---|---|
| IEEE Xplore / IEEE VIS | Metadata access, bulk terms, redistribution rights, abstract licensing |
| ACM DL / CHI, UIST, CSCW | Same |
| OpenReview | API availability, rate limits, coverage per venue and year, terms |
| ACL Anthology | Bulk metadata availability and license |
| NeurIPS proceedings | Structured metadata availability |
| OpenAlex | API terms, rate limits, citation coverage and completeness |
| Semantic Scholar | API access, quotas, license |
| Crossref | Terms and coverage |
| arXiv | API terms and rate limits |
| GitHub | API quotas for code-link enrichment |
| Papers With Code or equivalent | Current availability and license |
| DBLP | Availability and license for identifier reconciliation |

**DECISION:** redistribution is verified separately from access. Permission to *fetch* is not permission to *republish*, and the public site republishes. **FACT:** `product-boundaries.md` already requires raw paper text and abstracts to stay private, which limits exposure but does not remove the obligation to check.

---

## Amendments Required To Existing Records

Recorded, not applied. Each needs its own decision.

**[`discover-direction.md`](./discover-direction.md)**
- Note that the `paper` content type may be produced by this pipeline, with the item contract unchanged.
- Record that this document supplies the research substrate and does not alter Discover's taxonomy, language policy, or review gate.
- The open question about `positiveKeywords` / `negativeKeywords` as classifier hints is answered here in the affirmative for this pipeline's first-pass filter.

**[`product-boundaries.md`](./product-boundaries.md)**
- No carve-out is requested. The Reading Queue is resolved as private tooling specifically so that none is needed.
- Optionally record that a published reading log is content rather than user state, to prevent that question being reopened later.

**[`creative-direction.md`](./creative-direction.md)**
- A reading-path graph visualization is an interactive module under its rules and must ship an authored static fallback. Consistent as written; worth noting as a concrete instance, since it is the first real one.

**`CLAUDE.md`** — docs index updated in the same change as this document.

---

## Open Questions

- Which second gold set, and from which field? Constrained by access verification.
- What citation-coverage threshold justifies emitting a path at all?
- Are medium-confidence preprint/published links auto-accepted in Radar but not in reading paths?
- Do `target` and `problem` survive as taxonomy dimensions outside AI-adjacent fields?
- What accuracy threshold must a new relation type clear before entering the vocabulary? Set it before the first expansion is attempted.
- How is a reading path versioned when the corpus grows? A path is a claim about a field at a moment; silently changing it is dishonest, and freezing it makes it stale.
- Does a Radar item ever get promoted to Verified automatically when acceptance is confirmed, or does promotion require review?
- Is the research annotation → reader topic mapping authored by hand, or derived and reviewed?
- Should reading paths be public at all, or is the author the only real consumer? The brief assumes public; nothing verifies that anyone wants it.

### From The Reading And Thinking Layer

- What source-open rate is low enough to count as the reader having become a replacement, and what is the response?
- What `overstated` rate is acceptable in the grounding audit? Set it from the first audit, not in advance.
- Can Level 3 location resolution be made reliable enough to be worth building at all, given that a wrong location is worse than none? **VERIFY** against real parsed PDFs before committing to B3.
- Does criticism-mining from citing papers produce enough weakness evidence to be useful, or is the signal too sparse outside heavily-cited work?
- Is *abandoned* distinguishable from *unfinished* for an experiment, given that nobody selects a status admitting abandonment?
- How is a confirmed Idea Graph edge retired when the user changes their mind? Deleting loses the history; keeping it pollutes queries.
- Should active recall questions be generated from the paper, from the user's own notes, or both? Notes-derived questions are more personal and risk being circular.
- Who, if anyone, besides the author is a user of the thinking layer? The design currently assumes nobody, which is a defensible choice and an unexamined one.

---

## Explicit Non-Goals

The initial system does not attempt to:

- Index every academic paper.
- Replace Google Scholar or Semantic Scholar.
- Replace expert researchers or expert curation.
- Determine scientific truth or correctness.
- Generate blog posts without human review.
- Summarize every paper.
- Produce a universal cross-field academic ranking.
- Build a social network, or any multi-user feature.
- Optimize for engagement, session length, or infinite scrolling.
- Serve content from a runtime database.
- Provide per-reader state on the public site.
- Replace reading the original paper.
- Assess whether a research idea is novel.
- Grade the user's understanding.
- Decide whether a paper's claims are true.
- Generate research contributions.
- Publish anything from the thinking layer without the user writing it.

**DECISION:** the last two are not merely out of scope. They are architectural commitments that `scripts/validate-product-boundaries.mjs` enforces today, and they must keep passing unmodified through every phase in this plan.
