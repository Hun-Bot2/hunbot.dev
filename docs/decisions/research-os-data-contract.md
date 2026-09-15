# Research OS Data Contract — Corpus, Personal State, And The Payload Wire Format

Status: Decided. No implementation started. The machine-checkable companion is [`contracts/research-os/research-item.schema.json`](../../contracts/research-os/research-item.schema.json); the repository-side validator that enforces it is [T10](../plans/research-os-pre-aws/tasks/T10-boundary-validator-hardening.md).

Reviewed: 2026-09-14

This record states, field by field, **which store owns each value** in the Research OS, and fixes the **versioned payload contract** that queue messages and API calls travel in. It is the written boundary that [`readiness-audit.md`](../plans/research-os-pre-aws/readiness-audit.md) records as B5 and R4, and it closes C3's remaining practical gap: C3 said where the canonical item lives, not which of its fields go to AWS.

It **does not amend** [`research-discovery-system.md`](./research-discovery-system.md) or [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md), and it **does not re-derive** [`research-item-identity.md`](./research-item-identity.md). T01's Table A and Table B are this record's starting point and are treated as fixed.

**Honest-history note.** No existing decision record was edited to produce this one. Three approved records describe storage differently — the public collections are "not a private candidate store" ([`library-data-model.md`](../features/library-data-model.md):21), the primary store is relational and local ([`research-discovery-system.md`](./research-discovery-system.md#storage-shape)), and personal state is in DynamoDB ([`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution)). None of the three is wrong. They describe different stores, and the missing artifact was never a correction — it was this boundary. Where this record extends one of them, it says so in [What This Record Extends](#what-this-record-extends) rather than quietly widening it.

Marker convention is inherited from [`research-discovery-system.md`](./research-discovery-system.md#marker-convention): **FACT** / **ASSUMPTION** / **DECISION** / **VERIFY** / **OPEN**.

---

## Document Map

| Section | Answers |
|---|---|
| [The Boundary Rule](#the-boundary-rule) | The one sentence. Read this before anything else |
| [Four Stores](#four-stores-not-three) | Why a fourth category exists, and what it protects |
| [The Deciding Procedure](#the-deciding-procedure) | R0–R4 and the two vetoes — the rule that produced every assignment below |
| [Field Assignments](#field-assignments) | **The deliverable.** Every field from T01's tables, with the rule that decided it |
| [Personal-State Records](#personal-state-records) | The DynamoDB side, which T01's tables do not cover |
| [The Payload Contract](#the-payload-contract) | Envelope, versioning, message catalogue, transport rules |
| [The Content Hash](#the-content-hash) | Recorded, and justified against both of its jobs |
| [Record Size](#record-size-against-the-1-wcu-per-kb-model) | The byte budget and the eviction order |
| [The Identifier Index](#the-identifier-index-and-where-it-lives) | Answers the sizing question T01 handed here |
| [Validator Invariants](#validator-invariants-checkable-today) | **T10's specification** |
| [What This Record Extends](#what-this-record-extends) | The two places this goes beyond an existing record |
| [Open Questions](#open-questions) | What is genuinely unresolved |

---

## The Boundary Rule

> **DECISION — the boundary rule, in one sentence: a value belongs to personal state if and only if it is something the user did, decided, or wrote that no re-fetch of any source could reproduce and no git repository already holds; everything observed about the research world is corpus; everything about the system's own execution is operational and disposable; and the public projection publishes only what a human reviewed, regenerable and identical for every reader.**

Everything else in this record is that sentence, applied.

The rule is written as an **exclusive-ownership** rule on purpose. Every field has exactly one owner. A value that two stores hold is not co-owned — one store owns it and the other holds a **mirror**, which is regenerable by definition and may be dropped at any time without loss. A design in which two stores can both be right about the same field is a design in which they can both be wrong, and reconciling them costs more than the round-trip the mirror was avoiding.

**Why this rule and not a simpler one.** The obvious alternative — *"small things in DynamoDB, big things local"* — was rejected. Size is a consequence of the boundary, not a definition of it: a note can be larger than a bibliographic record, and putting the note local because it is large would move the one unrecomputable asset in the system ([`research-discovery-system.md`](./research-discovery-system.md#research-notebook)) off the store designed for durability and mobile reach. **Recomputability, not size, is the load-bearing property**, and it is also the one that maps cleanly onto the cost model: corpus is regenerable, so corpus can be cheap; personal state is not, so personal state is where money is allowed to be spent.

---

## Four Stores, Not Three

T01's [C3](./research-item-identity.md#c3--where-the-canonical-research-item-lives) names three locations: canonical item, personal state, public projection. Applying the rule field by field surfaced a fourth category that none of the three records names, and that the boundary breaks without.

| | Corpus | Personal state | Operational | Public projection |
|---|---|---|---|---|
| Location | Private repo, local, relational | AWS DynamoDB | AWS DynamoDB | This repository |
| Owns | What is true of the research world | What the user did, decided, wrote | The system's own execution | Nothing — it is downstream |
| Regenerable | Yes, from sources | **No** | Yes, or disposable | Yes, from corpus |
| TTL | Never | Never | **Always** | N/A |
| May a note anchor to it? | Yes (`itemId`) | Yes | **Never** | No |

**DECISION: operational state — job state, refresh cursors, retry counts, idempotency keys, DLQ bookkeeping — is a fourth category, lives in DynamoDB, always carries a TTL, and nothing may ever anchor to it.**

**Why it has to exist.** [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#access-patterns-first) lists *"Processing and job state"* as a DynamoDB access pattern, alongside saved papers and notes. Without a fourth category, the deciding procedure files job state as corpus — because it is not something the user wrote — which is both wrong and unimplementable: the collector and processor Lambdas that produce it cannot reach a local relational store. Filing it as personal state is worse: it would make disposable bookkeeping permanent, exempt from TTL, and eligible to be an anchor.

**What it protects.** Two things at once. The cost model, because an untyped "everything else in DynamoDB" bucket is exactly the unbounded growth [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#storage) adopts TTL to prevent. And the durability model, because the rule *"nothing anchors to operational state"* is what makes operational state safe to delete — and TTL is destructive, so a category that is deleted on a timer must be a category nothing depends on.

---

## The Deciding Procedure

Applied in order. **First match wins.** Each field assignment in the tables below cites the rule that decided it, so a later agent can check the reasoning rather than re-litigate the result.

| Rule | Question | If yes |
|---|---|---|
| **R0** | Is this about the system's own *execution* — a job, a cursor, a retry, an idempotency key? | **Operational.** DynamoDB, TTL, never an anchor |
| **R1** | Is the value produced by the user's own act of reading, deciding, or writing, such that no re-fetch could reproduce it? | Go to **R1a** |
| **R1a** | Is that authored value already committed to a git-versioned repository as part of an artifact? | **Yes → projection** (or the private corpus repo) owns it; it does not enter DynamoDB. **No → personal state** |
| **R2** | Is the value observed about, derived from, enriched from, or asserted about the external world? | **Corpus** |
| **R3** | Does a declared personal-state access pattern need this corpus value to render without a corpus round-trip? | Corpus still owns it; a bounded copy is **mirrored** into the personal-state record |
| **R4** | *(Independent of R0–R3.)* Is this corpus value human-reviewed, identical for every reader, and regenerable? | It may be **projected** publicly |

Two vetoes apply to R3 only:

- **V1 — size veto.** A mirror that pushes the personal-state record past its declared byte budget is not taken; the value is fetched from the corpus instead. **V1 never applies to an R1 field.** Notes outrank cost, and [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#reliability-and-failure-behavior) already ranks personal-state durability above the $0 invariant where the two conflict.
- **V2 — churn veto.** A corpus value that changes more often than the user's own state is never mirrored, **at any size**. Mirroring `citationCount` would make every enrichment run rewrite every saved item — a write-amplification problem that a byte budget does not catch, because each individual write is small and there are simply too many of them.

**R1a is the clause that stops the rule over-collecting.** Without it, R1 drags `review.humanReviewed`, the hand-written `summary` blocks, and the editorial `difficulty` judgment into DynamoDB — all three are unrecomputable human acts. They are also already durable, versioned, diffable, and free, in git. **DECISION: a store of record is only needed for user-authored data that has no other durable home.**

---

## Field Assignments

Every field from [T01's Table A](./research-item-identity.md#a-public-projection--srccontentpapers-t09-implements) and [Table B](./research-item-identity.md#b-canonical-research-item--private-repository-contract-not-implemented-here), with the deciding rule. `Mirror` means a bounded copy in the personal-state record whose owner is elsewhere.

### A. Fields that appear in the public projection

| Field | Owner | Rule | In personal state? | Note |
|---|---|---|---|---|
| `id` | projection | R1→R1a | no | A human-chosen URL slug, authored and committed. It names a *card*, not a work |
| `itemId` | corpus | R2 | **mirror** | The only join between all four stores. [T01](./research-item-identity.md#canonical-item-identity) |
| `title` | corpus | R2 → R4 | **mirror**, byte-capped | See the [byte-vs-character hazard](#record-size-against-the-1-wcu-per-kb-model) |
| `url` | corpus | R2 → R4 | no (V1) | Projection of `canonicalUrl` |
| `paperUrl`, `codeUrl`, `projectUrl` | corpus (enrichment) | R2 → R4 | no (V1) | ~350 bytes for three URLs no list view renders |
| `venue` | corpus | R2 → R4 | **mirror** as registry ID | Free string until [T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md) |
| `year` | corpus | R2 → R4 | **mirror** | 8 bytes, and it orders a saved list |
| `acceptanceStatus` | corpus | R2 → R4 | no (R3 = no) | Materialized from `statusHistory` |
| `honors` | corpus | R2 → R4 | no (R3 = no) | |
| `presentationFormat` | corpus | R2 → R4 | no (R3 = no) | |
| `provenance` | corpus | R2 → R4 | **mirror** | Radar and Verified must be *visibly separated* ([`research-discovery-system.md`](./research-discovery-system.md#product-surfaces)), so the phone needs it without a round-trip |
| `topics` | corpus (derived) | R2 → R4 | **mirror**, max 8 | Renders chips and enables client-side filtering of an already-fetched saved list. That is rendering, not a new access pattern, so it does not trip [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#access-patterns-first)'s no-new-pattern rule |
| `priority` | projection | R1→R1a | no — **see below** | |
| `difficulty` | projection | R1→R1a | no | An editorial judgment on the card. The corpus may hold an AI-proposed difficulty in its `ai` namespace; the *published* value is the human one |
| `status` (`libraryStatus`) | projection | R1→R1a | no | Publication review status. Not acceptance status ([T01](./research-item-identity.md#a-naming-hazard-that-must-not-be-ignored)) |
| `summary.{ko,en,jp}` | projection | R1→R1a | **never** | Human-reviewed originals. Already durable in git |
| `signals.citationCount` | corpus | R2 → R4 | **never (V2)** | Churns on every enrichment run |
| `signals.influentialCitationCount` | corpus | R2 → R4 | **never (V2)** | |
| `signals.hasCode` | corpus | R2 → R4 | **never (V2)** | Observation, not score. `null` = unchecked |
| `signals.hasProjectPage` | corpus | R2 → R4 | **never (V2)** | |
| `source.kind` | projection | R1→R1a | no | How the *card* was produced |
| `source.externalIds[].scheme/value` | corpus | R2 → R4 | no (V1) | |
| `source.externalIds[].source/fetchedAt` | corpus | R2, fails R4 | no | Never projected. [T01](./research-item-identity.md#external-identifier-map) |
| `source.firstSeenAt` | corpus (operational field of an item, not operational *state*) | R2 → R4 | no | |
| `source.lastCheckedAt` | corpus | R2 → R4 | **never (V2)** | The archetypal churn field, and the one the content hash must never cover |
| `review.*` | projection | R1→R1a | **never** | The human-review gate, unchanged and not weakened |
| `relatedResources`, `relatedDecks` | projection | R1→R1a | no | Editorial links between cards |
| `depth` | corpus | R2 → R4 | **mirror** | [T07](../plans/research-os-pre-aws/tasks/T07-facets-and-language.md) |
| `contentType` | corpus | R2 → R4 | **mirror** | [T07](../plans/research-os-pre-aws/tasks/T07-facets-and-language.md) |
| `canonicalLanguage` | corpus | R2 → R4 | **mirror** | Vector-readiness field. 20 bytes |
| `publishedAt` | corpus | R2 → R4 | no (V1) | `year` already orders the list |

**DECISION on `citationCount`, `influentialCitationCount`, `hasCode`, `hasProjectPage`** — the four observations the owner's C1-extension explicitly left to this record. **They are corpus-owned, publicly projected, and never mirrored into personal state.** Corpus-owned because R2 decides them: every one is an observation about the world, not a user act. Publicly projected because they pass R4 — regenerable, reader-identical, and already human-reviewed onto a card. Never mirrored because of V2: they are the highest-churn fields in the record, and a mirror of them would turn one enrichment pass into a full rewrite of every saved item.

> **A naming hazard, and it is the same one T01 found.**
>
> **FACT:** `papers.priority` exists today in the `papers` schema in `src/content.config.ts`, and [T01's Table A](./research-item-identity.md#a-public-projection--srccontentpapers-t09-implements) describes it as *"owner-facing reading priority"*. Read literally, that is personal state sitting in a public collection — precisely what [C3](./research-item-identity.md#c3--where-the-canonical-research-item-lives) forbids.
>
> **DECISION: the two facts are separated by name, never by synchronization.** `papers.priority` is an **editorial** choice about a published card — how prominently it is placed — and is projection-owned under R1a. The user's live reading priority is **`readingPriority`**, personal-state-owned, and it **never** round-trips into the projection. Nothing syncs them.
>
> This is deliberately the same remedy [T01](./research-item-identity.md#a-naming-hazard-that-must-not-be-ignored) applied to `status` / `acceptanceStatus`: when one name carries two facts, split the name. It is also why `readingPriority` and not `priority` appears on the [forbidden-in-public list](#validator-invariants-checkable-today) — a validator banning `priority` would fail the existing corpus, and a validator banning nothing would let the real leak through.

### B. Fields that exist only in the canonical item

Everything in [T01's Table B](./research-item-identity.md#b-canonical-research-item--private-repository-contract-not-implemented-here) is corpus-owned under **R2** unless stated otherwise. The rows below are the ones where the assignment is not automatic.

| Field | Owner | Rule | Note |
|---|---|---|---|
| `mintedAt`, `lifecycle`, `mergedInto` | corpus | R2 | Never projected, never in DynamoDB |
| `statusHistory[]`, `sameWorkAs[]`, `conflicts[]` | corpus | R2 | Append-only, bulky, analytical. Exactly the shape a relational store is for |
| `canonicalUrl`, `dedupKey`, `contentHash` | corpus | R2 | [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md) owns their derivation |
| `fieldSources{}` | corpus | R2 | Already fixed as corpus-only by [T01](./research-item-identity.md#per-field-source-and-fetch-time). **DECISION: the tracked-field list T01 assigns to this record is exactly the fields marked `owner = corpus` in table A above, plus `abstract`.** Nothing else may create a `fieldSources` entry — a bounded list, per [`shared-context.md`](../plans/research-os-pre-aws/shared-context.md#8-cost-constraint-relevant-before-aws) §8 |
| `signalSheet` | corpus | R2 | Replaces the removed composite scores |
| `bibliographic` / `enrichment` / `derived` / `ai` | corpus | R2 | The four auditability namespaces ([`research-discovery-system.md`](./research-discovery-system.md#data-model)) |
| `derived.ranking.{topicScore, sourceScore, usefulnessScore, freshnessScore, totalScore}` | corpus | R2 | **Where the owner's C1-extension lands.** All five are ranking inputs. Never projected, never in DynamoDB |
| `abstract` (inside `bibliographic`) | corpus | R2 | **DECISION: in transit and in the corpus only. Never written to DynamoDB and never projected.** It is a content-hash input and a filtering input. Projecting it would republish source text, which [`research-discovery-system.md`](./research-discovery-system.md#technical-boundary) forbids; storing it in DynamoDB would add ~1–2 KB to a hot item for no declared access pattern |
| `projectionId` | corpus | R2 | Null for the overwhelming majority |
| `canonicalLanguage` | corpus | R2 → R4 | Mirrored (20 bytes) |
| **`ttlExempt`** | **personal state** | **R1** | **DECISION.** T01 marks this row *"personal-state boundary"* without resolving it. It is resolved here: `ttlExempt` becomes true because the user saved or noted the item — an act no re-fetch reproduces — so R1 owns it, and it lives where the TTL it disarms lives. The corpus does not carry it |

**FACT:** this leaves the corpus holding everything bulky and analytical and DynamoDB holding nothing that is not either the user's own or a bounded mirror — which is the property [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution) assumes and never states.

---

## Personal-State Records

T01's tables do not cover the DynamoDB side, because T01 was an identity record. This is that side. [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#data-and-storage-strategy) fixes *what* persists — saved papers, reading state, notes, questions, ideas, content candidates, confirmed interpretations. This fixes the record shapes.

**DECISION: no principal identifier appears anywhere.** No `userId`, no `tenantId`, no `ownerId`. [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#security-boundary) says *"one user, and the system should assume it"*, and a nullable, always-identical tenant column is the most expensive kind of speculative field: it costs bytes on every record forever and proves nothing about whether multi-tenancy would actually work. Adding one later is a `contractVersion` bump, and that is the honest price.

| Record | Key | TTL | Budget | Contents |
|---|---|---|---|---|
| `PersonalStateItem` | `ITEM#<itemId>` / `STATE` | Never | **≤ 1024 B** | Saved / reading state / priority, plus bounded corpus mirrors |
| `NoteItem` | `ITEM#<itemId>` / `NOTE#<ulid>` | Never | **Uncapped** | Typed note body, optional anchor, revision chain |
| `RadarCandidateItem` | `RADAR#<yyyy-mm-dd>` / `<itemId>` | **Yes**, unless `ttlExempt` | ≤ 1024 B | Today's Radar |
| `IdeaItem`, `QuestionItem`, `ContentCandidateItem` | `IDEA#…` etc. | Never | ≤ 1024 B hot | Same rules; attribute lists deferred, see below |
| `JobItem` | `JOB#<jobId>` | **Always** | — | Operational (R0). Nothing anchors to it |

**DECISION: a note is never truncated to save write capacity, and `NoteItem` carries no byte budget at all.** The arithmetic makes this free rather than merely principled: an 8 KB note costs 9 WCU; at [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#one-year-capacity-model)'s modelled 300 user actions/day, *every one of them* a full-size note write is 2,700 WCU-seconds against 2,160,000 available per day — **0.125%**. The cost argument against large notes does not merely lose to durability; it is quantitatively empty.

**DECISION: a note revision writes a new revision and sets `revisionOf`. The prior revision is retained.** `shared-context.md` §4: nothing is ever deleted. Applied to the one asset that cannot be recomputed, the rule is not a nicety.

**DECISION: `IdeaItem`, `QuestionItem`, and `ContentCandidateItem` have their record shape deferred, deliberately, and the deferral is bounded by the rules above rather than left open.** Their display surfaces are undesigned — [`research-discovery-system.md`](./research-discovery-system.md#product-surfaces) puts UI explicitly out of scope — and R3 cannot be evaluated for a mirror without a declared access pattern. What is fixed now is what would be expensive to change later: they are personal state, they are permanent, they are keyed on `itemId` where they relate to one, they carry no principal identifier, and their hot items obey the same 1 KB budget. Inventing their attribute lists today would be a guess frozen into a wire format, which is the specific failure this plan exists to prevent.

`RadarCandidateItem`'s composition is likewise **not itemized here**, for the same reason: what a Radar card shows on a phone is undesigned. Its budget is fixed at 1024 bytes so that whatever it holds must fit inside one WCU.

---

## The Payload Contract

**DECISION: one envelope, several bodies — a single contract covers both queue messages and API payloads.**

The alternative, separate contracts, was rejected on a concrete case: *"add this paper"* arrives either from a collector via SQS or from the user via the API, and the resulting work is identical. Two contracts would mean two version negotiations, two idempotency rules, and two validators that must be kept in agreement by hand. One envelope with a `messageType` discriminator gives one of each.

**DECISION: the contract is expressed as JSON Schema (draft 2020-12), not Zod.** One sentence, as the packet asks: the contract's consumers are a private repository and AWS Lambdas that do not exist yet and are not committed to TypeScript, so a language-neutral, dependency-free data file is the only form all of them can read — and a Zod file would have to live in `src/`, where it would be TypeScript code in the public repository describing private-system fields, which is the coupling [`shared-context.md`](../plans/research-os-pre-aws/shared-context.md#1-two-systems-one-repository) §1 exists to prevent.

### Where the file lives, and why that location

`contracts/research-os/research-item.schema.json`.

- **Not `src/content/`** — every collection in `src/content.config.ts` is loaded by a `glob({ base: './src/content/…' })`. A schema file there becomes a content collection entry.
- **Not `src/data/`** — that directory is imported by routes (`src/data/discoverFacets.ts` is read by the Library pages), so a file there is one import away from being a runtime dependency of the public site.
- **Not `public/`** — everything under `public/` is served verbatim. The private system's contract would be published at a URL.
- **A new top-level `contracts/`** is inert to every build step: Astro reads `src/` and `public/`, Tailwind's content globs are `./src/**` and `./public/**/*.html` (`tailwind.config.mjs:3-6`), and Pagefind indexes `dist/`. It sits beside the existing top-level `archive/` and `docs/`, so it introduces no new shape. **FACT:** `npm run product:validate` passes with the file present — verified, not assumed.

### The envelope

```jsonc
{
  "contractVersion": 1,              // REQUIRED. Envelope major.
  "messageId":       "msg-01jt…",    // ULID, same alphabet as itemId
  "messageType":     "candidate.discovered",
  "payloadVersion":  1,              // REQUIRED. Major, per message type
  "occurredAt":      "2026-09-14T09:00:00Z",
  "producer":        { "name": "collector", "version": "0.1.0" },
  "idempotencyKey":  "openreview:abc123",
  "traceId":         "…",            // optional
  "payload":         { … }
}
```

**DECISION: two version numbers, not one.** `contractVersion` versions the envelope; `payloadVersion` versions one message type's body, independently. The reason is operational rather than aesthetic: a consumer that understands the envelope can read `messageType` and `payloadVersion` and **route a body it cannot parse straight to the DLQ without parsing it**. One combined version number forces every consumer to parse every body before it can decide it does not understand it, which is exactly the position you do not want to be in during a partial rollout.

**DECISION: the envelope is closed (`additionalProperties: false`); bodies are open at runtime.** A new envelope key is a `contractVersion` bump by construction — that is what the closedness buys. A new body property must not break an older consumer, so **a runtime consumer MUST ignore unknown properties inside `payload` rather than reject the message**, which lets a producer roll out ahead of a consumer. The schema file nevertheless declares bodies closed, because the authoring-time and CI check is deliberately stricter than the runtime one: an accidental field must fail in CI, never ship silently.

**DECISION: an unrecognized `contractVersion`, `messageType`, or `payloadVersion` is dead-lettered. It is never dropped.** `shared-context.md` §4 — nothing is ever deleted — applies to messages too, and a message that cannot be understood today is the single most likely message to be worth reading tomorrow.

**DECISION: `idempotencyKey` is required, and a redelivery is a no-op enforced by a conditional write on `attribute_not_exists`.** SQS delivery is at-least-once, so idempotency is not optional. This reuses the exact mechanism [T01](./research-item-identity.md#the-decision) specifies for `itemId` minting — one concurrency pattern in the system, not two.

**DECISION: a message is capped at 65,536 bytes.** [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#verified-allowances): SQS counts each 64 KB of payload as one request. Capping at exactly one chunk makes request consumption **bounded by construction rather than by expectation**, which that record names as the general rule. Soft target: 8 KB.

### Versioning policy

| Change | Effect |
|---|---|
| Add an optional property to a body | No version change |
| Add a new `messageType` | Additive. No `contractVersion` bump |
| Remove, rename, retype, or change the meaning of a body property | `payloadVersion` major bump, **that type only** |
| Change the envelope in any way | `contractVersion` bump |

### The v1 message catalogue

Four types, matching the two Lambdas and the API in [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#proposed-architecture). The catalogue is bounded but extensible: adding a fifth is additive.

| `messageType` | Path | Carries |
|---|---|---|
| `candidate.discovered` | Collector → SQS → Processor | Source, URL, title, **abstract**, authors, venue, year, external IDs, topic hints |
| `candidate.processed` | Processor → corpus + DynamoDB | `itemId`, `resolution`, `contentHash`, `canonicalUrl`, `provenance`, dedup keys |
| `item.enrichment.requested` | Deep processing (modelled at 20/day) | `itemId`, enrichers, `observedContentHash` |
| `personalState.mutation.requested` | API → DynamoDB | `itemId` plus one of `save` / `unsave` / `setReadingState` / `setReadingPriority` / `appendNote` / `reviseNote` |

**DECISION: `abstract` travels in `candidate.discovered` but is never written to DynamoDB.** It is needed to compute the content hash and to filter, and it is bibliographic metadata rather than paper full text — so it is inside [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#data-and-storage-strategy)'s *"no PDFs in AWS"* boundary, not outside it. **This is the clearest single illustration of the boundary in the whole record: a field may be in flight through AWS, live in the corpus, and be forbidden in both DynamoDB and the public projection, all at once.** "In transit" is not a storage side.

**DECISION: `candidate.processed` carries `resolution: "merge-required"` rather than performing a merge.** Per [T01](./research-item-identity.md#same-work-claims-and-their-confidence-vocabulary), only `asserted`, `authoritative`, and `identifier` confidence may merge; everything else raises a claim for a human. A wire format that can express "I merged these" invites a pipeline to do it.

**DECISION: `item.enrichment.requested` carries `observedContentHash`.** A consumer finding a different current hash re-reads instead of acting on stale input. This is optimistic concurrency for free, using a field that exists anyway.

> **Rollback note, stated where it will be read.** This contract becomes **immutable-in-practice the moment the first queue exists** — messages already in flight cannot be re-versioned retroactively. Today it is a JSON file and a document, and reverting it is `git rm`. **This is the last cheap moment to change it.**

---

## The Content Hash

The definition is **already made**, by [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md), and landed at `src/utils/canonicalization.ts`. This record's job is to record it and justify it against both of its uses, not to invent a second one.

| | |
|---|---|
| **Form** | `v1:sha256:<hex>` — algorithm and *definition version* both inside the value |
| **Covers** | `['title', 'abstract', 'authors', 'venue', 'year']`, in that order (`CONTENT_HASH_FIELDS`) |
| **Encoding** | `JSON.stringify` of `[fieldName, value]` pairs built by iterating the declared order; a missing field and an explicit `null` hash identically; UTF-8 |
| **Side** | **Corpus.** Never in DynamoDB, never in the public projection |

### Justified against use 1 — embedding staleness

A stored embedding is stale **if and only if** the item's current `contentHash` differs from the hash recorded alongside the embedding. That is a string comparison, which is the cheapest possible staleness check and the entire point of [the audit's Vector Readiness](../plans/research-os-pre-aws/readiness-audit.md#vector-readiness) conclusion that this is the one field embeddings need.

The failure case the task packet names — *a hash that covers volatile metadata, so a `lastCheckedAt` change invalidates every embedding* — is **structurally impossible** here, not merely avoided by discipline. `computeContentHash` reads only the five keys in `CONTENT_HASH_FIELDS`; a caller may pass the entire canonical item and every other key, volatile or not, is never looked up. `lastCheckedAt`, `fetchedAt`, `source`, `provenance`, `statusHistory`, and the signal sheet cannot reach the digest.

The five covered fields are also the right five: `title` and `abstract` are substantially what an embedding is computed over, and `authors` / `venue` / `year` are what disambiguate one work from another with a similar title. A change to any of them genuinely means the vector is wrong.

**An edge case worth stating.** [`research-discovery-system.md`](./research-discovery-system.md#paper) records that `abstract` may be unavailable for some venues. A missing abstract hashes as `null`, so the hash is still computable — and when the abstract arrives later, the hash changes and the item is re-embedded. That is correct behavior, not a bug, and it is worth naming because it looks like churn at first glance.

### Justified against use 2 — dedup input

**DECISION: hash equality is *confirmatory*, never *discriminative*, and the asymmetry is the whole rule.**

- **Equal hashes** mean title, abstract, authors, venue and year all agree — strictly more agreement than the `strong-match` definition in [T01's confidence vocabulary](./research-item-identity.md#same-work-claims-and-their-confidence-vocabulary) (title, author set, year). **DECISION: content-hash equality maps to `strong-match`.** It raises a claim; it **never** merges automatically. It is metadata agreement, not a shared identifier, and T01 permits only `asserted`, `authoritative`, and `identifier` to merge.
- **Unequal hashes are no evidence of anything.** An arXiv v1 and its camera-ready are one work with two titles and often two abstracts. **The hash may never be used to refute a same-work claim.**

In practice it is an exact-match prefilter: cheap to index, cheap to look up, and it narrows candidates before the expensive comparisons run.

**The one sentence that keeps the two uses from contaminating each other: a changed hash means "re-embed"; it does not mean "different work."** Reading it the second way would re-mint identity on every camera-ready — the exact orphaning failure [T01](./research-item-identity.md#alternatives-rejected) rejects content-addressed identity to avoid.

---

## Record Size Against The 1-WCU-Per-KB Model

[`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#the-actual-binding-constraint): *"keep hot items under 1 KB"*, because a 10 KB item costs 10× a 1 KB item to write, and DynamoDB write capacity is the binding constraint.

Estimated per DynamoDB's own accounting — attribute **name** plus UTF-8 **value**, per attribute. The full itemization is machine-readable at `x-contract.sizeBudget` in the schema file, so the budget is checkable rather than asserted.

| Group | Attributes | Bytes |
|---|---|---|
| Keys and identity | `pk`, `sk`, `itemId`, `gsi1pk`, `gsi1sk` | 177 |
| Personal state (R1) | `readingState`, `readingPriority`, `savedAt`, `updatedAt`, `ttlExempt`, `noteCount`, `lastNoteAt` | 156 |
| Corpus mirrors (R3) | `topicIds` (168), `titleMirror` (171), `venueMirror` (43), `provenance` (19), `year` (8), `canonicalLanguage` (20), `contentTypeMirror` (30), `depthMirror` (23) | 482 |
| | **Total** | **815** |

**~0.80 KB → 1 WCU. Under budget, with 209 bytes of headroom (~20%).**

**This is not comfortable headroom, and the record says so rather than rounding it away.** Two-thirds of the budget is spent on eight mirrored fields, none of which the store owns. If any of the [open questions](#open-questions) resolves toward more mirroring, the budget is the first thing to break.

### The hazard that actually threatens this budget

**DECISION: `titleMirror` is capped at 160 *bytes* after NFC normalization, not 160 characters — and the cap is applied at the truncation site, not asserted in a comment.**

**FACT:** this corpus is Korean, Japanese, and English ([`src/utils/canonicalization.ts`](../../src/utils/canonicalization.ts):186-199 documents exactly this). A Korean or Japanese character is 3 bytes in UTF-8. A 160-**character** Korean title is **480 bytes** — 309 bytes more than budgeted, which alone puts the record at ~1,124 bytes and **doubles the write cost of every saved item to 2 WCU**.

A byte cap that is written as a character cap is the single most likely way this budget silently fails, it fails only for non-English content, and it fails in the language the site's primary content is written in. Truncation must fall on a grapheme boundary and must append nothing.

### If the budget is exceeded, move these — in this order

Each moves to a sibling `DETAIL` item under the same `pk`, fetched only on a detail view. The order runs from *least needed to render a list* to *most*.

1. **`canonicalUrlMirror`** (~138 B) — already excluded for this reason. Only needed when opening an item, which is already a detail view.
2. **`contentTypeMirror`** (30 B) and **`depthMirror`** (23 B) — facets that a list view can omit.
3. **`venueMirror`** (43 B) — resolvable from the venue registry ([T05](../plans/research-os-pre-aws/tasks/T05-venue-registry.md)) by `itemId` lookup.
4. **`titleMirror`** (171 B) — the largest single mirror, and the last one to go, because a saved list without titles is not a saved list.
5. **`topicIds`** (168 B) — reduce the cap from 8 to 4 before dropping it entirely.

**Never evicted:** `pk`, `sk`, `itemId`, `readingState`, `savedAt`, `updatedAt`, `ttlExempt`, `noteCount`, `lastNoteAt`. Those nine are the record's actual purpose; evicting one to save bytes would mean keeping a cache and losing the data.

**Not in the budget at all, and deliberately:** every V2 field. `citationCount`, `influentialCitationCount`, `hasCode`, `hasProjectPage`, `lastCheckedAt`, and the whole signal sheet are excluded on churn, not on size. **Adding them would cost ~80 bytes and would be affordable — and that is exactly why the churn veto has to be a separate rule from the size veto.** A pure byte budget would wave them through and then be surprised when one enrichment pass rewrote the entire saved table.

---

## The Identifier Index, And Where It Lives

[T01's Open Questions](./research-item-identity.md#open-questions) hands this record one sizing question: *how large does the identifier index get, and where does it live?*

**DECISION: the corpus owns the identifier index. A bounded, regenerable replica lives in DynamoDB.**

The tension is real and worth stating plainly: resolution happens during ingest, ingest runs in the processor Lambda, and the corpus is local and unreachable from AWS. Something has to be reachable.

The replica is **scoped by construction** — entries for items inside the Radar TTL window, plus every `ttlExempt` item, and nothing else:

| | Modelled |
|---|---|
| Entries | 90-day window × 500 candidates/day × ~5 keys ≈ **225,000** |
| Size | ×110 bytes ≈ **25 MB**, ~0.1% of the 25 GB allowance |
| Writes | 2,500/day ≈ **2,500 WCU-seconds/day**, ~0.12% of daily capacity |

Inputs are [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#one-year-capacity-model)'s own figures; **ASSUMPTION:** ~5 lookup keys per candidate and ~110 bytes per entry, neither measured.

**This does not violate "the corpus stays local."** The replica holds no bibliographic content, no notes, and no analysis — only `(scheme, normalized value) → itemId` pairs that `deriveDedupKey` already produces. It is regenerable from the corpus by definition, so losing it costs a rebuild rather than data, which is precisely the test the [boundary rule](#the-boundary-rule) uses to decide what may be cheap. It is flagged in [What This Record Extends](#what-this-record-extends) because it is the one place this record adds a structure to AWS that no approved record names.

---

## Validator Invariants, Checkable Today

**This section is [T10](../plans/research-os-pre-aws/tasks/T10-boundary-validator-hardening.md)'s specification.** Every invariant is checkable in *this* repository, today, with no AWS, no new npm dependency, and no network. Per [`shared-context.md`](../plans/research-os-pre-aws/shared-context.md#6-validation-expectations) §6, **each needs a failing-case fixture**; a validator with no failing-case test is not yet trustworthy.

**DECISION: the repository-side validator does not perform full JSON Schema validation, and adds no `ajv`-class dependency.** It parses the contract as JSON and checks structural invariants. Full schema validation belongs in the private repository, where adding a validator dependency costs nothing the public site cares about. This keeps the check dependency-free, which is the only reason it can run on every push.

### Group 1 — the public collections must not absorb the other three sides

| # | Invariant | Source of truth |
|---|---|---|
| INV-01 | No document in `src/content/papers/` or `src/content/resources/` contains any name in `x-contract.forbiddenInPublicProjection`, **at any nesting depth** | the schema file |
| INV-02 | No such document contains any name in `x-contract.personalStateFieldNames` | the schema file |
| INV-03 | None of `x-contract.removedScoreFields` appears in public content **or in `src/content.config.ts`** | the schema file |
| INV-04 | `itemId`, where present, matches `^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$` and is **unique** across `papers` | [T01](./research-item-identity.md#canonical-item-identity) |

INV-01 must recurse. A flat key scan would pass a document nesting `signals.totalScore` or `source.fieldSources`, which is the realistic shape of the mistake. INV-03 checks the schema file as well as content because the field is removed *from the schema* by [T09](../plans/research-os-pre-aws/tasks/T09-paper-schema-migration.md); a reappearance there is a regression even with no content using it yet.

### Group 2 — the contract must stay internally coherent

| # | Invariant |
|---|---|
| INV-05 | `contracts/research-os/research-item.schema.json` parses as JSON, and the envelope declares `contractVersion` as a **required**, `const`-pinned integer |
| INV-06 | Every `messageType` in the envelope's enum has a corresponding `$defs` body, and `payloadVersion` is required |
| INV-07 | Every property carrying `x-side` uses a value from `x-contract.sides`, and no field name is assigned two different owners |
| INV-08 | Every property with `x-mirrorOf` also declares `x-side: "corpus"` — a mirror whose owner is not corpus is a dangling field |
| INV-09 | `x-contract.forbiddenInPublicProjection.fromT01` is **exactly** T01's never-in-projection list. The document and the machine file cannot drift |
| INV-10 | `x-contract.sizeBudget.hotItem`: the declared attribute bytes **sum** to `declaredTotal`, and `declaredTotal ≤ maxBytes`. The size model is arithmetic, not prose |
| INV-11 | The `personalStateItem` property set **equals** the size-budget attribute set — no budgeted attribute without a field, no field without a budget line |

INV-10 and INV-11 together are what make the [record-size section](#record-size-against-the-1-wcu-per-kb-model) a check rather than a claim. **FACT:** both hold today — 815 = 815, 815 ≤ 1024, and the two key sets match.

### Group 3 — the contract must stay in step with the code that implements it

| # | Invariant |
|---|---|
| INV-12 | `CONTENT_HASH_FIELDS` in `src/utils/canonicalization.ts` **equals** `x-contract.contentHash.fields`, in order. Catches drift between T06's code and this contract |
| INV-13 | `computeContentHash({})` matches `x-contract.contentHash.pattern`. Executable, not asserted |
| INV-14 | No file under `src/pages/`, `src/components/`, or `src/layouts/` imports `contracts/` or `src/utils/canonicalization.ts`. The public site gains no runtime dependency |
| INV-15 | No name in `x-contract.singleUser.forbiddenPrincipalFieldNames` appears anywhere in the contract file **outside that declaration itself**. The single-user assumption is enforced, not remembered |

INV-12 is the most valuable check in the list and the least obvious. T06 owns the hash function; this record owns the contract that describes it. Nothing else would notice if someone added `keywords` to `CONTENT_HASH_FIELDS` — and that edit would silently invalidate every stored embedding while leaving both files individually correct.

INV-14 is the boundary from [`shared-context.md`](../plans/research-os-pre-aws/shared-context.md#2-boundaries-that-must-not-move) §2 made mechanical. `src/utils/canonicalization.ts` is pipeline code that happens to live in the public repository; today nothing imports it, and the only way that stays true is a check.

---

## What This Record Extends

Two places, both flagged rather than buried, in the manner [T01](./research-item-identity.md#c1--signalstotalscore-removed) used for its own extension.

1. **A fourth store category.** [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#access-patterns-first) lists processing and job state as a DynamoDB access pattern without categorizing it. This record makes it [operational state](#four-stores-not-three) — TTL-bearing and anchor-free — because the alternatives are worse. Reversing it costs deleting one table row and one rule.

2. **An identifier-index replica in DynamoDB.** No approved record names it. It is justified [above](#the-identifier-index-and-where-it-lives), sized against the cloud ADR's own figures, and constrained to be regenerable so that it is a cache rather than a store. If the owner would rather resolution happen only in the local pipeline, the consequence is that ingest cannot mint identity in AWS — which would mean Radar candidates carry no `itemId` until a local sync, and therefore cannot be noted from a phone until then. That is the trade, stated so it can be taken deliberately.

---

## What This Record Does Not Decide

- **DynamoDB table layout, single-table versus several.** Explicitly open at [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#access-patterns-first). The key shapes here are compatible with either.
- **GSI design beyond the one reading-state index** the budget reserves bytes for.
- **The record shapes of `IdeaItem`, `QuestionItem`, `ContentCandidateItem`** — deferred with stated bounds, [above](#personal-state-records).
- **Chunk models, embedding formats, vector index shape.** Out of scope, unchanged from [T01](./research-item-identity.md#what-this-record-does-not-decide).
- **The content hash's input set.** Owned and already implemented by [T06](../plans/research-os-pre-aws/tasks/T06-canonicalization-dedup.md); recorded here, not redefined.
- **Backup mechanism for personal state.** [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#deferred-decisions) leaves PITR-versus-export open. This record only makes it more urgent by confirming that DynamoDB holds the unrecomputable asset.
- **Authentication and API route shape.** [`research-os-cloud-architecture.md`](./research-os-cloud-architecture.md#security-boundary) owns them.

---

## Open Questions

- **Does `papers.priority` keep its name?** This record separates the facts by name and forbids synchronization, which is sufficient. Renaming the public field to `editorialPriority` would remove the ambiguity entirely, and [T09](../plans/research-os-pre-aws/tasks/T09-paper-schema-migration.md) is already editing that schema, so the change is nearly free *now* and not later. Not taken here because T01's Table A is fixed and this record does not amend it.
- **Should the identifier-index replica exist at all?** See [What This Record Extends](#what-this-record-extends). The alternative is coherent; it is just slower to use from a phone.
- **VERIFY the two replica assumptions** — ~5 lookup keys per candidate and ~110 bytes per entry. Both are estimates. Neither changes the conclusion unless off by an order of magnitude, and both are cheap to measure once `deriveDedupKey` runs over real intake.
- **Does a Radar candidate need a summary line on the phone?** If yes, `RadarCandidateItem` needs a `whyRelevant` mirror of roughly 240 bytes, which fits its own 1 KB budget but would not fit inside `PersonalStateItem`'s remaining 209. Unresolvable until the Radar surface is designed.
- **Is `difficulty` genuinely an editorial judgment, or a corpus-derived value the projection copies?** Filed as projection-owned under R1a because it is a human call recorded on a card. If the pipeline ever proposes it, the proposed value belongs in the corpus `ai` namespace and the published value stays the human one — but nothing enforces that split today.
- **How is a mirror repaired when it drifts?** A mirror is regenerable by definition, so the answer is "re-project from the corpus". No mechanism exists, and none is needed before the first write — but it should be built before the first *thousand*, because a stale `titleMirror` is invisible.
