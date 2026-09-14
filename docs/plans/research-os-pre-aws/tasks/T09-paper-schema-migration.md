# T09 — Apply Identity And Provenance To The `papers` Schema

| | |
|---|---|
| **Class** | BLOCKER — last item on the critical path |
| **Model** | Sonnet, with **Opus review** before merge |
| **Effort** | **high** |
| **Why this level** | Implementation is mechanical, but it is the plan's most breaking change and the last cheap moment to make it. The Opus review is on the result, not the process |
| **Depends on** | T01, T02, T05, T06 |
| **Owns** | `src/content.config.ts` — **last in the serial chain** — and `src/pages/[lang]/library/[section].astro` |

## Goal

Implement T01's field table on the `papers` collection: canonical identity, an extensible external-ID map including DOI, provenance tier separate from honors, `same_work_as`, and the content hash.

## Why This Is Required

This is where every preceding design becomes enforced schema. Until it lands, the audit's B1 and B2 blockers stand:

- `src/content.config.ts:139` — identity is a hand-written slug.
- `:168-175` — external IDs are fixed columns; **no DOI field exists**.
- `:147` — `decision` conflates acceptance and honors and cannot express "accepted **and** oral".
- `:157-167` — `signals.totalScore` contradicts the ADR (conflict C1, resolved by T01).

**The `papers` collection currently holds one sample record.** A breaking change costs one file today. After DynamoDB holds items keyed on this shape, it costs a data migration that may be impossible for notes.

## Source Of Truth

- `docs/decisions/research-item-identity.md` — T01. **The field table is the specification.**
- `docs/decisions/research-os-data-contract.md` — T02. Which fields belong on the public side.
- `src/data/venues.ts` — T05.
- `src/utils/canonicalization.ts` — T06.

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. T01's field table — read it in full
4. T02's boundary assignment
5. `src/content.config.ts` — lines 126–203 only
6. `scripts/validate-library.mjs:184-243` — existing paper validation
7. `src/content/papers/sample-paper-card.md` — the record to migrate

## Known Code Locations

| Location | Change |
|---|---|
| `src/content.config.ts:139` | `id` → canonical identity per T01 |
| `src/content.config.ts:147` | `decision` → split per C2's resolution |
| `src/content.config.ts:157-167` | `signals` → per C1's resolution |
| `src/content.config.ts:168-175` | `source` → external-ID map, DOI added |
| `scripts/validate-library.mjs:184-243` | Extend validation |
| `src/utils/library.ts:39-41,76-79` | `isApprovedPaper`, `getPaperTldr` — check for breakage |
| `src/data/venues.ts` `getVenueDisplayName()` | **Added 2026-09-14.** T05's migration turned the venue pill into a raw lowercase id (`iclr`). The coordinator fixed it by adding `shortName` to the registry and routing both render sites through `getVenueDisplayName()`. **Apply the same rule to any field you migrate: a stored id is not a display value.** `acceptanceStatus`, `honors`, and `provenance` all render or may render — do not emit raw enum values into the UI |
| `src/pages/[lang]/library.astro` **:214** | Also renders a paper pill. Not in the original audit; now imports `getVenueDisplayName` |
| `src/pages/[lang]/library/[section].astro` **:225** | **Renders `paper.data.decision` as a pill.** Found by T01, not in the original audit. Removing or renaming `decision` breaks the build until this line changes — so this task **must edit a route file** |

## Decisions Already Fixed — Do Not Revisit

Everything in T01 and T02. **This task implements; it does not design.** If T01's table is ambiguous, that is a finding for the handoff and a question for the human — not a decision to make here.

Also fixed: additive-by-default does **not** apply to this task. This is an intentional migration, and it is scheduled here because content volume is one record.

## Decisions You May Make

- Zod construction details and error message wording.
- Validator structure within `validate-library.mjs`.
- Fixture layout.

## Decisions You Must NOT Change

- T01's field table or T02's boundary assignment.
- The human review rule and approved-status invariants.
- Any other collection in the file. T03, T05, and T07 own their parts and have already landed.
- The public rendering of Library paper cards. Schema may change; the page must still render.

## Implementation Steps

1. Read T01's field table in full before editing anything.
2. Apply the schema changes in one pass — identity, external-ID map with DOI, provenance tier, honors.
3. Migrate `sample-paper-card.md` **in the same commit**. The build breaks otherwise.
4. Extend `validate-library.mjs`: canonical ID format, DOI format when present, provenance tier valid, honors independent of tier, `same_work_as` carrying evidence and confidence, content hash present and well-formed.
5. Add fixtures — minimum: conflated provenance and honors; missing canonical ID; malformed DOI; an unevidenced `provenance: VERIFIED` claim; unknown venue ID (T05 interaction).
6. Check every consumer: `grep -rn "papers" src/pages src/components src/utils`. `getPaperTldr`, `isApprovedPaper`, and the Library section route all read this collection.
7. Rebuild and confirm the Library paper section renders in all three languages.
8. Update `CLAUDE.md`'s content-collection description.

## Validators To Run

```bash
npm run library:validate
npm run content:validate
node --test test/
npm run build
npm run library-page:validate
npm run routes:validate
npm run seo:validate
npm run links:validate
npm run product:validate
```

Run **all** of them. This task touches the collection that the Library routes render.

## Failure Cases

- **Implementing a different model than T01's.** If the table seems wrong, stop and report. Do not improve it mid-implementation.
- **Splitting schema and content migration across commits.** Leaves a broken build in history.
- **Breaking the Library paper section.** The most likely regression; `library-page:validate` is the detector.
- **Leaving `totalScore` in place when C1 removed it**, or removing it when C1 kept it. Follow the resolution exactly.
- **Adding `sameWorkAs` or `contentHash` to the public collection.** **Packet corrected 2026-09-14:** earlier revisions of this file listed both as deliverables. That was an error by the coordinator. `research-item-identity.md:465` puts both on the *"must never appear in the public projection"* list, and `:454`/`:457` mark them `corpus`. T09 caught the contradiction, followed Table A as designated, and reported instead of silently choosing — the correct behaviour. They belong to the private canonical item and to T10's enforcement list.
- **A fixed-column external-ID map.** The point of the change is that a new source is data, not a schema edit.
- **Forgetting DOI.** Its absence is the specific defect this task exists to fix.

## Rollback / Migration Concerns

**The highest-risk task in the plan.** Breaking schema change to a rendered collection.

- Content migration is one file. Do it in the same commit.
- Rollback is a single revert while volume stays at one record.
- State plainly in the handoff: **after AWS persistence, this shape is effectively immutable.** That is the entire reason the task is sequenced before AWS rather than after.

## Definition Of Done

- [ ] Every field in T01's table implemented
- [ ] DOI present in an extensible external-ID map
- [ ] Provenance tier expressible independently of honors; validator rejects the conflated form
- [ ] C1's resolution applied exactly as decided
- [ ] `sample-paper-card.md` migrated in the same commit
- [ ] Five regression fixtures pass
- [ ] Library paper section renders in ko, jp, and en
- [ ] All nine validators pass
- [ ] `CLAUDE.md` updated

## Handoff

Report: the final field list with types; the C1/C2 resolutions as implemented; every consumer checked and its result; fixtures added; confirmation the Library section renders in all three languages; and an explicit statement that this shape becomes immutable at first AWS write. **Request Opus review before merge.**
