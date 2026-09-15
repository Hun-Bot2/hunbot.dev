# Shared Context

Read this once. Every task packet assumes it. Do not re-derive these facts; do not re-read the full ADR set to confirm them.

Keep this file short. If something is true of only one task, it belongs in that task packet.

## 1. Two Systems, One Repository

This repository is the **public** site: `hun-bot.dev`, Astro 5, static-first, deployed to Vercel.

The **private** Research OS is a separate system that does not exist yet. It will live in a separate private repository and, later, on AWS. **No task in this plan creates AWS resources, adds a backend, or adds a runtime dependency to the public site.**

The only permitted coupling is one-directional and asynchronous: the Research OS may emit static artifacts that this repository's build consumes.

## 2. Boundaries That Must Not Move

Enforced by `npm run product:validate`. Treat as immutable.

- **Reader indistinguishability.** The public site must not be able to tell two readers apart. No accounts, no login, no server-stored reader preferences, no per-reader rendering.
- **Static-first.** The core reading experience must not depend on client-side JavaScript.
- **Approved API routes are exactly two:** `src/pages/api/feedback.ts` and `src/pages/api/views.ts`. Adding a third fails CI, and that is the approval gate — never widen the list to make a build pass.
- **No database, auth, payment, or newsletter dependency** in this repository.
- **Public collections are not a candidate store.** Raw HTML, raw PDF text, copied abstracts, embeddings, and unreviewed model output stay out of `src/content/`. Field-name enforcement is in `scripts/validate-library.mjs`.
- **AI may draft; AI may not publish.** `status: "approved"` requires `review.humanReviewed: true`.

## 3. Source-Of-Truth Hierarchy

When sources disagree, higher wins — and say so in your handoff rather than resolving silently.

1. **Code and CI.** What `src/content.config.ts` and `scripts/*.mjs` enforce is what is true today.
2. **Decision records** in `docs/decisions/`. What was decided, even where unbuilt.
3. **`CLAUDE.md`** — code map. Descriptive; can lag reality.
4. **`AGENTS.md`** — rules. Note: §3 says "Test: Not currently defined". That is **stale** — see §6.

A conflict between 1 and 2 is a finding, not a bug to quietly fix. [`readiness-audit.md`](./readiness-audit.md) lists the known ones as C1, C2, C3.

## 4. Taxonomy And Registry Principle

**Taxonomies and registries are data, not code.** No topic, domain, facet value, or venue may appear in a Zod enum, a TypeScript union, a route file, or a component.

The test: adding, renaming, merging, re-parenting, or retiring any entry must be a **content or data-file change with no code change and no route regression.**

Two deliberate exceptions exist and stay:

- `depth` — a closed, ordered set of four values, because it is a scale used for range filtering. A fifth value would change what the other four mean.
- `provenance` — a closed enum of exactly two values (`VERIFIED` / `RADAR`), fixed by ADR. Added 2026-09-14. A third value arriving through a data edit would silently change what TTL deletes, and TTL is destructive.

Anything else claiming to be a third exception is not one.

**Nothing is ever deleted.** Renaming requires an alias. Merging requires `mergedInto`. Retiring sets `status: "archived"` and keeps routes resolving. Published links must not break.

## 5. Schema Compatibility Rules

- **Additive by default.** New fields are optional, or carry a default that leaves existing content valid.
- A change that makes existing content fail validation is a **migration**, not an edit. It needs a migration step and a note in the task handoff.
- **Prefer migration over a permanent normalization layer.** `normalizeCategory()` exists because raw categories were never cleaned; do not add a second such layer.
- Identity fields are **append-only**: once an item ID is written anywhere, it may gain aliases but never change meaning.

## 6. Validation Expectations

Every invariant that matters gets a machine check. Failing in CI beats discovering bad state after cloud persistence.

```bash
npm run content:validate      # source-level; fast; run first
npm run product:validate      # boundary enforcement
npm run links:validate        # requires a prior build
node --test test/             # unit tests — no npm alias yet, see T08
npm run build                 # full build
```

CI runs 13 validators plus tests plus the build on every push and PR. Source-level checks run **before** the build deliberately.

**Add a regression fixture whenever you add or change validator behavior.** A validator with no failing-case test is not yet trustworthy.

## 7. What Is Being Protected From Freezing

The reason this plan exists. Once the Research OS persists data, these become expensive or impossible to change:

- **Item identity** — DynamoDB keys, and the anchor for every note.
- **Provenance** — drives TTL, which is destructive.
- **Topic references** — stored in notes and saved items.
- **Dedup keys** — determine whether two records are one item.
- **Queue payload shape** — a wire format, evolvable only with versioning.

Personal notes are the one unrecomputable asset in the whole system. Anything that could orphan them outranks convenience.

## 8. Cost Constraint Relevant Before AWS

The Research OS targets a permanent **$0.00/month** AWS bill inside recurring free allowances. Two consequences reach back into this repository:

- **Item records must stay small.** DynamoDB charges 1 WCU per KB; a 10 KB item costs 10× a 1 KB item to write. Schema work should keep hot fields compact and push bulky derived data into separate records.
- **Bounded by construction beats bounded by expectation.** Prefer contracts with explicit caps and explicit versions over open-ended maps.

## 9. Future Compatibility That Must Not Be Blocked

Do not build these. Do not foreclose them.

- **Embedding / vector retrieval** — needs a stable canonical ID, language, topic IDs, document type, timestamps, provenance, and a **content hash**. The content hash is the only new field this implies; everything else is already required for other reasons.
- **Citation and idea graphs** — need stable item identity and `same_work_as`. They do **not** need a graph database in this repository.
- **Reading paths** — need a real topic taxonomy and clean blog metadata. Blog metadata cleanup is deliberately **deferred** and is not pre-AWS work.
