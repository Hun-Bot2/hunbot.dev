# T08 — Test And Validator Harness

| | |
|---|---|
| **Class** | REQUIRED |
| **Model** | Sonnet |
| **Effort** | **low** |
| **Why this level** | Small, well-bounded wiring work with no design content |
| **Depends on** | Nothing — **start immediately** |
| **Owns** | `package.json` scripts, `test/`, `AGENTS.md` §3 |

## Goal

Make the existing test infrastructure discoverable and extensible, and establish the fixture convention every later task uses.

## Why This Is Required

`test/blog-routing.test.mjs` and `test/view-counter.test.mjs` exist and run in CI via `node --test test/` (`.github/workflows/ci.yml:46`). But there is **no `npm test` script**, and `AGENTS.md` §3 states *"Test: Not currently defined"*.

An agent following `AGENTS.md` would conclude there is no test infrastructure and either skip tests or build a parallel one. Five later tasks in this plan add regression fixtures. The convention must exist first, and it must be discoverable from `package.json`.

This is the cheapest task in the plan and it unblocks the quality bar for everything else.

## Source Of Truth

- `.github/workflows/ci.yml` — the real gate
- `test/*.test.mjs` — the existing idiom: `node:test` + `node:assert/strict`, no framework
- `shared-context.md` §6

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. `package.json`
4. `.github/workflows/ci.yml`
5. `test/blog-routing.test.mjs` — 25 lines, the idiom
6. `AGENTS.md` §3 only

## Decisions Already Fixed — Do Not Revisit

- No test framework. `node:test` and `node:assert/strict`, matching the existing files.
- No new dependencies. The repository's tooling is Node built-ins by design.
- Validators use `node:assert/strict` and are invoked as plain scripts.
- CI order is deliberate: source-level checks before the build, output-reading checks after.

## Decisions You May Make

- The `npm test` script's exact definition.
- Whether to add an aggregate script such as `validate:all`, and what it chains.
- The fixture directory layout under `test/fixtures/`.
- The helper signature for "assert this validator rejects this fixture".

## Decisions You Must NOT Change

- **Do not add a test framework**, TypeScript test runner, or any dependency.
- Do not reorder or remove CI steps. You may add one.
- Do not change what any existing validator asserts.
- Do not touch `src/`.

## Expected Edits

| File | Change |
|---|---|
| `package.json` | Add `test`; optionally an aggregate validate script |
| `test/fixtures/` | **New.** Directory plus a short README explaining the convention |
| `test/helpers/validator-harness.mjs` | **New.** Run a validator against a fixture and assert the failure |
| `AGENTS.md` | §3 — correct the stale "Test: Not currently defined" |
| `.github/workflows/ci.yml` | Only if `npm test` should replace the raw `node --test test/` |
| `CLAUDE.md` | Note the test entry point if the file's structure warrants it |

## Implementation Steps

1. Add `"test": "node --test test/"` so local and CI invocation match exactly.
2. Create `test/fixtures/` with a README stating the rule that matters most: **fixtures must never live under `src/content/`**, because Astro loads that directory at build time and a deliberately invalid fixture would break the build.
3. Write the harness helper: given a validator script and a fixture directory, run it as a child process, assert a non-zero exit and that stderr contains an expected message.
4. Prove the harness works by covering one **existing** validator — `validate-blog-content.mjs` is a good choice, since its placeholder rules are already exercised by real content.
5. Correct `AGENTS.md` §3. Keep the correction factual and minimal; do not rewrite the section.
6. Decide whether CI calls `npm test`. If yes, change one line and verify the workflow still parses.

## Validators To Run

```bash
npm test
npm run content:validate
npm run product:validate
npm run build
```

`product:validate` asserts on `package.json` — specifically that `product:validate` itself matches an expected pattern. Confirm your script additions do not disturb it.

## Failure Cases

- **Adding a dependency.** The whole tooling philosophy here is Node built-ins; a test framework would be the first crack.
- **Fixtures under `src/content/`.** Breaks the build. This is the single most likely mistake and the reason the README exists.
- **Breaking `product:validate`** by restructuring `package.json` scripts.
- **Rewriting `AGENTS.md`.** Correct one stale line; nothing else.
- A harness that passes when a validator crashes for an unrelated reason — assert on the **message**, not only the exit code.

## Rollback / Migration Concerns

Additive. No content, no schema, no runtime. Cleanest rollback in the plan.

## Definition Of Done

- [ ] `npm test` runs the existing tests and passes
- [ ] `test/fixtures/` exists with a README stating the `src/content/` prohibition
- [ ] The harness helper exists and covers at least one existing validator
- [ ] `AGENTS.md` §3 corrected
- [ ] `product:validate` still passes
- [ ] CI still parses and passes

## Handoff

Report: the `test` script definition; the fixture convention in two sentences; the harness signature later tasks will call; whether CI changed; and confirmation that `package.json` is released for **T03**.
