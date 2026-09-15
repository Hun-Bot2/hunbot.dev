# Research Item Identity And Provenance

Status: Decided. No implementation started. Schema application is [T09](../plans/research-os-pre-aws/tasks/T09-paper-schema-migration.md).

Reviewed: 2026-09-14

This record defines the canonical identity and provenance model for a research item, and records the resolution of three contradictions between approved records (C1, C2, C3 in [`readiness-audit.md`](../plans/research-os-pre-aws/readiness-audit.md)). The three were resolved by the repository owner on 2026-09-14; they are recorded here as decided, not re-argued.

It **supersedes** the `papers` schema at `src/content.config.ts:139-175` on the specific points named in [What This Record Supersedes](#what-this-record-supersedes). It **does not amend** [`research-discovery-system.md`](./research-discovery-system.md) or [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md); it makes their identity and provenance decisions concrete enough to implement.

**Honest-history note.** No existing decision record was edited to produce this one. Where an earlier record says something this record changes, the earlier text stands and the change is named here with its reason. The distinctions in this record did not always exist — `src/content.config.ts` predates [`research-discovery-system.md`](./research-discovery-system.md), and the conflation it contains was a reasonable shape for a Library card before a Research OS was contemplated.

Marker convention is inherited from [`research-discovery-system.md`](./research-discovery-system.md#marker-convention): **FACT** / **ASSUMPTION** / **DECISION** / **VERIFY** / **OPEN**.

---

## Document Map

| Section | Answers |
|---|---|
| [Where The Canonical Item Lives](#c3--where-the-canonical-research-item-lives) | C3. Read this before anything else |
| [Canonical Item Identity](#canonical-item-identity) | What an item ID is, and what happens when a DOI is absent, arrives late, or two records turn out to be one work |
| [External Identifier Map](#external-identifier-map) | Replacing fixed ID columns with data |
| [Status History And Provenance Tier](#status-history-and-provenance-tier) | How one entity carries a preprint→published lifecycle |
| [Same-Work Claims](#same-work-claims-and-their-confidence-vocabulary) | The `sameWorkAs` confidence vocabulary |
| [C1 — totalScore](#c1--signalstotalscore-removed) | Recorded as resolved |
| [C2 — decision split](#c2--papersdecision-split-into-acceptancestatus-and-honors) | Recorded as resolved, with corpus evidence |
| [Field Tables](#field-tables) | **The deliverable T09 implements** |
| [Migration Notes For T09](#migration-notes-for-t09) | Exact old→new mapping and cost |
| [Open Questions](#open-questions) | What is genuinely unresolved |

---

## What This Record Supersedes

Each row names a current implementation fact and what replaces it. Nothing below is deleted from the records that decided it; the decision to change is recorded here.

| Superseded | Evidence of current state | Replaced by |
|---|---|---|
| `papers.decision` as one enum | `src/content.config.ts:147` | [`acceptanceStatus`, `honors`, `presentationFormat`, `provenance`](#c2--papersdecision-split-into-acceptancestatus-and-honors) |
| `signals.totalScore` (0–20 composite) | `src/content.config.ts:166` | [Removed](#c1--signalstotalscore-removed). No replacement field |
| `signals.topicScore` / `sourceScore` / `usefulnessScore` / `freshnessScore` | `src/content.config.ts:162-165` | [Removed from the public projection](#c1--signalstotalscore-removed); ranking inputs live private |
| `source.openReviewId` / `semanticScholarId` / `arxivId` as fixed columns | `src/content.config.ts:170-172` | [`source.externalIds`](#external-identifier-map) |
| `papers.id` as the only identity | `src/content.config.ts:139` | `id` retained as the **projection** identifier; [`itemId`](#canonical-item-identity) added as the **work** identifier |
| Prose in [`library-data-model.md`](../features/library-data-model.md) listing the eight `decision` values | `docs/features/library-data-model.md:82` | Superseded in substance by [C2](#c2--papersdecision-split-into-acceptancestatus-and-honors). **That document is not edited by T01.** T09 updates it in the same change as the schema |

---

## C3 — Where The Canonical Research Item Lives

**Resolved by the repository owner, 2026-09-14.** Recorded here as decided.

> **DECISION: the private Research OS owns the canonical Research Item. `src/content/papers/` is a reviewed public projection of that item. It is never the canonical record.**

Read the following as normative, and read it before adding any field anywhere.

1. **Flow is one-directional.** Canonical item (private) → human review → public projection (`src/content/papers/`). Never the reverse. A public projection record is regenerable; the canonical item is not.
2. **A projection record may be deleted and rebuilt without data loss.** If that is not true of a field, the field is in the wrong place.
3. **No field may be added to `src/content/papers/` because the private system needs somewhere to put it.** The public collections are not a candidate store — [`library-data-model.md`](../features/library-data-model.md):21 — and that rule is machine-enforced by `scripts/validate-library.mjs`.
4. **The projection must remain compatible with static-first Astro.** It carries no processing state, no personal state, no queue state, no infrastructure concern.
5. **`itemId` is the only join between the two sides.** It is a shared key, not a shared record.

**If you are about to do any of the following, you have misread this section:**

- Writing reading state, saved/unsaved, queue position, note counts, TTL, or refresh cursors into `src/content/papers/`.
- Treating the Astro `papers` collection as the item model when designing a DynamoDB table.
- Adding a field to the public schema "so the pipeline has somewhere to write it".
- Deriving a DynamoDB partition key from `papers.id` rather than from `itemId`.
- Concluding that because a field is absent from `src/content/papers/`, the Research OS does not track it. Most canonical fields are deliberately absent.

**FACT:** this is consistent with, and does not change, the two-store resolution already recorded at [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution):266-278 — corpus local and relational, personal state in DynamoDB. This record adds the third location the cloud ADR did not name: the **public projection** in this repository, which is downstream of both.

| | Canonical Research Item | Personal state | Public projection |
|---|---|---|---|
| Owner | Private pipeline repo | AWS DynamoDB | This repository |
| Contents | Bibliographic, enrichment, derived, AI-interpretation, operational | Notes, reading state, saved items, queue | Reviewed card metadata + original summaries |
| Keyed on | `itemId` | `itemId` | `id`, carrying `itemId` |
| Regenerable | No | **No — notes are the one unrecomputable asset** ([`research-discovery-system.md`](./research-discovery-system.md#research-notebook):743) | Yes |
| Deletable | No | No | Yes |

---

## Canonical Item Identity

### The Requirement

**FACT:** the item ID becomes a DynamoDB partition key and the anchor for every note, reading-state record, and saved item. **FACT:** notes are the only content in the system that cannot be recomputed ([`research-discovery-system.md`](./research-discovery-system.md#research-notebook):743). An identity that changes after persistence orphans them.

**FACT:** the same work commonly exists as an arXiv preprint, a submission, and a published paper, with different identifiers and often a different title ([`research-discovery-system.md`](./research-discovery-system.md#preprint-to-published-identity):260). **Most items therefore arrive before their DOI exists.**

### Alternatives Rejected

| Scheme | Why rejected |
|---|---|
| Derived from DOI | Most items arrive as preprints with no DOI. Minting on DOI arrival means the item has no identity until it is published, or changes identity when it is — the exact orphaning failure this design exists to prevent |
| Content-addressed (hash of title + authors) | Camera-ready titles differ from preprint titles. The hash would change at precisely the lifecycle event that must be non-disruptive. A content hash is still required, for a different job — see [Content Hash](#content-hash) |
| Human-written slug (today's `papers.id`) | `src/content.config.ts:139`. Not mintable by a pipeline, not collision-safe at volume, and carries meaning that can become wrong |
| Derived from canonical URL | The canonical URL changes on publication. Same failure as DOI-derived |

Every rejected scheme fails on the same axis: it derives identity from metadata that legitimately changes.

### The Decision

> **DECISION: the canonical item ID is opaque, minted once, and never derived from any mutable metadata. It has no meaning beyond identity.**

- **Form:** `itm-` + a lowercase Crockford-base32 ULID. 30 characters, fixed length.
- **Pattern:** `^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$`
- **FACT:** this passes the existing `slugSafeString` regex at `src/content.config.ts:4-6` (`^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$`) — lowercase, hyphen-safe, 30 of 80 permitted characters. It is therefore usable unchanged as an Astro content ID, a URL segment, a DynamoDB key, and a filename.
- **Underscores are excluded deliberately** — `itm_…` would fail that regex and force a divergence between the private and public spellings of the same key.
- **Why ULID rather than UUIDv4:** lexicographic order equals mint order, which gives DynamoDB a natural sort key and gives merge resolution a deterministic tie-break with no extra field.
- **Why a prefix:** an item ID is distinguishable at a glance from a topic ID, a venue ID, or a slug, and is greppable. Four characters is a cheap price for catching a wrong-key bug by eye.

**DECISION: minting is a conditional write.** `attribute_not_exists(pk)` on insert. A ULID collision is vanishingly unlikely; a *duplicate mint caused by a retry or a concurrent ingest* is not. A failed conditional write re-mints and retries. **An item ID is never overwritten, and a write that would overwrite one is a defect, not a race to be smoothed over.**

**DECISION: identity is append-only.** An item may gain IDs — aliases, merged predecessors, new external identifiers — and may never have one changed or removed. This restates `shared-context.md` §5 as a property of this scheme rather than a rule imposed on it.

### Resolution: How An Incoming Record Finds Its Item

Identity is resolved through an **identifier index**, not by searching item records. The index is a lookup from `(scheme, normalized value)` → `itemId`, and it is the same structure that makes deduplication deterministic (audit B3; implemented by [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md)).

1. Normalize every external identifier on the incoming record.
2. Look each one up in the index.
3. **One `itemId` matches** → this is that item. Attach any new identifiers to it and register them in the index.
4. **No match** → mint a new `itemId`, write the record, register every identifier.
5. **Two or more distinct `itemId`s match** → the two items are the same work. Run the [merge](#when-two-records-turn-out-to-be-one-work).

**DECISION:** only identifiers designated *strong* in the scheme registry participate in resolution. A canonicalized URL is an index entry but is **not** strong — a landing page can be shared by an abstract page and its PDF, and two works can share a project page.

### The Three Cases The Scheme Must Survive

#### DOI absent

**Nothing happens.** `itemId` is minted from the item's existence, not from any identifier it carries. An item with only an arXiv ID — or with no external identifier at all, only a canonical URL — is a complete, fully-keyed item. Notes may be attached to it immediately.

**DECISION: DOI is a supported scheme, never a required field.** Requiring a DOI would make preprints unrepresentable, and preprints are the majority of Radar intake.

> **Note on audit row D10.** The row reads "External IDs as a map; DOI **required**." The ADR it cites says only *"external IDs as a map (DOI, arXiv, OpenReview, DBLP, OpenAlex, Semantic Scholar, ACM DL, IEEE) — a map, not fixed columns"* ([`research-discovery-system.md`](./research-discovery-system.md#paper):274). The map is required; a DOI is not. The audit row overstates its source. The rest of D10 is correct: `src/content.config.ts:170-172` does hold fixed columns and there is no DOI field at all.

#### DOI arrives later

The common case, and the one most likely to be got wrong.

1. The DOI is appended to `source.externalIds` with its scheme, source, and fetch time.
2. The DOI is registered in the identifier index pointing at the **existing** `itemId`.
3. A `statusHistory` entry is appended recording the new state and where the claim came from.
4. `provenance` may be promoted from `RADAR` to `VERIFIED`; TTL, if any, is cleared.
5. **`itemId` does not change. Nothing anchored to it moves.**

**DECISION: promotion from `RADAR` to `VERIFIED` clears TTL before anything else in the transaction.** TTL is destructive and [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#data-and-storage-strategy):262 applies it to Radar candidates. A promotion that updates the tier but leaves TTL armed deletes a now-verified item on a timer, silently. Order matters here and is specified for that reason.

**DECISION: an item that has ever been saved, noted, or referenced by a note is permanently TTL-exempt**, regardless of provenance tier. Personal state outranks disposal. This is `ttlExempt`, set once and never cleared.

#### When two records turn out to be one work

> **DECISION: merging never rewrites an ID and never deletes a record.**

Given items A and B found to be the same work:

1. **Survivor** = the item with the lexicographically smaller `itemId`. Because the ID is a ULID, that is the earlier-minted one. The rule is deterministic, needs no extra field, and produces the same answer from either direction.
2. The non-survivor sets `mergedInto: <survivorId>` and `lifecycle: "merged"`. Its record is **retained**, not deleted.
3. Every identifier-index entry pointing at the non-survivor is repointed at the survivor.
4. Every `itemId` ever minted resolves forever: directly, or by following `mergedInto`. Resolution follows at most one hop; chains are collapsed on write so a merged item never points at another merged item.
5. **Stored note anchors are not rewritten.** A note pointing at the merged ID resolves through the alias. Rewriting anchors in place is a bulk mutation of the one unrecomputable asset in the system, performed on the basis of a claim that may later be found wrong. It is not done.
6. Field-level content is merged under the [provenance rules](#status-history-and-provenance-tier) — authoritative fields are never overwritten by enrichment.

**This mirrors the topic `mergedInto` mechanism** required by [`discover-direction.md`](./discover-direction.md) and implemented by [T03](../plans/research-os-pre-aws/tasks/T03-taxonomy-lifecycle.md), deliberately: one lifecycle pattern for every identified entity in the system, so a reader who understands one understands both.

**Un-merge is possible because nothing was destroyed.** Clearing `mergedInto` and re-registering the index entries restores independent resolution. This is the whole reason for retaining the record. **DECISION:** un-merge is a reviewed human action, never automatic.

---

## External Identifier Map

**DECISION: a list of typed entries, not a map keyed by scheme.**

A map keyed by scheme cannot hold both a preprint DOI and a publisher DOI, and a work having both is common — arXiv mints DOIs, and the published version has its own. **VERIFY:** the exact prevalence and the reliability of Crossref's preprint↔published relation metadata; neither has been checked, and a wrong assumption here changes how often merges are authoritative rather than reviewed.

Each entry:

| Field | Type | Notes |
|---|---|---|
| `scheme` | slug-safe string | Cross-referenced against the scheme registry. Never a Zod enum |
| `value` | string | Normalized per the scheme's rule |
| `source` | slug-safe string | Where this identifier came from. Private contract only |
| `fetchedAt` | `YYYY-MM-DD` | Private contract only |

**DECISION: the scheme vocabulary is data, not code** — `shared-context.md` §4. It lives in a data file with, per scheme: normalization rule, whether it is *strong* for resolution, and a display label. Adding OpenAlex, DBLP, ACM DL, or IEEE is a data edit with no code change and no route regression.

Initial schemes, all named in [`research-discovery-system.md`](./research-discovery-system.md#paper):274 — `doi`, `arxiv`, `openreview`, `dblp`, `openalex`, `semanticscholar`, `acmdl`, `ieee`, plus `url` for the canonicalized landing URL.

**DECISION: normalization is part of the scheme definition, applied before storage and before index lookup.** An unnormalized identifier is a silent dedup failure. Examples: `doi` lowercased with any `https://doi.org/` prefix stripped; `arxiv` stored without its version suffix, with the version recorded separately. **The full normalization table is [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md)'s to write and test; this record fixes only that it exists, that it is per-scheme, and that it is applied on both write and lookup.**

**DECISION: bounded by construction** — at most 12 entries, unique on `(scheme, value)`. `shared-context.md` §8: a contract with an explicit cap beats an open-ended map, and 12 is comfortably above any real work's identifier count.

---

## Status History And Provenance Tier

One entity per *work* ([`research-discovery-system.md`](./research-discovery-system.md#preprint-to-published-identity):262) means the entity must carry a lifecycle rather than be replaced by it.

**DECISION: `statusHistory` is an append-only ordered list.** Entries are never edited or removed; a correction is a new entry that supersedes an earlier one, with its own source.

| Field | Type | Notes |
|---|---|---|
| `state` | slug-safe string | From the acceptance-status vocabulary. Registry data, not a Zod enum |
| `at` | `YYYY-MM-DD` or null | When the state became true. Null when genuinely unknown — never back-filled with an observation date |
| `observedAt` | `YYYY-MM-DD` | When the system learned it |
| `venueId` | slug-safe string or null | Venue registry ID ([T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md)) |
| `source` | slug-safe string | Which source made the claim |
| `confidence` | slug-safe string | From the [confidence vocabulary](#same-work-claims-and-their-confidence-vocabulary) |

**DECISION: bounded at 24 entries.** Real lifecycles have two to four.

**DECISION: `acceptanceStatus` is a materialized derivation** — the latest entry by `at`, falling back to `observedAt`. It is stored because it is queried, and it is always recomputable from `statusHistory`, so a derivation bug is repairable rather than lossy. **It is not authoritative on its own.**

### Provenance Tier

**DECISION: `provenance` is stored, required, and two-valued: `VERIFIED` or `RADAR`.** This restates [`research-discovery-system.md`](./research-discovery-system.md#source-strategy):179 without change.

**DECISION: `provenance` is the second deliberate exception to the "taxonomies are data, not code" rule** in `shared-context.md` §4, alongside `depth`. The reason: it is not a taxonomy. It is a closed structural distinction with exactly two values, it drives destructive TTL behavior, and a third value appearing by data edit would silently change what gets deleted. It is a Zod enum, and that is intentional.

**DECISION: `VERIFIED` is not assignable by assertion.** It requires a `statusHistory` entry with an accepted or published state, at a registry venue, from a source the venue registry designates authoritative. Everything else is `RADAR` — including "probably accepted, not yet confirmed". **This is validator-checkable and should be validated**, because `VERIFIED` is what exempts an item from a destructive TTL.

**DECISION: provenance is not derived silently from honors or venue strings.** The current schema cannot express "accepted **and** oral" at all (`src/content.config.ts:147`); the fix is not to infer one from the other but to store them independently.

### Per-Field Source And Fetch Time

[`research-discovery-system.md`](./research-discovery-system.md#the-rules):253 requires source and fetch time **per field**, not per record, and requires that enrichment never overwrite authority.

**DECISION: `fieldSources` is a map from field path → `{ source, fetchedAt }`, and it lives in the private canonical item only.** It never appears in the public projection and never appears in DynamoDB. Rationale: it is the largest-growing part of the record, and `shared-context.md` §8 makes record size a direct cost. The corpus is local and relational, where this shape is cheap ([`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution):268).

**DECISION: bounded by construction** — only fields listed as provenance-tracked in the data contract get entries. An arbitrary field path cannot create one. [T02](../plans/research-os-pre-aws/tasks/T02-corpus-personal-state-boundary.md) owns the tracked-field list.

**DECISION: a disagreement between an enrichment source and an authoritative one appends to `conflicts` and is surfaced for review.** It never resolves by last-writer-wins. This restates rule 3 at [`research-discovery-system.md`](./research-discovery-system.md#the-rules):255 as a field, not a convention.

---

## Same-Work Claims And Their Confidence Vocabulary

Two distinct mechanisms, and conflating them is the failure mode this section exists to prevent:

- **Merge** — two `itemId`s become one work. Destructive to *separateness*, so it is gated.
- **`sameWorkAs` claim** — two items stay separate and carry a recorded, reviewable link. Cheap, reversible, and the default for anything short of certainty.

**DECISION: the confidence vocabulary is ordinal, named by evidence, and small.** Named rather than numeric, deliberately: a 0.82 confidence invites a threshold nobody can justify, and this system has already decided against opaque composite scores ([C1](#c1--signalstotalscore-removed)).

| Value | Evidence | May merge? |
|---|---|---|
| `asserted` | A human stated the link | **Yes** |
| `authoritative` | An authoritative source states it — e.g. an OpenReview record carrying the arXiv ID, or a Crossref preprint relation (**VERIFY** both) | **Yes** |
| `identifier` | A shared strong normalized identifier, reported by an enrichment source | **Yes** |
| `strong-match` | Title, author set, and year agree | **No.** Creates a claim requiring review |
| `weak-match` | Partial agreement, typically title only | **No.** Recorded and surfaced; never acted on |
| `refuted` | Reviewed and rejected | **No.** Retained so the candidate is not re-proposed forever |

**DECISION: only `asserted`, `authoritative`, and `identifier` may cause a merge.** Everything else is a claim awaiting a human. This is [`research-discovery-system.md`](./research-discovery-system.md#preprint-to-published-identity):264 — "an evidence-backed claim with a confidence level, never an inference the system treats as settled" — made mechanical.

**DECISION: `refuted` is retained rather than deleted**, consistent with `shared-context.md` §4: nothing is ever deleted. A refuted claim that vanishes is re-proposed on the next ingest run, forever.

Each claim carries: `targetItemId`, `confidence`, `evidence` (what actually matched), `source`, `observedAt`, and `reviewedBy` / `reviewedAt` when a human has ruled.

**OPEN — carried forward unchanged from [`research-discovery-system.md`](./research-discovery-system.md#open-questions):1291.** Whether a `strong-match` claim may be *displayed* as a link in Radar while remaining unmerged. This record does not close someone else's open question; it only fixes that such a claim never merges.

---

## C1 — `signals.totalScore`: Removed

**Resolved by the repository owner, 2026-09-14.** Recorded as decided.

> **DECISION: `signals.totalScore` is removed. No single composite quality score is a source-of-truth field anywhere in the system.**

**What it conflicted with.** `src/content.config.ts:166` defines `totalScore` as a 0–20 composite. [`research-discovery-system.md`](./research-discovery-system.md#quality-signals):368 decides the opposite: *"no single numeric quality score… A paper carries a signal sheet."* **FACT:** the schema predates the ADR. This is not a bug that was missed; it is an earlier shape that a later decision superseded, and the record is kept honest by saying so rather than by rewriting either.

**What replaces it.** Nothing, at the projection layer. At the canonical layer, the **signal sheet**: named, independently sourced observations, each with a value, a provenance, and an availability state of `available` / `unavailable` / `not-applicable-for-this-venue` ([`research-discovery-system.md`](./research-discovery-system.md#universal-signals):374). **Unavailable is never zero** — which is precisely the property a nullable number folded into a sum cannot hold.

**What happens to the existing record.** **FACT:** `src/content/papers/sample-paper-card.md:41` has `"totalScore": null`. There is no value to preserve.

**Legacy carriage during migration: none, and none is needed.** **FACT, verified by grep across `src/`, `scripts/`, and `test/`:** the only occurrences of `totalScore` are the schema definition and that one null. Nothing computes it, reads it, or renders it. It can be removed outright, with no legacy-only transitional field.

**DECISION, extending C1's reasoning under C3 rather than re-arguing C1: `topicScore`, `sourceScore`, `usefulnessScore`, and `freshnessScore` (`src/content.config.ts:162-165`) also leave the public projection.** They are not observations — no measurement procedure for any of them exists anywhere in this repository — they are ranking inputs, which [C3](#c3--where-the-canonical-research-item-lives) places on the private side. **FACT:** all four are null in the only record and have zero readers in `src/`, `scripts/`, or `test/`. Removal costs nothing today.

This goes beyond C1's literal text, which named only `totalScore`. It is flagged in [Open Questions](#open-questions) as a deliberate, cheap, single-file reversal if the owner disagrees.

**What is kept.** `citationCount`, `influentialCitationCount`, `hasCode`, `hasProjectPage` — genuine observations rather than judgments. **DECISION:** `hasCode` and `hasProjectPage` become nullable with a `null` default. A boolean defaulting to `false` reports "we have not checked" as "there is no code", which is the same unavailable-treated-as-zero error at a smaller scale.

---

## C2 — `papers.decision`: Split Into `acceptanceStatus` And `honors`

**Resolved by the repository owner, 2026-09-14**, including the decision that the split applies to the **public schema as well as** the private contract. Recorded as decided.

### The Corpus Evidence, And How Thin It Is

**State this plainly: the corpus evidence is one record.**

**FACT** — `ls src/content/papers/` returns exactly one file, `sample-paper-card.md`, explicitly labelled *"Sample paper card entry for Library schema validation."*

**FACT** — `grep -rn 'decision' src/content/papers/` returns exactly one line:

```
src/content/papers/sample-paper-card.md:11:  "decision": "accepted",
```

**FACT** — the enum at `src/content.config.ts:147` permits eight values: `accepted`, `oral`, `spotlight`, `poster`, `preprint`, `workshop`, `rejected`, `unknown`. **Seven of the eight have never been used.** The same eight are restated as prose at `docs/features/library-data-model.md:82`.

So the evidence available is: **one observed value, and eight values a past author thought worth permitting.** That is the entire basis. Any value list here is derived from the enum's own vocabulary, not from usage — and a value list derived from a vocabulary nobody has exercised is a hypothesis, not a finding.

**DECISION, and the reason it matters more than the value lists themselves: the acceptance-status, honors, and presentation-format vocabularies are registry data, not Zod enums** (`shared-context.md` §4). Because the evidence is this thin, the lists **must** be extensible by data edit. Adding `withdrawn` or `best-paper` when the first real paper needs one is then a data-file change with no code change, no migration, and no route regression — rather than a schema change to a collection that by then holds persisted items.

The illustrative values in [`README.md`](../plans/research-os-pre-aws/README.md#blocking-questions--resolved-2026-09-14) — `withdrawn`, `pending`, `best-paper`, `notable-paper` — have **zero repository evidence** and are therefore **not** in the initial lists. The README says the lists there are illustrative, not authoritative. This record takes that literally.

### What The Legacy Enum Actually Conflates

Decomposing the eight values shows the conflation is worse than the two-way split C2 describes. It conflates **four** independent things.

| Legacy value | Acceptance status | Honor | Presentation format | Venue type | Provenance tier |
|---|---|---|---|---|---|
| `accepted` | accepted | — | — | — | depends on venue |
| `oral` | accepted | oral | oral | — | depends on venue |
| `spotlight` | accepted | spotlight | spotlight | — | depends on venue |
| `poster` | accepted | — | poster | — | depends on venue |
| `preprint` | preprint | — | — | — | `RADAR` |
| `workshop` | accepted | — | — | workshop | `RADAR` |
| `rejected` | rejected | — | — | — | `RADAR` |
| `unknown` | unknown | — | — | — | `RADAR` |

Two findings follow, both from the table rather than from assumption:

- **`poster` is a presentation format**, not an honor and not an acceptance status. A two-field split would lose it or misfile it.
- **`workshop` is a venue property.** It belongs in the venue registry's `type`, which [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md) owns. Mapping it correctly requires a venue registry entry to exist — a real cross-task dependency, flagged in [Migration Notes](#migration-notes-for-t09).

### The Derived Value Lists

Each value below traces to at least one legacy enum value. Nothing else is listed.

**`acceptanceStatus`** — the work's status at the referenced venue. Default `unknown`.

| Value | Derived from |
|---|---|
| `accepted` | legacy `accepted`, `oral`, `spotlight`, `poster`, `workshop` |
| `rejected` | legacy `rejected` |
| `preprint` | legacy `preprint` |
| `unknown` | legacy `unknown`; also the default for anything unmapped |

**`honors`** — array, default `[]`, multi-valued because "accepted **and** oral" is unrepresentable today.

| Value | Derived from |
|---|---|
| `oral` | legacy `oral` |
| `spotlight` | legacy `spotlight` |

**`presentationFormat`** — nullable, default `null`.

| Value | Derived from |
|---|---|
| `poster` | legacy `poster` |

`oral` legitimately appears in both the honors and presentation-format vocabularies. They are separate registries describing different facts, and that overlap is correct rather than redundant.

### A Naming Hazard That Must Not Be Ignored

**FACT:** `papers.status` already exists at `src/content.config.ts:151` as `libraryStatus` — `draft` / `pending` / `approved` / `rejected` — the **publication review** status that gates the human-review rule at `src/content.config.ts:183-189`.

**DECISION: the new field is named `acceptanceStatus`, never `status` or `decision`.** C2's illustrative naming — "decision / status" — would collide head-on with an existing required field, and its illustrative values `pending` and `rejected` are *also* existing `libraryStatus` values meaning something entirely different. A record carrying `status: "rejected"` (review rejected the card) and `acceptanceStatus: "accepted"` (the venue accepted the paper) is coherent; the same two facts under one name are not.

---

## Content Hash

**DECISION: one new field, `contentHash`, on the canonical item. Private side only.**

Per the audit's [Vector Readiness](../plans/research-os-pre-aws/readiness-audit.md#vector-readiness) assessment, this is the only field embeddings require that identity, provenance, and dedup do not already provide. It determines when a stored embedding is stale, and it doubles as a dedup input.

- **Form:** `v1:sha256:<hex>` — the algorithm and the *definition version* are both in the value. When the hashed field set changes, the version changes and every prior hash remains interpretable rather than ambiguously stale.
- **Input:** a defined, ordered subset of canonical fields. **[T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md) defines the exact subset and owns the pure function and its tests.** This record fixes only that the field exists, is versioned in-value, and is private.
- **Not identity.** The content hash changes when content changes. `itemId` does not. Using a content hash as a key is the [rejected content-addressed scheme](#alternatives-rejected).

---

## Field Tables

**This is the deliverable [T09](../plans/research-os-pre-aws/tasks/T09-paper-schema-migration.md) implements.** Types are given in Zod terms for the public projection, because that is what T09 edits.

### A. Public Projection — `src/content/papers/` (T09 implements)

`slugSafe` = the existing `slugSafeString` at `src/content.config.ts:4-6`. `dateString` = `src/content.config.ts:10`. Rows marked **NEW**, **CHANGED**, or **REMOVED** are what T09 touches; unmarked rows are unchanged and listed so the table is complete.

| Field | Type | Required | Default | Side | Why it exists |
|---|---|---|---|---|---|
| `id` | `slugSafe` | yes | — | public | Projection identity. URL-bearing, human-chosen, never reused, never changed. Unchanged from `src/content.config.ts:139` |
| `itemId` **NEW** | `z.string().regex(/^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$/)` | yes | — | **join key** | The canonical work ID. The only link from a public card to the private item and to every note. Required rather than nullable: minting a value for the single existing record costs one file edit today and is unrepeatable once DynamoDB holds items |
| `title` | `z.string().min(1)` | yes | — | public | |
| `url` | `httpUrl` | yes | — | public | Canonical landing URL |
| `paperUrl` | `optionalHttpUrl` | no | `null` | public | |
| `codeUrl` | `optionalHttpUrl` | no | `null` | public | |
| `projectUrl` | `optionalHttpUrl` | no | `null` | public | |
| `venue` | `z.string().min(1).optional()` | no | — | public | Free string today. [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md) converts it to a registry ID; T01 does not change it |
| `year` | `z.number().int().min(1900).max(2100).optional()` | no | — | public | |
| `decision` **REMOVED** | — | — | — | — | Conflated four facts. See [C2](#c2--papersdecision-split-into-acceptancestatus-and-honors). **Rendered at `src/pages/[lang]/library/[section].astro:225` — that render site must be updated in the same change** |
| `acceptanceStatus` **NEW** | `slugSafe`, cross-checked against the vocabulary data file | yes | `'unknown'` | public | The acceptance half of the split. Registry-backed, not a Zod enum, because the evidence is one record |
| `honors` **NEW** | `z.array(slugSafe).max(4).default([])`, cross-checked | yes | `[]` | public | The honors half. Array because "accepted and oral" is unrepresentable today |
| `presentationFormat` **NEW** | `slugSafe.nullable().default(null)`, cross-checked | no | `null` | public | Preserves legacy `poster` without loss |
| `provenance` **NEW** | `z.enum(['VERIFIED','RADAR'])` | yes | `'RADAR'` | **both** | Drives TTL and display separation. The one closed enum justified here; see [rationale](#provenance-tier). Default `RADAR` because `VERIFIED` must never be assignable by omission |
| `topics` | `z.array(slugSafe).default([])` | yes | `[]` | public | |
| `priority` | `z.enum(['high','medium','low'])` | yes | — | public | Owner-facing reading priority, not a quality score |
| `difficulty` | `z.enum(['beginner','intermediate','advanced','unknown'])` | yes | — | public | |
| `status` | `libraryStatus` | yes | — | public | **Publication review status. Not acceptance status.** See [the naming hazard](#a-naming-hazard-that-must-not-be-ignored) |
| `summary.{ko,en,jp}` | existing `paperSummaryFields` | yes (object) | — | public | Original human-reviewed summaries |
| `signals.citationCount` | `z.number().int().nonnegative().nullable().default(null)` | yes | `null` | public | Observation. `null` = unavailable, never zero |
| `signals.influentialCitationCount` | same | yes | `null` | public | Observation |
| `signals.hasCode` **CHANGED** | `z.boolean().nullable().default(null)` | yes | `null` | public | Was `default(false)`. `false` reported "not checked" as "no code" |
| `signals.hasProjectPage` **CHANGED** | `z.boolean().nullable().default(null)` | yes | `null` | public | Same reason |
| `signals.topicScore` **REMOVED** | — | — | — | — | Ranking input, not observation. [C1](#c1--signalstotalscore-removed) + [C3](#c3--where-the-canonical-research-item-lives). Null in the only record; zero readers |
| `signals.sourceScore` **REMOVED** | — | — | — | — | As above |
| `signals.usefulnessScore` **REMOVED** | — | — | — | — | As above |
| `signals.freshnessScore` **REMOVED** | — | — | — | — | As above |
| `signals.totalScore` **REMOVED** | — | — | — | — | [C1](#c1--signalstotalscore-removed). No replacement, no legacy carriage |
| `source.kind` | `z.enum(['manual','ai-assisted','imported'])` | yes | `'manual'` | public | How the card was produced |
| `source.externalIds` **NEW** | `z.array(z.object({ scheme: slugSafe, value: z.string().min(1) })).max(12).default([])`, unique on `(scheme,value)`, schemes cross-checked | yes | `[]` | **both** | Replaces the fixed columns. A new source becomes data. `source` and `fetchedAt` per entry stay private — the projection carries scheme and value only |
| `source.openReviewId` **REMOVED** | — | — | — | — | → `externalIds` entry with scheme `openreview` |
| `source.semanticScholarId` **REMOVED** | — | — | — | — | → scheme `semanticscholar` |
| `source.arxivId` **REMOVED** | — | — | — | — | → scheme `arxiv` |
| `source.firstSeenAt` | `dateString` | yes | — | public | |
| `source.lastCheckedAt` | `dateString` | yes | — | public | |
| `review.*` | existing `reviewMeta` + `aiDraftUsed` | yes | — | public | The human-review gate. **Unchanged, and not weakened** |
| `relatedResources` | `relatedIds` | yes | `[]` | public | |
| `relatedDecks` | `relatedIds` | yes | `[]` | public | |

**Validator additions for T09**, each needing a failing-case fixture per `shared-context.md` §6:

1. `acceptanceStatus`, every `honors` entry, and `presentationFormat` resolve in the vocabulary data file.
2. Every `source.externalIds[].scheme` resolves in the scheme registry.
3. `source.externalIds` has no duplicate `(scheme, value)` pair.
4. `itemId` matches the pattern and is unique across the collection. A duplicate `itemId` means two public cards for one work — an editorial problem needing a human, and a validator failure rather than a silent merge.
5. `provenance: "VERIFIED"` is rejected unless the venue resolves in the venue registry — **deferred until [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md) exists**; until then `VERIFIED` requires a human reviewer, which `review.humanReviewed` already provides.

### B. Canonical Research Item — private repository (contract, not implemented here)

Not implemented by any task in this plan. Recorded so [T02](../plans/research-os-pre-aws/tasks/T02-corpus-personal-state-boundary.md) and the private repository start from a fixed contract. **Nothing in this table may be added to `src/content/papers/`** — see [C3](#c3--where-the-canonical-research-item-lives).

| Field | Type | Required | Default | Side | Why it exists |
|---|---|---|---|---|---|
| `itemId` | opaque ID, pattern as above | yes | minted | corpus (PK) | Primary identity. Append-only, never derived, never changed |
| `mintedAt` | timestamp | yes | mint time | corpus | Merge tie-break audit; ULID order should agree, and a disagreement is a bug worth detecting |
| `lifecycle` | `active` \| `merged` | yes | `active` | corpus | Merge state. Never `deleted` |
| `mergedInto` | `itemId` or null | no | `null` | corpus | Survivor pointer. One hop maximum; chains collapsed on write |
| `externalIds[]` | `{ scheme, value, source, fetchedAt }`, max 12 | yes | `[]` | corpus | Resolution inputs and citation identifiers |
| `statusHistory[]` | entries per [above](#status-history-and-provenance-tier), max 24 | yes | `[]` | corpus | Append-only lifecycle. The reason one entity survives preprint→published |
| `acceptanceStatus` | vocabulary string | yes | `unknown` | corpus | Materialized derivation of `statusHistory`. Recomputable, never authoritative alone |
| `honors[]` | vocabulary strings, max 4 | yes | `[]` | corpus | Independent of acceptance status |
| `presentationFormat` | vocabulary string or null | no | `null` | corpus | |
| `provenance` | `VERIFIED` \| `RADAR` | yes | `RADAR` | corpus | Drives TTL. Never assignable by assertion |
| `ttlExempt` | boolean | yes | `false` | **personal-state boundary** | Set true and never cleared once any note, save, or reference exists. Personal state outranks disposal |
| `sameWorkAs[]` | `{ targetItemId, confidence, evidence, source, observedAt, reviewedBy, reviewedAt }` | yes | `[]` | corpus | Links short of a merge, including `refuted` ones |
| `canonicalUrl` | normalized URL | yes | — | corpus | Dedup input. Owned by [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md) |
| `dedupKey` | derived string | yes | — | corpus | Deterministic dedup. Owned by T06 |
| `contentHash` | `v1:sha256:<hex>` | yes | — | corpus | Embedding staleness + dedup input. See [Content Hash](#content-hash) |
| `canonicalLanguage` | language code | yes | — | corpus | Owned by [T07](../plans/research-os-pre-aws/tasks/T07-facets-and-language.md). Listed for completeness |
| `fieldSources{}` | field path → `{ source, fetchedAt }`, tracked fields only | yes | `{}` | corpus | Per-field provenance. Never in DynamoDB, never in the projection |
| `conflicts[]` | recorded disagreements | yes | `[]` | corpus | Conflicts are data, not exceptions |
| `signalSheet` | named observations with availability states | yes | — | corpus | Replaces the removed composite scores |
| `bibliographic` / `enrichment` / `derived` / `ai` | four namespaces | yes | — | corpus | Auditability: was the input wrong, the computation wrong, or the model wrong |
| `projectionId` | `slugSafe` or null | no | `null` | corpus | The public `papers.id`, when this item has been published as a card. Null for the overwhelming majority |

**Fields that must never appear in the public projection** — the enforcement list for [T10](../plans/research-os-pre-aws/tasks/T10-boundary-validator-hardening.md): `fieldSources`, `conflicts`, `statusHistory`, `sameWorkAs`, `dedupKey`, `contentHash`, `ttlExempt`, `lifecycle`, `mergedInto`, `mintedAt`, and anything in the `ai` or `derived` namespaces.

---

## Migration Notes For T09

**FACT: the `papers` collection holds exactly one record, and it is labelled a sample.** A breaking change costs one file today. After DynamoDB holds items keyed on this shape, the same change costs a data migration against the one asset the system cannot recompute. **That asymmetry is the entire reason this work happens before AWS and not after.**

### Old → New Mapping

| Legacy `decision` | `acceptanceStatus` | `honors` | `presentationFormat` | `provenance` | Occurrences in corpus |
|---|---|---|---|---|---|
| `accepted` | `accepted` | `[]` | `null` | venue-dependent | **1** |
| `oral` | `accepted` | `['oral']` | `oral` | venue-dependent | 0 |
| `spotlight` | `accepted` | `['spotlight']` | `spotlight` | venue-dependent | 0 |
| `poster` | `accepted` | `[]` | `poster` | venue-dependent | 0 |
| `preprint` | `preprint` | `[]` | `null` | `RADAR` | 0 |
| `workshop` | `accepted` | `[]` | `null` | `RADAR` | 0 |
| `rejected` | `rejected` | `[]` | `null` | `RADAR` | 0 |
| `unknown` | `unknown` | `[]` | `null` | `RADAR` | 0 |

**Seven of the eight rows are untested by any real data.** They are derived from the enum's own vocabulary and from the four-way decomposition [above](#what-the-legacy-enum-actually-conflates), not from usage.

`workshop` is the weakest row: mapping it faithfully needs the venue registry to record the venue's `type`, which does not exist until [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md). Since no record uses it, T09 may implement the mapping as written and leave it unexercised — but should not claim it is verified.

### The One Record

`src/content/papers/sample-paper-card.md`: `decision: "accepted"`, `venue: "ICLR"`, `year: 2026`, review-approved.

- `acceptanceStatus: "accepted"`, `honors: []`, `presentationFormat: null`.
- **`provenance: "RADAR"`**, not `VERIFIED`. `"ICLR"` is a free string, not a venue-registry ID, and no authoritative source established the acceptance — the record is fabricated sample data. [`VERIFIED` is not assignable by assertion](#provenance-tier), and the first exception granted for convenience is the one that makes the rule unenforceable.
- `itemId`: mint one value and write it in. It is the only record that will ever need a hand-minted ID.
- `source.externalIds: []` — all three legacy ID columns are null.
- All five `*Score` fields: delete the keys.
- T09 may instead replace the sample with a real reviewed paper. Either is acceptable; **leaving `provenance: "VERIFIED"` on fabricated data is not.**

### Coordination

- **`src/pages/[lang]/library/[section].astro:225` renders `paper.data.decision` as a pill.** Removing the field breaks the build until that line is updated. This render site is **not** listed in T01's or T09's "Known Code Locations" table — it was found by grep while confirming audit evidence. T09 must include it.
- `docs/features/library-data-model.md:82` restates the eight-value list as prose. T09 updates it in the same change, per `README.md` execution rule 3. **T01 does not edit it**, because the honest-history rule applies to a document that is a current spec, not a historical record: it is superseded in substance here and should be corrected by the change that makes it wrong, not before.
- The vocabulary data file (`acceptanceStatuses`, `honors`, `presentationFormats`) and the identifier-scheme registry are created by T09 in `src/data/`, following the existing pattern of `src/data/decks.ts` and `src/data/learningPaths.ts`.
- **File contention:** T03, T05, T07, and T09 all edit `src/content.config.ts`. Never two at once — `README.md` rule 4.

---

## What This Record Does Not Decide

Recorded so later agents do not read a decision into silence:

- **Chunk models, embedding formats, vector index shape.** Out of scope. Only field compatibility is decided, and it amounts to one field.
- **Graph edges and the relation vocabulary.** [`research-discovery-system.md`](./research-discovery-system.md#the-relation-vocabulary-is-deliberately-small) owns them.
- **DynamoDB table layout, single-table versus several.** Explicitly open at [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#access-patterns-first):294.
- **The venue registry.** [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md).
- **URL canonicalization rules, the dedup key's exact derivation, the content hash's input set.** [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md).
- **Topic ID lifecycle.** [T03](../plans/research-os-pre-aws/tasks/T03-taxonomy-lifecycle.md), though it deliberately shares this record's `mergedInto` pattern.
- **Queue and API payload versioning.** [T02](../plans/research-os-pre-aws/tasks/T02-corpus-personal-state-boundary.md).
- **Author identity and disambiguation.** Explicitly out of scope for MVP at [`research-discovery-system.md`](./research-discovery-system.md#paper):284.
- **Blog tag, category, and series normalization.** Deferred as F1 in the [audit](../plans/research-os-pre-aws/readiness-audit.md), on the evidence that no code path connects blog frontmatter to the item model.

---

## Open Questions

- **Do `topicScore`, `sourceScore`, `usefulnessScore`, and `freshnessScore` leave the public projection?** This record says yes, reasoning from C3 rather than from C1, which named only `totalScore`. All four are null with zero readers, so reversing this costs one file edit before T09 runs. Named here rather than buried because it is the one place this record extends an owner decision.
- **Does a `strong-match` same-work claim ever display as a link in Radar while unmerged?** Carried forward unchanged from [`research-discovery-system.md`](./research-discovery-system.md#open-questions):1291. This record fixes only that it never merges.
- **Is `RADAR` → `VERIFIED` promotion automatic on confirmed acceptance, or does it require review?** Also carried forward from that record. This record fixes only the *order* — TTL clears first — not the trigger.
- **VERIFY: does Crossref reliably expose preprint↔published relations**, and how often does a work carry both a preprint DOI and a publisher DOI? Both assumptions shape how often a merge is `authoritative` rather than `strong-match`, and neither has been checked. If authoritative links turn out to be rare, the review queue is much larger than assumed.
- **Should `presentationFormat` exist in the public projection at all,** or only in the canonical item? It is included to migrate legacy `poster` without loss, and no public surface displays it today. If T09 finds no reader for it, the honest move is to keep it private and record the legacy mapping in the canonical item.
- **Does `academicReviews` eventually reference `itemId`?** Left open by the [audit](../plans/research-os-pre-aws/readiness-audit.md#what-does-not-need-fixing) and still open. Not pre-AWS work. `itemId` being opaque and slug-safe means adding the reference later is additive.
- **How large does the identifier index get, and where does it live?** It is a corpus-side structure by [C3](#c3--where-the-canonical-research-item-lives), but resolution during ingest may want it reachable from the pipeline's hot path. A sizing question for [T02](../plans/research-os-pre-aws/tasks/T02-corpus-personal-state-boundary.md), not an identity question.
