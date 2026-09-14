# Research OS: Pre-AWS Readiness Plan

Status: **Planning complete. No implementation started. AWS_READY = false.**

Created: 2026-09-14

## Purpose

Make this repository structurally ready so the AWS-backed private Research OS can be introduced **without freezing temporary metadata debt into permanent infrastructure** — DynamoDB keys, queue payloads, API contracts, and vector metadata.

The plan is derived from repository evidence, not from prior discussion. Every prerequisite cites the code or document that makes it necessary. See [`readiness-audit.md`](./readiness-audit.md).

**This plan does not implement AWS.** It does not add a backend, a database, or a runtime dependency to the public site.

## Documents

| File | Read when |
|---|---|
| [`shared-context.md`](./shared-context.md) | Always, once, before any task |
| [`readiness-audit.md`](./readiness-audit.md) | To understand *why* a task exists, or to challenge it |
| [`dependency-graph.md`](./dependency-graph.md) | Before scheduling or parallelizing |
| [`tasks/`](./tasks/) | One packet per task; read only the one assigned |

## How To Execute

One task per agent. The intended invocation:

> Read `docs/plans/research-os-pre-aws/shared-context.md` and `docs/plans/research-os-pre-aws/tasks/T0X-*.md`, inspect only the source files listed in the packet, implement the task, run the listed validations, and report using the packet's handoff format.

Rules:

1. **Do not read the whole repository.** Each packet lists its minimal reading. If you need more, say so in the handoff rather than expanding scope silently.
2. **Small, reviewable commits.** One task, one commit where practical.
3. **Update docs in the same change** when schema, migration rules, validators, storage contracts, or architecture change.
4. **Never two agents in `src/content.config.ts` at once.** See file contention in the dependency graph.
5. **Run the listed validators before reporting.** A task is not done because the edit was made.
6. **Add a regression fixture** whenever validator behavior changes.

## Task Index

| ID | Title | Class | Model | Effort | Depends on |
|---|---|---|---|---|---|
| [T01](./tasks/T01-item-identity-and-provenance.md) | Item identity & provenance model + ADR reconciliation | BLOCKER | **Opus** | high | — |
| [T02](./tasks/T02-corpus-personal-state-boundary.md) | Corpus / personal-state boundary & payload contract | BLOCKER | **Opus** | high | T01 |
| [T03](./tasks/T03-taxonomy-lifecycle.md) | Topic lifecycle fields + `validate-taxonomy.mjs` | BLOCKER | Sonnet | medium | T08 |
| [T04](./tasks/T04-author-taxonomy.md) | Author domains and starting topics | RECOMMENDED | Sonnet | low | T03 |
| [T05](./tasks/T05-venue-registry.md) | Venue registry as data | REQUIRED | Sonnet | medium | T01, T07 |
| [T06](./tasks/T06-canonicalization-dedup.md) | URL canonicalization, content hash, dedup key | BLOCKER | Sonnet | medium | T01 |
| [T07](./tasks/T07-facets-and-language.md) | Facets, `canonicalLanguage`, shared fallback resolver | REQUIRED | Sonnet | medium | T03 |
| [T08](./tasks/T08-test-harness.md) | Test/validator harness + `npm test` | REQUIRED | Sonnet | low | — |
| [T09](./tasks/T09-paper-schema-migration.md) | Apply identity/provenance to the `papers` schema | BLOCKER | Sonnet | high | T01, T02, T05, T06 |
| [T10](./tasks/T10-boundary-validator-hardening.md) | Boundary validator hardening | RECOMMENDED | Sonnet | low | T09 |

## What May Run In Parallel

- **Now, with no prerequisites:** T08.
- **After T01:** T02 and T06 together.
- **After T03:** T04 alongside the `content.config.ts` chain.
- **Never in parallel:** T03, T07, T05, T09 — all four edit `src/content.config.ts`.

## What Blocks AWS

T01, T02, T03, T06, T09. T04 and T10 do not block. T05 and T07 block the first AWS **write path** rather than the first AWS resource.

## Blocking Questions — RESOLVED 2026-09-14

All three were resolved by the repository owner. They are now **fixed decisions**, not open questions. Task packets have been updated; agents must not re-open them.

