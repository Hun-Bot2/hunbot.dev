# T10 — Boundary Validator Hardening

| | |
|---|---|
| **Class** | RECOMMENDED — does not block AWS |
| **Model** | Sonnet |
| **Effort** | **low** |
| **Why this level** | Extends an existing, well-established validator pattern against a boundary that T02 has already defined |
| **Depends on** | T09 |
| **Owns** | `scripts/validate-library.mjs`, `scripts/validate-product-boundaries.mjs` |

## Goal

Make the corpus/personal-state boundary machine-checkable in this repository, so a future agent cannot commit corpus-shaped or personal-state-shaped data into public collections.

## Why This Is Required

`scripts/validate-library.mjs:7-13` already forbids five field names — `rawhtml`, `rawpdftext`, `fullpdftext`, `largecopiedtext`, `copiedabstract`. The pattern works and is proven.

T02 defines a larger boundary: which fields are corpus (local), which are personal state (AWS), and which are public. Nothing enforces it. The boundary is currently a document, and documents do not fail builds.

This does not block AWS — it protects the boundary **after** AWS exists, which is when the pressure to blur it appears.

## Source Of Truth

- `docs/decisions/research-os-data-contract.md` — T02's invariant list is this task's specification
- [`product-boundaries.md`](../../../decisions/product-boundaries.md)
- [`library-data-model.md`](../../../features/library-data-model.md) — *"The public collections are not a private candidate store."*

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. T02's output — **the invariant list specifically**
4. `scripts/validate-library.mjs` — lines 1–35 and 273–297
5. `scripts/validate-product-boundaries.mjs` — the whole file, ~100 lines

## Known Code Locations

| Location | What is there |
|---|---|
| `scripts/validate-library.mjs:7-13` | `forbiddenFieldNames` — the set to extend |
| `scripts/validate-library.mjs:273-297` | `validateNoForbiddenFields` — recursive walker, already correct |
| `scripts/validate-product-boundaries.mjs:41-46` | Approved API route list |
| `scripts/validate-product-boundaries.mjs:14-27` | Forbidden dependency patterns |

## Decisions Already Fixed — Do Not Revisit

- Public collections are not a candidate store.
- No embeddings, vector indexes, raw text, or unreviewed model output in `src/content/`.
- The approved API route list is the approval gate. **Never widen it to make a build pass.**
- No database, auth, payment, or newsletter dependency in this repository.
- Reader indistinguishability.

## Decisions You May Make

- Which field names to add, derived from T02's list.
- Whether to add a size guard on public collection records, and its threshold.
- Error message wording.
- Whether personal-state field names get their own error message distinct from corpus fields — **recommended**, since the fixes differ.

## Decisions You Must NOT Change

- Existing forbidden names or approved routes. **Extend only.**
- The recursive walker's behavior.
- Any schema. T09 owns the final shape and has landed.
- Anything in `src/`.

## Implementation Steps

1. Read T02's invariant list. Implement only invariants checkable **in this repository, today, without AWS**. An invariant about DynamoDB is not one of them; note it in the handoff for the private repository instead.
2. Extend `forbiddenFieldNames` with corpus-shaped names — embeddings, vectors, raw text, candidate scores, unreviewed drafts — and with personal-state names that must never be public, such as reading state, note bodies, and queue state.
3. Consider a record-size guard. A public collection record that grows past a few KB is usually a sign that corpus data has leaked in, and it aligns with the cloud ADR's small-record constraint.
4. Add fixtures for each new forbidden name and for the size guard if added.
5. Verify the existing five names still fail — a regression here would be silent.
6. Update `library-data-model.md` with the extended boundary. **Schema and doc in the same change**, per the plan's rules.

## Validators To Run

```bash
npm run library:validate
npm run product:validate
npm run content:validate
node --test test/
npm run build
```

## Failure Cases

- **Forbidding a name a legitimate field already uses.** Check every existing content file before adding a name.
- **A size guard so tight it rejects a normal record.** Measure the existing records first, then set the threshold.
- **Weakening an existing check** while refactoring. Extend, do not restructure.
- **Trying to validate AWS-side invariants here.** They belong in the private repository; record them in the handoff.

## Rollback / Migration Concerns

Validator-only. The risk is a **false positive** blocking CI on legitimate content. Every new name must be checked against existing files before it is added.

## Definition Of Done

- [ ] `forbiddenFieldNames` extended per T02's list
- [ ] Corpus-shaped and personal-state-shaped names produce distinct messages
- [ ] A fixture exists per new name
- [ ] The original five names still fail, proven by test
- [ ] No existing content file newly fails
- [ ] `library-data-model.md` updated in the same commit
- [ ] All listed validators pass

## Handoff

Report: names added and why each; whether a size guard was added and its threshold with the measurement behind it; fixtures added; confirmation no existing content newly fails; and the list of T02 invariants that are **not** checkable here and must be enforced in the private repository.
