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
