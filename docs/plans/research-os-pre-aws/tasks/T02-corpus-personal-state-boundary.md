# T02 — Corpus / Personal-State Boundary & Payload Contract

| | |
|---|---|
| **Class** | BLOCKER |
| **Model** | **Opus** |
| **Effort** | **high** |
| **Why this level** | Reconciles three records that each describe a different storage location, and defines a wire format that becomes unchangeable once queue messages exist. Requires judgment about what belongs where, not pattern-matching |
| **Depends on** | T01 |
| **Output** | Design documents plus one machine-checkable schema file |

## Goal

State, field by field, what is **corpus** (local, analytical, bulky), what is **personal state** (AWS, small, mutable), and what the queue and API payload contract is.

## Why This Is Required

Three approved records describe storage differently and none states the boundary:

- [`library-data-model.md`](../../../features/library-data-model.md): *"The public collections are not a private candidate store."*
- [`research-discovery-system.md`](../../../decisions/research-discovery-system.md#storage-shape): relational primary store, graph as derived tables.
- [`research-os-cloud-architecture.md`](../../../decisions/research-os-cloud-architecture.md#conflict-with-the-existing-record-and-its-resolution): corpus local, personal state in DynamoDB.

The cloud ADR's entire $0 model depends on DynamoDB holding only small personal state. Nothing defines "small" or "personal", so the first implementing agent will guess — and guessing wrong is a cost failure and a durability failure at once.

## Source Of Truth

- [`research-os-cloud-architecture.md`](../../../decisions/research-os-cloud-architecture.md) — §Data And Storage Strategy, §One-Year Capacity Model
- [`research-discovery-system.md`](../../../decisions/research-discovery-system.md) — §Data Model, §Storage Shape, §Research Notebook
- `docs/decisions/research-item-identity.md` — T01's output
- [`readiness-audit.md`](../readiness-audit.md) — C3, B5, R4, R5

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. T01's output record
4. `docs/decisions/research-os-cloud-architecture.md` — the two sections named
5. `src/content.config.ts` — lines 126–246 (`papers`, `topics`)

## Decisions Already Fixed — Do Not Revisit

- Corpus and citation graph stay **local**. They are not migrated to DynamoDB.
- Personal state — saved papers, reading state, notes, questions, ideas, content candidates, confirmed interpretations — is what AWS persists.
- Radar candidates are disposable and carry TTL. Saved items are permanent.
- No PDFs or raw paper text in AWS.
- Item records stay small: DynamoDB charges 1 WCU per KB.
- Notes outrank cost. Durability of personal state beats the $0 invariant where they conflict.

## Decisions You May Make

- The exact field split and the rule that decides it.
- The payload versioning scheme.
- Whether the contract is expressed as JSON Schema, Zod, or a plain typed description — pick one and justify it in a sentence.
- The **content hash** definition: what bytes it covers, which algorithm, how it is stored.
- Whether a single contract covers both queue messages and API payloads, or they are separate.

## Decisions You Must NOT Change

- The public site gains no runtime dependency. The contract is not consumed by an Astro route.
- No database, auth, or backend dependency enters this repository.
- T01's identity model.
- The human review rule.

## Expected Edits

| File | Change |
|---|---|
| `docs/decisions/research-os-data-contract.md` | **New.** Field-by-field boundary and the payload contract |
| `contracts/research-item.schema.json` *(or as chosen)* | **New.** Machine-checkable contract. Choose a location that does not make it an Astro content collection |
| `CLAUDE.md` | One index row |

**Do not place the schema under `src/content/`.** It would be picked up as content. `src/data/` is also wrong — that directory is imported by routes.

## Implementation Steps

1. Read T01's field table. The boundary decision is per field, so start from that table rather than inventing one.
2. For every field, assign: corpus, personal state, or both — and state the rule that produced the assignment, not just the result.
3. Define the payload contract with an explicit version field.
4. Define the content hash. Justify it against **both** uses: embedding staleness and dedup input (T06 consumes it).
5. Size the personal-state record against the cloud ADR's model. If the typical record exceeds ~1 KB, say which fields to move and why.
6. Specify what a validator can check **today**, in this repository, without AWS. That is T10's input.
7. Write the record in repository ADR style with markers and cited evidence.

## Validators To Run

```bash
npm run content:validate
npm run product:validate
npm run links:validate
```

`product:validate` matters: confirm the new schema file's location does not trip the approved-route or dependency checks.

## Failure Cases

- **Defining a boundary that puts the corpus in DynamoDB.** Breaks the cost model and contradicts two records.
- **An unversioned payload contract.** Queue messages are a wire format; unversioned means unevolvable.
- **A content hash that covers volatile metadata** — a `lastCheckedAt` change would invalidate every embedding.
- **Placing the schema where Astro loads it as content.**
- **Designing for multi-user.** There is one user; the cloud ADR says to assume it.

## Rollback / Migration Concerns

Documentation and a new file; revert is clean. Note in the record that the payload contract becomes immutable-in-practice once the first queue exists, and that this is the last cheap moment to change it.

## Definition Of Done

- [ ] `docs/decisions/research-os-data-contract.md` exists in ADR style
- [ ] Every field from T01's table assigned a side, with the deciding rule stated
- [ ] Payload contract has an explicit version field
- [ ] Content hash defined, justified for both staleness and dedup
- [ ] Typical personal-state record size estimated against the cloud ADR model
- [ ] Machine-checkable schema committed outside `src/content/` and `src/data/`
- [ ] A list of contract invariants a repository validator can check today
- [ ] All three validators pass

## Handoff

Report: the boundary rule in one sentence; the field split summary; the payload version scheme; the content hash definition; the estimated record size; and the invariant list for T10.
