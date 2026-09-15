# T03 — Topic Lifecycle Fields And `validate-taxonomy.mjs`

| | |
|---|---|
| **Class** | BLOCKER |
| **Model** | Sonnet |
| **Effort** | **medium** |
| **Why this level** | The design is already fully specified in an approved ADR. This is careful schema and validator implementation with regression fixtures — not novel design |
| **Depends on** | T08 (harness) |
| **Owns** | `src/content.config.ts` — **first in the serial chain** |

## Goal

Implement Discover Phase 1: add `parent`, `order`, `aliases`, and `mergedInto` to the `topics` schema, and add a taxonomy validator wired into `content:validate`.

## Why This Is Required

Notes and saved items in the Research OS reference topic IDs. `aliases` and `mergedInto` are the mechanism that lets a topic be renamed or merged **without breaking stored references**. [`discover-direction.md`](../../../decisions/discover-direction.md) designed this lifecycle in full; `src/content.config.ts:221-246` implements none of it, and no `taxonomy:validate` script exists.

Renaming a topic after DynamoDB holds notes silently breaks references with no migration path.

## Source Of Truth

[`discover-direction.md`](../../../decisions/discover-direction.md) — §Taxonomy, specifically *Shape*, *Lifecycle*, *Derived never declared*, and *Validation*. That section is the specification; implement it, do not redesign it.

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. `docs/decisions/discover-direction.md` — the Taxonomy section only
4. `src/content.config.ts` — **lines 221–248 only**
5. `scripts/validate-library.mjs` — for the validator idiom to match
6. `src/content/topics/ai-agents.md` — the only existing topic

## Known Code Locations

| Location | What is there |
|---|---|
| `src/content.config.ts:221-246` | `topics` collection schema |
| `src/content.config.ts:248` | Collection export |
| `scripts/validate-library.mjs:48-60,244-271` | Existing topic validation and the house validator style |
| `package.json` `content:validate` | The chain to extend |

## Decisions Already Fixed — Do Not Revisit

- `parent: null` **is** what makes a node a domain. There is no separate domain type.
- Nesting is not limited to two levels.
- Nothing is deleted. Rename → alias. Merge → `mergedInto` + `status: archived`. Retire → `status: archived`, routes keep resolving.
- No topic value may appear in a Zod enum, TypeScript union, route, or component.
- The validator must reject: unresolved `parent`, cycles, duplicate IDs, duplicate aliases, an ID colliding with an alias, items referencing non-active/non-merged topics, and archived parents with active children.

## Decisions You May Make

- Validator file structure and error message wording (match the house style).
- Whether `order` defaults or is required.
- How deep alias resolution chains may go, and what happens on a cycle of `mergedInto`.

## Decisions You Must NOT Change

- Existing topic fields. This is **additive** — `ai-agents.md` must still validate unchanged.
- The `slugSafeString` pattern.
- The `reviewPolicy` invariants already enforced (`autoPublish` false, `requireHumanReview` true).
- Any other collection in `src/content.config.ts`.

## Expected Edits

| File | Change |
|---|---|
| `src/content.config.ts` | `topics` schema only — add 4 optional/defaulted fields |
| `scripts/validate-taxonomy.mjs` | **New** |
| `package.json` | Add `taxonomy:validate`; add it to the `content:validate` chain |
| `test/fixtures/taxonomy/` | **New.** Regression fixtures, one per failure mode |
| `test/taxonomy-validate.test.mjs` | **New.** Asserts each fixture fails for the right reason |
| `CLAUDE.md` | Update the topics schema description |
| `docs/decisions/discover-direction.md` | **Do not edit.** Record progress in the handoff instead |

## Implementation Steps

1. Add the four fields, all optional or defaulted, so `ai-agents.md` validates untouched.
2. Write `scripts/validate-taxonomy.mjs` in the idiom of `validate-library.mjs` — `node:assert/strict`, no new dependencies, JSON frontmatter parsing.
3. Implement each rejection case from the ADR's Validation paragraph.
4. Build fixtures: one bad topic file per failure mode, under `test/fixtures/`, **not** under `src/content/` — content there is loaded by the build.
5. Write the test asserting each fixture fails with the expected message.
6. Wire `taxonomy:validate` into `package.json` and into the `content:validate` chain.
7. Update `CLAUDE.md`.

## Validators To Run

```bash
npm run taxonomy:validate
npm run content:validate
node --test test/
npm run build
npm run links:validate
```

## Failure Cases

- **Fixtures under `src/content/topics/`.** The build would load them and fail. They must live under `test/fixtures/`.
- **Making a field required.** Breaks `ai-agents.md` and every future topic; violates the additive rule.
- **Infinite recursion** on a `parent` or `mergedInto` cycle — detect and report, never hang.
- **Adding a dependency.** The repository's validators use only Node built-ins.
- **Touching another collection** in the same file. You own this file for this task; other collections are other tasks.

## Rollback / Migration Concerns

Purely additive: no existing content changes, so rollback is reverting the commit. This is the one task in the plan with no migration risk — a reason to do it early.

## Definition Of Done

- [ ] Four fields added; `ai-agents.md` validates unchanged
- [ ] `scripts/validate-taxonomy.mjs` rejects all seven failure modes listed above
- [ ] A regression fixture exists for each, proven to fail for the right reason
- [ ] `taxonomy:validate` in `package.json` and in `content:validate`
- [ ] `CLAUDE.md` updated
- [ ] All listed validators pass

## Handoff

Report: the four field shapes; the failure modes enforced with their fixture paths; confirmation that `ai-agents.md` is unmodified; and confirmation that `src/content.config.ts` is released for **T07**, which is next in the chain.
