# Dependency Graph

## DAG

```
WAVE 0 — design, serial, blocks everything

  T01 ──> T02
   │       │
   │       └──────────────────────────────┐
   │                                      │
WAVE 1 — parallel, no T01 dependency      │
                                          │
  T08 (test harness) ──┐                  │
                       │                  │
WAVE 2 — schema chain, SERIAL on one file │
                       ▼                  ▼
  T03 ──> T07 ──> T05 ──> T09 ──> T10
   │                        ▲
   └──> T04                 │
                            │
  T06 ────────────────────┘
```

Linearized, with the reason for each edge:

| Edge | Reason |
|---|---|
| T01 → T02 | The boundary contract must know what an item's identity and provenance are before it can say which side of the boundary each field lives on |
| T01 → T05 | Venue identity is part of the identity model; the registry shape follows from it |
| T01 → T06 | The dedup key is derived from canonical identity; building it first would guess |
| T01 → T09 | T09 implements the schema T01 designs |
| T02 → T09 | T09 must place fields on the correct side of the corpus/personal boundary |
| T03 → T04 | Topic files cannot use `parent`/`aliases` before the schema accepts them |
| **T05 → T04** | **Added 2026-09-14, correcting this plan.** T04 authors ~36 topic files, and the topic schema carries `venues`. If T04 runs first, every authored file carries free-form venue strings that T05 must then migrate — turning a 2-file migration into a ~37-file one, and creating exactly the metadata debt this plan exists to prevent. T05 establishes the registry first; T04 then authors against registry IDs from the start |
| T03 → T07 | Both edit `src/content.config.ts`; serialized (see contention) |
| T07 → T05 | Same file; serialized |
| T05 → T09 | Same file; serialized |
| T06 → T09 | Dedup functions are referenced by the item contract validator |
| T08 → T03 | T03 adds the first new validator with regression fixtures; the harness should exist first |
| T09 → T10 | T10 hardens boundary checks against the final schema |

## Parallel Groups

| Group | Tasks | Notes |
|---|---|---|
| **P0** | T08 | Safe to start **immediately**, today, with no design input. Touches `package.json` scripts and `test/` only |
| **P1** | T01 | Serial, Opus, blocks the critical path. Design output only |
| **P2** | T02, T06 | Both depend on T01 and on nothing else. Different files — genuinely parallel |
| **P3** | T05, then T04 | **Reordered.** T04 must follow T05, not precede it — see the T05 → T04 edge. T04 is then content authoring with no further blockers |
| **P4** | T07 → T05 → T09 | Serialized by file contention, not by logic |
| **P5** | T10 | Last; validates the finished shape |

**Real parallelism is limited, and the limit is a file rather than the work.** Four tasks need `src/content.config.ts`. Their logic is independent; their edits are not.

## File Contention

| File | Claimed by | Rule |
|---|---|---|
| **`src/content.config.ts`** | T03, T05, T07, T09 | **Strictly serial.** One owner at a time, in the order T03 → T07 → T05 → T09. Each lands a commit and hands off before the next starts. Never two agents concurrently |
| `package.json` (scripts) | T03, T05, T08 | Serial. T08 owns the first edit and establishes the ordering convention |
| `scripts/validate-library.mjs` | T05, T10 | Serial. T05 first |
| `src/utils/library.ts` | T07 | Single owner. Replaces the hard-coded fallback chains at `:61` and `:78` |
| `src/utils/` new files | T06 | New files only; no contention |
| `docs/decisions/` | T01, T02 | New files only; must not rewrite existing records |
| `src/content/topics/` | T04 authors; **T05 migrates `ai-agents.md`** | Serial: T05 first. Both need `ai-agents.md` — T05 for its `venues` array, T04 for `parent`/alias. Running them concurrently would conflict in that file |
| `src/pages/[lang]/library/[section].astro` | T09 | Single owner. **Added 2026-09-14:** line 225 renders `paper.data.decision`; T01 found this and the original audit missed it. T09 is therefore not schema-only |
| `CLAUDE.md` | T03, T05, T07, T09 | Each appends to its own row; serialize with the `content.config.ts` chain — the same agent, same commit |

## Critical Path

```
T01 → T02 → T09 → T10
```

Everything else fits alongside. T01 is the only task that cannot be parallelized or deferred, and it is the only one requiring human input first — see [`README.md`](./README.md#blocking-questions-for-a-human).

## Estimated Implementation Passes

**Four**, assuming the blocking questions are answered before pass 1.

| Pass | Contents | Model mix |
|---|---|---|
| 1 | T08 (now) + T01 | Sonnet + Opus |
| 2 | T02, T06 in parallel | Opus + Sonnet |
| 3 | T03 → T04, T07 | Sonnet |
| 4 | T05 → T09 → T10 | Sonnet, with Opus review of T09 |
