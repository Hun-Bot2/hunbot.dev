# AWS_READY — Gate Verification Record

**Status: AWS_READY = true, as of 2026-09-16.**

This record closes the exit condition defined in [`README.md`](./README.md#aws_ready-exit-condition).
That section states: *"No line is waivable by assertion."* Accordingly every row below
names the command or committed artifact that demonstrates it. Re-running the commands
in this file is the intended way to re-check the gate; nothing here should be believed
because it is written down.

Verification run: 2026-09-16, branch `research-os-pre-aws-foundation`, at commit `0d80f21`.

---

## Evidence

| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | Canonical item identity defined and stable | `docs/decisions/research-item-identity.md`; `itemId` at `src/content.config.ts` with pattern `^itm-[0-9abcdefghjkmnpqrstvwxyz]{26}$`; `source.externalIds` replaces the three fixed ID columns | PASS |
| 2 | Provenance tier separate from honors | `src/content.config.ts`: `acceptanceStatus` (206), `honors` (207), `presentationFormat` (208), `provenance` (217) are four independent fields; fixture `paper-conflated-honors` proves the conflated form is rejected | PASS |
| 3 | Deduplication deterministic and tested | `src/utils/canonicalization.ts` exports `canonicalizeUrl`, `normalizeTitle`, `computeContentHash`, `normalizeExternalIdentifier`, `deriveDedupKey`; `test/canonicalization.test.mjs` | PASS |
| 4 | Topic references survive rename and merge | `parent`/`order`/`aliases`/`mergedInto` at `src/content.config.ts:355-358`; `npm run taxonomy:validate`; alias resolution shared via `scripts/lib/topic-resolution.mjs` so three validators cannot disagree | PASS |
| 5 | Corpus and personal state separated **in enforcement** | `docs/decisions/research-os-data-contract.md` names every field and its side; `scripts/validate-library.mjs` reads the contract's `x-contract` block at runtime and rejects corpus-shaped, personal-state-shaped and removed-score names at any nesting depth | PASS (T10) |
| 6 | Queue/API payload contract versioned | `contracts/research-os/research-item.schema.json`; `contractVersion` is required and `const`-pinned; INV-05/INV-06 check it | PASS |
| 7 | Vector-readiness fields exist | See **Criterion 7 correction** below | PASS, as corrected |
| 8 | Venue references are registry IDs | `src/data/venues.ts` (6 entries); no bare venue string remains — the only `venue` value in content is `"iclr"`, a registry id | PASS |
| 9 | Every invariant has a failing-case fixture | 40 fixture directories across 5 validators; each new T10 check was watched failing and then restored | PASS |
| 10 | Full validation suite green | `content:validate` 0 · `product:validate` 0 · `node --test test/` 98/98 · `build` 0 · `links:validate` 0 (9,702 links) | PASS |
| 11 | C1/C2/C3 resolved, originals preserved | Recorded in `research-item-identity.md` and `research-os-data-contract.md`. `research-discovery-system.md` has exactly one commit (`318e802`) — it was never rewritten to pretend these distinctions always existed | PASS |

---

## Criterion 7 correction

Criterion 7 as originally written requires *"Canonical ID, `canonicalLanguage`, topic IDs,
document type, timestamps, provenance, **content hash** — all present and validated."*

`contentHash` is **not** present in the public schema, and must not be. It appears on the
`forbiddenInPublicProjection` list in `research-item-identity.md` and is now rejected in
public content by `scripts/validate-library.mjs`.

This is not a gate failure. The criterion was written before **C3** placed the canonical
Research Item in the private Research OS. What this repository owes is the *function and
the contract*, and both exist and are checked:

- `computeContentHash` and `CONTENT_HASH_FIELDS` in `src/utils/canonicalization.ts`
- **INV-12** — `CONTENT_HASH_FIELDS` equals `x-contract.contentHash.fields`, in order
- **INV-13** — `computeContentHash({})` matches the declared `v1:sha256:<hex>` pattern

The hash **value** is corpus data and belongs to the private store. Every other field the
criterion names is present: `itemId`, `canonicalLanguage` (`src/content.config.ts:40`),
`topics`, `contentType`/`depth`, `publishedAt`, `provenance`.

Criterion 7 is restated as: *the content-hash **definition** is implemented, contract-bound
and executable here; the hash **value** lives in the corpus.* Recorded 2026-09-16 rather
than silently marking the row green.

---

## What AWS_READY does and does not mean

**It means** the data contracts an AWS implementation depends on are settled, written down,
and machine-enforced — so the first infrastructure written does not encode a guess.

**It does not mean infrastructure may be created.** That is gated separately and more
strictly by [`research-os-cloud-architecture.md`](../../decisions/research-os-cloud-architecture.md#verification-checklist):
five **blocking** verification items (V1–V5) must be resolved *before any infrastructure
is created at all*. V1 — whether the account is on the Paid plan rather than the Free plan —
is an owner action and is not something an agent can or should perform.

See [`aws-preparation.md`](./aws-preparation.md) for what happens next and who does it.