**C1 — `signals.totalScore`: REMOVED.**
No single composite quality score is a source-of-truth field. The underlying signals are kept separately where still useful. If migration temporarily requires it, `totalScore` is **legacy-only** and is removed once migration completes. This supersedes the schema at `src/content.config.ts:157-167` and aligns with [`research-discovery-system.md`](../../decisions/research-discovery-system.md#quality-signals).

**C2 — `papers.decision`: SPLIT, in the public schema as well as the private contract.**
Two independent fields with semantics equivalent to:

- **decision / status** — `accepted`, `rejected`, `withdrawn`, `pending`, and whatever else repository evidence requires.
- **honors** — `oral`, `spotlight`, `best-paper`, `notable-paper`, and likewise.

**Do not hard-code speculative enum values.** Inspect the existing corpus first and derive the migration mapping from evidence. The value lists above are illustrative, not authoritative.

**C3 — canonical item location: the private Research OS owns the canonical Research Item.**
`src/content/papers` is a **reviewed public projection** of that canonical item, never the canonical record. The projection must stay compatible with the static-first Astro architecture and must not absorb private processing state, personal state, or infrastructure concerns. This must be documented explicitly enough that a future agent cannot reinterpret it.

**Two follow-on decisions, resolved by the owner 2026-09-14 after T01 reported.** Both are now fixed; agents must not re-open them.

**C1-extension — the four sub-scores leave the public projection.** `topicScore`, `sourceScore`, `usefulnessScore`, and `freshnessScore` move to the private Research OS alongside `totalScore`. C1 originally named only `totalScore`; T01 proposed extending it by reasoning from C3 (they are ranking inputs with no measurement procedure anywhere in the repository), flagged the extension rather than burying it, and the owner accepted. The public paper projection carries none of the five score fields. `citationCount`, `influentialCitationCount`, `hasCode`, and `hasProjectPage` are **not** affected — they are observations, not scores.

**Provenance-enum — `provenance` stays a closed Zod enum.** `VERIFIED` / `RADAR`, two values fixed by ADR. This is an **intentional, documented exception** to the *"taxonomy is data, not code"* principle in [`shared-context.md`](./shared-context.md#4-taxonomy-and-registry-principle) — the second such exception, alongside `depth`. The reason is that a third value arriving through a data edit would silently change what TTL deletes, and TTL is destructive. The exception must be documented where the principle is stated, not only where the field is defined, so that a future agent meets the carve-out before meeting the field.

**Honest-history constraint on all three:** preserve the historical ADRs. Do not rewrite old decisions as though these distinctions had always existed. Add the minimum superseding record — which is T01's `docs/decisions/research-item-identity.md`, not a separate document.

## AWS_READY Exit Condition

`AWS_READY = true` only when **every** line below is demonstrable by a command or a committed artifact. No line is waivable by assertion.

| # | Criterion | Evidence required |
|---|---|---|
| 1 | Canonical item identity is defined and stable | `docs/decisions/research-item-identity.md` exists; `papers` carries a canonical ID and an extensible external-ID map including DOI |
| 2 | Provenance tier is separate from honors | Schema expresses `VERIFIED`/`RADAR` independently of award/oral/spotlight; validator rejects the conflated form |
| 3 | Deduplication is deterministic and tested | `src/utils/` exports pure canonicalization + dedup-key functions; `node --test test/` covers tracking-parameter stripping, host/slash normalization, and cross-source near-duplicates |
| 4 | Topic references survive rename and merge | `parent`, `order`, `aliases`, `mergedInto` in schema; `npm run taxonomy:validate` rejects unresolved parents, cycles, duplicate IDs/aliases, and archived parents with active children — each proven by a regression fixture |
| 5 | Corpus and personal state are separated in writing | `docs/decisions/research-os-data-contract.md` names every field and its side; a validator enforces that corpus-shaped fields do not appear in public collections |
| 6 | Queue/API payload contract is versioned | Contract document plus a machine-checkable schema with an explicit version field |
| 7 | Vector-readiness fields exist | Canonical ID, `canonicalLanguage`, topic IDs, document type, timestamps, provenance, **content hash** — all present and validated |
| 8 | Venue references are registry IDs, not free strings | Registry data file exists; validator cross-references every venue reference; no bare venue strings remain in `topics` or `papers` |
| 9 | Every invariant above has a failing-case fixture | Each new validator has a regression fixture that fails when the invariant is violated |
| 10 | Full validation suite green | `npm run content:validate && npm run product:validate && node --test test/ && npm run build && npm run links:validate` all pass |
| 11 | C1, C2, C3 resolved and recorded | A superseding decision record exists; original records are **not** rewritten |

**Not in the gate, deliberately:** blog tag/category/series normalization, Discover routes, embeddings, ingestion adapters, and AWS itself. See the DEFER table in the audit for why each is excluded.

## Honest-History Rule

Where an earlier record no longer matches current decisions, **do not rewrite it.** Add a superseding or clarifying record, state plainly what changed and why, and link both directions. Decision logs stay honest; that is the point of having them.
