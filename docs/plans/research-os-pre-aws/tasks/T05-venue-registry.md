# T05 — Venue Registry As Data

| | |
|---|---|
| **Class** | REQUIRED — blocks the first AWS write path |
| **Model** | Sonnet |
| **Effort** | **medium** |
| **Why this level** | The registry shape is fully specified in an approved ADR. This is data-file authoring plus cross-reference validation plus a small migration of two call sites |
| **Depends on** | T01 (identity), T07 (releases `src/content.config.ts`) |
| **Owns** | `src/content.config.ts` — **third in the serial chain** |

## Goal

Replace free-form venue strings with references to a venue registry that is data, not code.

## Why This Is Required

`src/content.config.ts:237` declares `venues: z.array(z.string())`, and `src/content/topics/ai-agents.md` stores `["ICLR","ICML","NeurIPS","ACL","EMNLP"]` as bare strings. `papers.venue` at `:145` is a free `z.string()`.

[`research-discovery-system.md`](../../../decisions/research-discovery-system.md#venue-registry) decides: *"venues are data in a registry, never logic distributed through the system"*, with `signalAvailability` as a **required structured field** because a ranking function that reads "this venue publishes no review scores" as "this paper reviewed badly" is broken nearly invisibly. `access` is required and **blocks ingestion**.

Venue strings written into persisted item records become permanent dirty data.

## Source Of Truth

[`research-discovery-system.md`](../../../decisions/research-discovery-system.md) — §Venue Registry, §Quality Signals. The registry entry shape table is the specification.

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. `docs/decisions/research-discovery-system.md` — §Venue Registry only
4. T01's output — how venue identity fits the item model
5. `src/content.config.ts` — lines 135–150 and 221–246
6. `src/data/decks.ts` — the house idiom for a typed data file
7. `scripts/validate-library.mjs:244-271` — existing topic validation to extend

## Known Code Locations

| Location | What is there |
|---|---|
| `src/content.config.ts:145` | `venue: z.string().min(1).optional()` on papers |
| `src/content.config.ts:237` | `venues: z.array(z.string())` on topics |
| `src/content/topics/ai-agents.md` | Five bare venue strings to migrate |
| `src/data/decks.ts` | Pattern for a typed static data file |

## Decisions Already Fixed — Do Not Revisit

- Registry fields: `id`, `name`, `aliases`, `fields`, `type`, `tier` (`CORE`/`EXTENDED`), `acceptanceSource`, `proceedingsSource`, `tracks`, `signalAvailability`, `adapter`, `access`, `provenanceNotes`.
- `signalAvailability` is structured and required, with three states per signal: available / unavailable / not-applicable. **Unavailable is never zero.**
- `access` is required and blocks ingestion. A venue with unverified access cannot be ingested.
- Venue tier is a **prior**, capped so it can never alone move an item into a top slot.
- Coverage is deliberately partial. A field with no venues is a legitimate state.
- No venue acronym may appear in a conditional anywhere.

## Decisions You May Make

- File location and format — a typed `.ts` in `src/data/`, or a content collection. Justify in one line. **Prefer `src/data/`**: venues are not published pages, and a collection adds routes and build cost for nothing.
- Which venues to author first. **Author only what is needed** — the ADR's MVP is IEEE VIS plus the gold-set closure. A hundred entries now is the sequencing error the ADR's principle 11 forbids.
- The `access` vocabulary, which must include an explicit *unverified* state.

## Decisions You Must NOT Change

- The registry field set.
- The "no venue in code" rule.
- Any collection other than `topics` and `papers` in `src/content.config.ts`.
- T01's identity model.

## Expected Edits

| File | Change |
|---|---|
| `src/data/venues.ts` | **New.** The registry |
| `src/content.config.ts` | `papers.venue` and `topics.venues` become registry-ID references |
| `scripts/validate-library.mjs` | Cross-reference every venue reference against the registry |
| `src/content/topics/ai-agents.md` | Migrate five strings to registry IDs |
| `src/content/papers/sample-paper-card.md` | Migrate `venue: "ICLR"` |
| `test/fixtures/venues/` + test | Regression fixtures |
| `CLAUDE.md` | Add `venues.ts` to the static data table |

## Implementation Steps

1. Author `src/data/venues.ts` with the full field shape and only the venues currently referenced, plus IEEE VIS.
2. Mark `access` as **unverified** for every entry. Verification is an external task, not this one. Do not guess licensing.
3. Change the two schema fields to registry references, with a validator cross-check rather than a Zod enum — an enum would put venue values in code.
4. Migrate the two existing content files in the **same commit** as the schema change, or the build breaks between commits.
5. Add cross-reference validation and alias resolution to `validate-library.mjs`.
6. Add fixtures: unknown venue ID, duplicate registry ID, ID colliding with an alias, missing `signalAvailability`.
7. Update `CLAUDE.md`.

## Validators To Run

```bash
npm run library:validate
npm run content:validate
node --test test/
npm run build
npm run links:validate
```

## Failure Cases

- **A Zod enum of venue IDs.** Violates the data-not-code rule. Cross-reference instead.
- **Guessing `access`.** The ADR marks all publisher access as VERIFY. Recording a guess as fact is worse than recording unverified.
- **Authoring 70+ venues.** Scope inflation, explicitly forbidden by the ADR's build order.
- **Splitting schema and content migration across commits.** Leaves a broken build in history.
- **Treating a missing signal as zero** anywhere in the validator.

## Rollback / Migration Concerns

This is the first genuinely **breaking** schema change in the plan: existing content fails validation until migrated. Two content files are affected. Do both in one commit with the schema. Rollback is a single revert — true only while content volume is this low, which is the argument for doing it now.

## Definition Of Done

- [ ] `src/data/venues.ts` with the full field shape
- [ ] No venue acronym appears in any conditional
- [ ] `papers.venue` and `topics.venues` are registry references
- [ ] Both existing content files migrated in the same commit
- [ ] Validator cross-references IDs and aliases
- [ ] Four regression fixtures pass
- [ ] `access` is `unverified` for every entry, with no guessed values
- [ ] `CLAUDE.md` updated; all validators pass

## Handoff

Report: registry location and why; venues authored; the two migrated files; failure modes now enforced; and confirmation that `src/content.config.ts` is released for **T09**.
