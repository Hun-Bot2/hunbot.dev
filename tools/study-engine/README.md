# study-engine (Phase 0 tooling)

Sources are study notes only (`src/content/blog/<lang>/study/`, decision D11); paths default to `src/content/blog/ko/study` and anything else is skipped.

Experiment code for [docs/study-engine/roadmap.md](../../docs/study-engine/roadmap.md) Phase 0: compare **A = rules only** with **B = rules + Gemini** on a few of my notes. Design and decisions: [docs/study-engine/](../../docs/study-engine/).

Runs on Node ≥ 24 directly from TypeScript (type stripping); no build step. Dependencies resolve from the repo's `node_modules` (versions pinned in `package.json`). Nothing here is imported by the blog, and the root `tsconfig.json` excludes `tools/`.

## Setup

`tools/study-engine/.env` (Git-ignored; never the blog's root `.env`):

```sh
GEMINI_API_KEY=...
STUDY_GEMINI_MODEL=<exact API model id>
# STUDY_MAX_CARDS=5
```

## Workflow

Run from the repo root.

```sh
# 0. Write reference concepts BEFORE looking at any output (see "References" below).

# 1. Condition A: rules only (offline)
node tools/study-engine/src/run.ts rules <note files or folders>

# 2. Build the exact prompts that would be sent (offline) and get a plan digest
node tools/study-engine/src/run.ts preview <same paths>
#    read .study-engine/phase0/preview/*.txt

# 3. Condition B: send, only with the digest from step 2
node tools/study-engine/src/run.ts llm <same paths> --confirm <digest>

# 4. Blind sheet: label every card in .study-engine/phase0/labels.tsv
node tools/study-engine/src/run.ts sheet

# 5. Score A vs B against your references
node tools/study-engine/src/run.ts score
```

- `llm` refuses to send unless `--confirm` matches the digest of the current notes, model, prompt version and card limit. Any change to a note or setting changes the digest.
- Responses are cached in `.study-engine/cache/` by note hash + payload hash + prompt/schema version + model; re-running makes no API call.
- Each call appends one line to `.study-engine/logs/usage.jsonl`: time, opaque note ID, model, returned model version, attempts, latency, outcome, token counts (`null` when not reported). No key, prompt, response text or absolute path.
- Notes with `anki.enabled: false` or `anki.send: false`, or that fail to parse, are skipped and listed.

## References

`.local/study-engine/phase0/references.yaml` (private), in the D13 concept schema:

```yaml
notes:
  - path: src/content/blog/ko/study/ai01.md
    concepts:
      - { name: RRF, aliases: [Reciprocal Rank Fusion], expect: [definition, principle, formula, compare] }
      - { name: reranker, expect: [principle, compare] }
```

In `labels.tsv` fill `label` (`keep` / `fix` / `drop`); fix the prefilled `concept` if it does not match your reference name. `key.json` holds which condition produced each card; do not open it before labelling. `score` reports hit rate and slot coverage overall and per slot.

## Layout

| File | Tier | Role |
| --- | --- | --- |
| `src/env.ts` | 1 | Loads this folder's `.env` only |
| `src/text.ts` | 1 | Inline text, sentence split, Korean particles |
| `src/note.ts` | 1 | Frontmatter, MDX/Markdown AST, sections, numbered units, `card-break` |
| `src/rules.ts` | 1 | Layer 1 (definition lists, `<Term>`, block math), layer 2 (comment cards), heading baseline |
| `src/payload.ts` | 2 | Numbered sent copy of what rules did not use |
| `src/llm.ts` | 2 | Prompt v1, response schema, output validation |
| `src/gemini.ts` | 2 | REST adapter with bounded retry; no raw error bodies |
| `src/cards.ts` | 2–3 | Card types, tracks, front templates, back assembly, keys |
| `src/run.ts` | 3 | CLI: rules, preview, llm, sheet, score; cache and usage log |
| `tests/` | — | `node --test tests/*.test.ts` (synthetic fixture only) |

## Known limits (Phase 0)

- Sentence units carry their block's span, not an exact sentence span.
- Backs are rebuilt from extracted text, so inline markup (bold, links) is flattened.
- Comment cards are typed `definition`/memorize regardless of content.
- `.md` comment cards (`<!-- anki -->`) are not read yet.
