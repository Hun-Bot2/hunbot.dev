# T07 — Facets, Canonical Language, And The Shared Fallback Resolver

| | |
|---|---|
| **Class** | REQUIRED — blocks the first AWS write path |
| **Model** | Sonnet |
| **Effort** | **medium** |
| **Why this level** | Fully specified in an approved ADR, but it replaces two live fallback chains used by rendering code, so it carries real regression risk |
| **Depends on** | T03 (releases `src/content.config.ts`) |
| **Owns** | `src/content.config.ts` — **second in the serial chain** — and `src/utils/library.ts` |

## Goal

Implement Discover Phase 2: add `contentType`, `depth`, `publishedAt`, `canonicalLanguage`, and localized `whyRelevant`; add the facet registry; and replace the two hard-coded language fallback chains with one shared resolver.

## Why This Is Required

None of the five fields exist. `src/data/discoverFacets.ts` does not exist.

`src/utils/library.ts:61` and `:78` still contain literal fallback chains — `value[lang] ?? value.ko ?? value.en ?? value.jp` — exactly as [`discover-direction.md`](../../../decisions/discover-direction.md) predicted when it decided: *"every item declares a `canonicalLanguage`. One rule then covers both surfaces: requested language → item's canonical language → any available."* The ADR's reason: two competing hard-coded chains in one codebase is a durable source of confusion.

`canonicalLanguage` is the key the resolver reads; items persisted without it cannot be rendered consistently later. `publishedAt` is required for the Radar TTL decision in the cloud ADR.

## Source Of Truth

[`discover-direction.md`](../../../decisions/discover-direction.md) — §Facets, §Language Policy, §Build Order → Phase 2. Phase 2's exit conditions are this task's Definition of Done.

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. `docs/decisions/discover-direction.md` — §Facets and §Language Policy
4. `src/content.config.ts` — lines 67–124 (`resources`) and 135–203 (`papers`)
5. `src/utils/library.ts` — the whole file, it is 106 lines
6. `src/data/decks.ts` — the typed data-file idiom

## Known Code Locations

| Location | What is there |
|---|---|
| `src/utils/library.ts:59-62` | `getLocalizedText` — hard-coded chain |
| `src/utils/library.ts:76-79` | `getPaperTldr` — a second hard-coded chain |
| `src/content.config.ts:116-122` | The `summary.ko` requirement that must relax to "canonical language required" |
| `src/content.config.ts:191-201` | The paper equivalent |
| Callers of `getLocalizedText` | `grep -rn "getLocalizedText\|getPaperTldr" src/` before editing |

## Decisions Already Fixed — Do Not Revisit

- `contentType` is a **registry** in `src/data/discoverFacets.ts`, validated by cross-reference — never an enum.
- `depth` is the deliberate exception: a **closed, ordered set of four** — `beginner`, `practical`, `engineering`, `research`. It stays an enum because it is a scale used for range filtering.
- `recency` means original publication date, not the date added.
- `canonicalLanguage` defaults to `ko`, so existing content is unaffected.
- One resolution rule: **requested → canonical → any available.**
- The existing `type` field on resources stays. Do not break it; every Library route reads it.
- Discover items are English-canonical; Library and papers are Korean-canonical.

## Decisions You May Make

- The starting `contentType` registry values, seeded from the ADR's list.
- The resolver's signature and where it lives.
- Whether `whyRelevant` is required on approved items or optional at this stage.

## Decisions You Must NOT Change

- `depth` being a closed enum of exactly four ordered values.
- The existing `type` enum on resources.
- The human review rule or the approved-status invariants — **relax `summary.ko` to canonical-language-required, do not remove it.**
- The `topics` collection. T03 owns that shape; you own the rest of the file.
- `hreflang` behavior. Out of scope, and SEO-critical.

## Implementation Steps

1. `grep -rn "getLocalizedText\|getPaperTldr" src/` first. Know every caller before changing the resolver.
2. Create `src/data/discoverFacets.ts` with the `contentType` registry.
3. Add the five fields to `resources` and the applicable subset to `papers`, all optional or defaulted so existing content validates.
4. Write the shared resolver and replace both chains. The error message at `src/content.config.ts:120` names Korean explicitly and must change with the rule.
5. Extend `scripts/validate-library.mjs`: cross-reference `contentType`, enforce the item contract on approved items.
6. Add fixtures: unknown `contentType`, missing canonical-language summary on an approved item, invalid `depth`.
7. Rebuild and check that all three languages still render Library pages identically for existing content.

## Validators To Run

```bash
npm run library:validate
npm run content:validate
node --test test/
npm run build
npm run library-page:validate
npm run seo:validate
npm run links:validate
```

`library-page:validate` and `seo:validate` are the regression detectors for the resolver change. Do not skip them.

## Failure Cases

- **Changing rendered output for existing content.** The three sample resources and one paper must render identically before and after. This is the task's main risk.
- **A `contentType` enum in Zod.** Violates the data-not-code rule.
- **Making `depth` open.** A fifth value changes what the other four mean.
- **Removing the approved-summary requirement** instead of relaxing it to canonical language.
- **Touching the `topics` collection.** T03's territory.

## Rollback / Migration Concerns

Additive with one behavioral change: the resolver. Existing content defaults to `canonicalLanguage: 'ko'`, which reproduces today's behavior exactly — that is why the default exists. If `library-page:validate` shows any diff, the default is not being applied.

## Definition Of Done

- [ ] Five fields added; all existing content validates unchanged
- [ ] `src/data/discoverFacets.ts` exists; adding a content type is a one-line data change
- [ ] Both hard-coded chains replaced by one resolver; every caller updated
- [ ] The Korean-specific error message at `:120` updated with the rule
- [ ] Three regression fixtures pass
- [ ] Library pages render identically for existing content in all three languages
- [ ] All listed validators pass

## Handoff

Report: fields added per collection; the resolver's location and signature; every call site changed; confirmation that rendered output is unchanged; and confirmation that `src/content.config.ts` is released for **T05**.
