# CLI

Status: proposed interface, not implemented. `study` is a working name.

```sh
study scan <content-root> [--dry-run]
study generate <content-root> [--changed-only] [--preview]
study review
study build [--import]
study usage [--last 30d]
```

These five commands are the whole surface. Automation (git hook, launchd, Actions) comes after Phase 4 and may only run `scan` and prepare a send plan; it never sends notes or imports into Anki by itself.

## scan

- `--dry-run`: no network, no source writes, no DB/cache writes, no Anki access. Prints file counts, changed notes, layer-1 and layer-2 card counts, sections that would go to layer 3, unsupported components, and parse errors with positions. Never prints note text.
- Without `--dry-run`: updates the local document state and layer 1–2 cards.
- A read or parse error is reported per file; other files continue; nothing is marked `removed` after an incomplete scan.

## generate

Runs layer 3 for notes that have no successful cache entry for their current key (`--changed-only` is the normal mode). Cache hits make no API call.

Before anything is sent, a preview shows:

- The exact sent copy (with `[S1]` numbering), the opaque note ID, provider, model ID, prompt and schema versions, settings.
- The number of notes and planned calls.
- Notes skipped and why (`anki.enabled: false`, `anki.send: false`, parse error).

In a terminal the run continues only after I confirm. EOF or missing input means no. `--preview` stops after the preview. (A non-interactive signed plan for automation is deferred to Phase 4+.)

After the call: validate JSON, types, slots and unit IDs; assemble fronts and backs; store as current cards. Invalid output or an empty result never replaces existing cards. 429/5xx/network errors back off with jitter; daily-limit or long `Retry-After` stops the batch; at most 3 attempts per job. Provider error bodies are never printed raw.

## review (QA, not approval)

D7. Optional. `build` exports every valid card whether or not `review` was run.

- Opens new or changed cards in a local preview (`.study-engine/review/index.html` or `127.0.0.1`) rendered with the same templates, CSS and MathJax as the Anki note types.
- Shows front, back, source position and automatic warnings: empty back, unbalanced math delimiters, render errors, very long back, cut sentences, unescaped HTML.
- I mark broken cards with a reason (math, cut sentence, front/back mismatch, code, other). Marks go to `.study-engine/review/defects.jsonl` and exclude those cards from `build`. The defects become fixtures for fixing the extractor; once fixed, the next `build` includes the card again.
- "Too easy" or "not needed" are not marked here — that is done by suspending in Anki.

## build

D4, D6. No LLM calls.

- Writes every `current`, `valid`, not-`broken` card to `cards.json`, runs `apkg/build_apkg.py` (official `anki` package, persistent build collection, D16), and writes `.study-engine/exports/study-<date>.apkg`.
- Without `--import`: prints the path and the `open` command. With `--import`: opens it in Anki, or uses AnkiConnect `importPackage` on loopback when available.
- Summary by track: total, new, updated, tagged `removed`. "File created" and "imported" are reported separately, because the engine cannot confirm an import done by hand.

## usage

`--last 30d` aggregates call attempts in the last 30×24 h (stored in UTC, displayed with the timezone): calls, success rate, reported input/output/thinking tokens, latency, cards produced, by provider and model. Cache hits are not calls. Tokens a provider did not report are `null`, never 0; totals show "reported / all". Cost shows "unknown" unless prices are configured.

## Exit codes

`0` done · `1` run or partial failure · `2` argument/config error · `3` confirmation not given / preconditions unmet · `4` quota or connection deferred · `5` ID or evidence conflict. Partial failures print counts and job IDs. Unimplemented commands say so and exit non-zero.
