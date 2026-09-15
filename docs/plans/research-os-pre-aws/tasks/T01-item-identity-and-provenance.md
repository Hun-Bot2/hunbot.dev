# T01 — Item Identity & Provenance Model, and ADR Reconciliation

| | |
|---|---|
| **Class** | BLOCKER — root of the critical path |
| **Model** | **Opus** |
| **Effort** | **high** |
| **Why this level** | Resolves two contradictions between approved decision records, designs an identity scheme that must survive being written into DynamoDB keys, and must preserve decision-log honesty. Every downstream task consumes this output. A wrong answer here is expensive in a way no other task is |
| **Depends on** | Nothing |
| **Output** | Design documents only. **No schema code changes** — T09 implements |

## Goal

Define the canonical identity and provenance model for a research item, and record the resolution of the contradictions blocking it.

## Why This Is Required

`papers.id` is a hand-written slug (`src/content.config.ts:139`). External identifiers are **fixed columns** — `openReviewId`, `semanticScholarId`, `arxivId` (`:170-172`) — and there is **no DOI field at all**. [`research-discovery-system.md`](../../../decisions/research-discovery-system.md#paper) requires "external IDs as a map, not fixed columns, so a new source is data," and names DOI as bibliographic.

DynamoDB partition keys and every note, reading state, and saved item are keyed on item identity. Notes are identified in [`research-discovery-system.md`](../../../decisions/research-discovery-system.md#research-notebook) as the one unrecomputable asset in the system. An identity change after persistence orphans them.

## Source Of Truth

- [`research-discovery-system.md`](../../../decisions/research-discovery-system.md) — §Provenance Model, §Data Model, §Quality Signals, §Source Strategy
- [`research-os-cloud-architecture.md`](../../../decisions/research-os-cloud-architecture.md) — §Data And Storage Strategy
- [`library-data-model.md`](../../../features/library-data-model.md) — public/private split
- [`readiness-audit.md`](../readiness-audit.md) — C1, C2, C3 and evidence rows D8–D11

## Minimal Required Reading

1. `docs/plans/research-os-pre-aws/shared-context.md`
2. This packet
3. `src/content.config.ts` — **lines 126–203 only** (the `papers` collection)
4. `docs/decisions/research-discovery-system.md` — the four sections named above
5. `docs/plans/research-os-pre-aws/readiness-audit.md` — the Conflicts section

Do not read the blog utilities, routes, or components. They are unrelated.

## Known Code Locations

| Location | What is there |
|---|---|
| `src/content.config.ts:139` | `id: slugSafeString` — the current identity |
| `src/content.config.ts:147` | `decision` enum conflating acceptance and honors |
| `src/content.config.ts:157-167` | `signals` including `totalScore` (0–20) |
| `src/content.config.ts:168-175` | `source` with fixed external-ID columns, no DOI |
| `scripts/validate-library.mjs:101-126` | Existing ID uniqueness and slug validation |

## Decisions Already Fixed — Do Not Revisit

**C1, C2, and C3 were resolved by the owner on 2026-09-14. They are inputs to this task, not questions for it.** Full text in [`README.md`](../README.md#blocking-questions--resolved-2026-09-14). Summary:

- **C1** — `signals.totalScore` is **removed** from the canonical direction. No single composite quality score is a source-of-truth field. Underlying signals are kept separately where useful. Legacy-only during migration, then gone.
- **C2** — `papers.decision` is **split** into `decision`/`status` and `honors`, in the **public schema as well as** the private contract. **Derive the actual value lists and the migration mapping from repository evidence — inspect the corpus before proposing any enum.** Note that `src/content/papers/` holds exactly one record today, so corpus evidence is thin; say so plainly rather than inventing values to fill the gap.
- **C3** — the **private Research OS owns the canonical Research Item**. `src/content/papers` is a reviewed **public projection**, never the canonical record. The projection stays compatible with static-first Astro and must not absorb private processing state, personal state, or infrastructure concerns. Document this so a future agent cannot reinterpret it.

- One entity per **work**, not per artifact. A preprint and its published version are one item with a status history.
- Preprint→published linking is an evidence-backed claim with a confidence level, never a silent inference.
- Provenance is two-valued at the top level: `VERIFIED` / `RADAR`. It is not a score.
- Enrichment metadata never overwrites authoritative metadata.
- Per-**field** source and fetch time, not per record.
- Identity fields are append-only: an ID may gain aliases, never change meaning.

## Decisions You May Make

- The canonical ID's construction (derived from DOI, content-addressed, opaque, or hybrid) and its collision behavior.
- The external-ID map's shape and its key vocabulary.
- How status history is represented.
- The confidence vocabulary for `same_work_as`.
- The exact `decision` and `honors` value lists — **derived from corpus evidence**, not assumed.
- How a legacy `totalScore` is carried during migration, if at all.

## Decisions You Must NOT Change

- The public/private boundary in `shared-context.md` §2.
- The human review rule.
- Anything about the blog collection, routing, or the public site's runtime.
- Existing decision records. **Do not edit or rewrite them.** Add a superseding record instead.

## Expected Edits

| File | Change |
|---|---|
| `docs/decisions/research-item-identity.md` | **New.** The identity and provenance model |
| `docs/decisions/research-item-identity.md` | Also carries the C1/C2/C3 resolutions, each stating what changed, why, and which record it supersedes |
| `CLAUDE.md` | One row in the decisions index, matching existing style |

No changes to `src/`. No changes to `scripts/`.

## Implementation Steps

1. Read the minimal set. Confirm the audit's evidence rows independently — do not take them on trust.
2. Design the canonical ID. State explicitly what happens when a DOI is absent, when it arrives later, and when two records turn out to be one work.
3. Design the external-ID map and the status history.
4. **Record C1 as decided.** State what replaces `totalScore`, what happens to the existing sample record, and the legacy-only migration path if one is needed. Do not re-argue the decision.
5. **Record C2 as decided.** First run `grep -rh '"decision"' src/content/papers/` and inspect `src/content.config.ts:147` to establish what values actually exist versus what the enum permits. Derive the value lists and the old→new migration mapping from that evidence, and state explicitly how thin the evidence is.
6. **Record C3 as decided**, in wording a future agent cannot reinterpret. This is the sentence most likely to be misread later, so make the projection relationship unmissable.
7. Write the record in the repository's ADR style — `Status:` / `Reviewed:` header, FACT/ASSUMPTION/DECISION/VERIFY/OPEN markers, evidence cited with `file:line`.
8. Produce a **field table** T09 can implement directly: field name, type, required, default, which side of the boundary, and why it exists.

## Validators To Run

```bash
npm run links:validate
```

Documentation-only task; the link validator confirms nothing was broken. Verify every internal anchor you write resolves.

## Failure Cases

- **Designing an ID that cannot absorb a late DOI.** Most papers arrive as preprints first. This is the most likely single mistake.
- **Resolving C1 by silently deleting `totalScore`** without recording that the ADR superseded the schema. Rewrites history.
- **Producing a model that requires the public site to carry corpus-shaped data.** Violates `shared-context.md` §2.
- **Over-specifying.** Chunk models, embedding formats, and graph edges are not in scope.

## Rollback / Migration Concerns

No code changes, so no rollback. But note for T09: the `papers` collection currently has **one sample record**, so a breaking change costs one file today and is unrepeatable after DynamoDB holds items. State this in the record.

## Definition Of Done

- [ ] `docs/decisions/research-item-identity.md` exists, in repository ADR style
- [ ] C1, C2, C3 each **recorded as owner-resolved** with what changed and why — not re-argued
- [ ] `decision`/`honors` value lists derived from inspected corpus evidence, with the thinness of that evidence stated
- [ ] The C3 projection boundary stated unmissably
- [ ] No existing decision record edited
- [ ] A field table exists that T09 can implement without further design
- [ ] Canonical ID behavior specified for: DOI absent, DOI arriving later, two records found to be one work
- [ ] `CLAUDE.md` decisions index updated
- [ ] `npm run links:validate` passes; all new anchors resolve

## Handoff

Report: the canonical ID scheme in two sentences; how C1/C2/C3 were recorded; the `decision`/`honors` value lists with the evidence behind each; the field table; anything you could not resolve without a human; and any audit evidence row you found to be wrong.
