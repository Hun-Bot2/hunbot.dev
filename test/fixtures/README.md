# Test Fixtures

Fixtures back regression tests for the `scripts/*.mjs` validators. Each case
lives at `test/fixtures/<validator-name>/<case-name>/` and mirrors, relative
to that directory, the slice of the real repo root the validator reads (for
example `src/content/blog/ko/...`). A test points the validator at the case
directory by running it with that directory as `cwd` — see
`test/helpers/validator-harness.mjs`.

**Fixtures must never live under `src/content/` at the real repo root.**
Astro loads that directory at build time, so a deliberately invalid fixture
placed there would break `npm run build`. Keep every fixture under
`test/fixtures/`, nested under its own case directory instead.

## Adding a case

1. Create `test/fixtures/<validator-name>/<case-name>/` containing only the
   minimal repo-root-relative paths the validator under test reads.
2. Write a test that calls `assertValidatorRejects(scriptPath, fixtureDir,
   messagePattern)` from `test/helpers/validator-harness.mjs`, asserting both
   a non-zero exit code and a specific failure message — not exit code alone,
   since a validator can also fail for an unrelated, uninteresting reason.

## Committed fixtures vs. generated ones

A committed fixture is right when the case is small and its content is the
point — a Markdown file with one bad field, say. It is the wrong shape when the
fixture is mostly a **copy of a file the repository already owns**.

`test/fixtures/validate-research-contract/` used to hold eleven directories,
each a full copy of the ~1,000-line contract schema with one mutation: about
11,600 lines. The size was the smaller problem. Being *stored* copies, they
would have gone on passing unchanged after the real contract's shape moved on —
a suite proving something about a contract the repository no longer had.

Those cases are generated at test time now by
`test/helpers/contract-fixture.mjs`, so each is the current contract plus
exactly one stated mutation, and the generator refuses a mutation that changes
nothing. Prefer generation whenever a fixture would otherwise duplicate a real
file.

Note that a generated fixture must supply **every** repo-root-relative file the
validator reads, not only the one being mutated. `validate-research-contract.mjs`
also reads `docs/decisions/research-item-identity.md`, and treats its absence as
a failure rather than a reason to skip INV-09 — a check that silently stops
running is indistinguishable from one that passes.
