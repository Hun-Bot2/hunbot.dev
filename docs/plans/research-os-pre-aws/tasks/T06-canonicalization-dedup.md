# T06 — URL Canonicalization, Content Hash, And Dedup Key

| | |
|---|---|
| **Class** | BLOCKER |
| **Model** | Sonnet |
| **Effort** | **medium** |
| **Why this level** | Pure functions with well-understood rules and heavy test coverage. The design constraints come from T01; the implementation is mechanical and highly testable |
| **Depends on** | T01 |
| **Owns** | New files in `src/utils/` and `test/` — **no file contention** |

## Goal

Implement deterministic URL canonicalization, content hashing, and dedup-key derivation as pure, tested functions.

## Why This Is Required

`grep -rn "canonical\|dedup\|normalizeUrl\|contentHash" src/ scripts/` returns only SEO canonical-link code. **No canonicalization or deduplication logic exists anywhere.**

[`discover-direction.md`](../../../decisions/discover-direction.md) §Ingestion Architecture decides the order: *"Canonicalize the URL first — strip tracking parameters, resolve redirects, normalize host and trailing slash. This catches most duplicates at near-zero cost. Add title normalization next. Reach for embedding similarity only for the cross-source near-duplicates that survive both."*

**The dedup key is the DynamoDB primary key.** Without it, the same work arrives as a paper, a repo, and three blog posts and creates duplicate rows whose notes cannot be merged afterwards.

## Source Of Truth

- [`discover-direction.md`](../../../decisions/discover-direction.md) — §Ingestion Architecture → *Deduplication*
- [`research-discovery-system.md`](../../../decisions/research-discovery-system.md#preprint-to-published-identity) — one entity per work
- T01's output — canonical ID construction

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. T01's output record
4. `docs/decisions/discover-direction.md` — the Deduplication paragraph only
5. `src/utils/blog-routing.ts` — the house idiom for pure, tested utilities
6. `test/blog-routing.test.mjs` — the test idiom

You do **not** need to read `src/content.config.ts`. This task adds no schema.

## Decisions Already Fixed — Do Not Revisit

- Cheapest first: URL canonicalization → title normalization → similarity. Similarity is **out of scope here**.
- One entity per *work*, not per artifact.
- Preprint↔published linking is an evidence-backed claim with confidence, never a silent merge.
- Identity is append-only.
- The content hash must serve two uses: embedding staleness and dedup input.

## Decisions You May Make

- The tracking-parameter list and whether it is a denylist or an allowlist. **Prefer a denylist** — an allowlist would strip meaningful query parameters such as an arXiv version or a paper ID.
- Unicode normalization form for titles.
- Hash algorithm and output encoding, consistent with T02 if that has landed; otherwise propose and flag it.
- Whether redirect resolution is in scope. **Recommendation: no.** It requires network access, which makes the function impure and untestable. Export the *interface* and leave resolution to the caller.

## Decisions You Must NOT Change

- The public site's behavior. These are new, unimported utilities — no route, component, or existing utility calls them yet.
- SEO canonical-link logic in `BaseHead.astro`. Unrelated, despite the shared word.
- T01's identity model.
- No new dependencies. Use `node:crypto`.

## Expected Edits

| File | Change |
|---|---|
| `src/utils/canonicalization.ts` | **New.** URL canonicalization, title normalization, content hash, dedup key |
| `test/canonicalization.test.mjs` | **New.** The bulk of this task |
| `CLAUDE.md` | One row in the utilities table |

## Implementation Steps

1. `canonicalizeUrl(url)` — lowercase scheme and host, strip `www.` only where safe, remove tracking parameters, normalize the trailing slash, sort remaining parameters, drop the fragment. **Preserve meaningful parameters.**
2. `normalizeTitle(title)` — Unicode normalize, case-fold, collapse whitespace, strip punctuation. Must handle Korean and Japanese, which the blog corpus contains and which naive `toLowerCase` handles poorly.
3. `computeContentHash(fields)` — over a stable, explicitly listed field set. **Must exclude volatile fields** such as `lastCheckedAt`, or every fetch invalidates every embedding.
4. `deriveDedupKey(item)` — combining canonical URL, normalized title, and identifiers per T01.
5. Test heavily. Minimum cases: tracking parameters stripped; meaningful parameters kept; `http`/`https`; trailing slash; host case; fragments; Korean and Japanese titles; arXiv abs-vs-pdf-vs-versioned forms; the same work as paper and repo; hash stability across field reordering; hash insensitivity to volatile fields.
6. Document each rule with its rationale in a comment — a future agent will otherwise "simplify" the tracking-parameter list.

## Validators To Run

```bash
node --test test/
npm run build
npm run links:validate
```

`content:validate` is unaffected — this task touches no content.

## Failure Cases

- **Stripping meaningful query parameters.** `?v=2` on a preprint is not tracking. A naive allowlist destroys identity.
- **Including volatile fields in the hash.** Silently invalidates embeddings forever.
- **Network access inside a "pure" function.** Untestable, non-deterministic, and it will be called in a loop.
- **Naive case-folding on CJK.** The corpus is multilingual; test it.
- **Wiring these into the public site.** They are for the private pipeline. No route may import them.

## Rollback / Migration Concerns

New files, nothing imports them; rollback is deletion. But note in the handoff: **once a dedup key is written to DynamoDB, changing these functions re-partitions stored data.** These functions become effectively immutable at first AWS write. The tests are the specification.

## Definition Of Done

- [ ] Four functions exported, pure and dependency-free
- [ ] All minimum test cases above pass, plus CJK coverage
- [ ] Content hash excludes volatile fields, proven by a test
- [ ] No network access in any function
- [ ] Every rule carries a rationale comment
- [ ] `CLAUDE.md` utilities table updated
- [ ] `node --test test/` and `npm run build` pass

## Handoff

Report: function signatures; the tracking-parameter list and why each entry is there; the hash field set and the exclusions; test count and the edge cases covered; and an explicit statement that these functions become immutable at first AWS write.
