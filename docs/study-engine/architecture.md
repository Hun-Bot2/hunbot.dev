# Architecture

Status: design. Phase 0 parts (parser, rules, payload, Gemini adapter, validation) exist in `tools/study-engine/`; everything else is not implemented yet. Decisions referenced as D1–D13 are in [decisions.md](decisions.md).

## Ownership

| Data | Owner | What the engine may do |
| --- | --- | --- |
| Notes (MDX) | The blog repo | Read only. Never edit, never publish |
| Cards, IDs, caches, usage, review defects | Engine SQLite + files in `.study-engine/` | Read/write locally |
| Scheduling, review history, suspend state | Anki | Only update managed fields via `.apkg` import. Never set deck options |
| Lecture material (PDF, slides) | Outside the repo | Never read by the engine |

## Runtime

- macOS, run on demand (D1). Node.js 24 + TypeScript for parsing, extraction, LLM calls. Python + genanki for the `.apkg` (D4). The two exchange only `cards.json`.
- MDX parsing uses unified/remark/MDX AST; boundary data is validated with Zod. The AST is parsed, never executed (no imports, expressions or components run).
- SQLite: Node's built-in `node:sqlite` if it holds up in Phase 1; no native dependency added up front.
- Tests: `node --test` or Vitest with synthetic fixtures.
- Code lives in `tools/study-engine/`, outside the blog's `src/`; the blog build never imports it.

## Pipeline

```text
MDX ──parsers──▶ layer 1–2 cards (rules, no AI)
   └──payload──▶ sent copy with [S1] [C1] [M1] ──provider──▶ concepts {definition, principle, formula, compare, limitation}
                                                             └──cards──▶ one card per filled slot: front = template
                                                                         back  = original S.. / M..
cards ──review (optional QA)──▶ broken ones excluded
      ──export──▶ cards.json ──genanki──▶ study.apkg ──open / importPackage──▶ Anki
```

| Module | Responsibility |
| --- | --- |
| `cli` | Arguments, previews, safe output |
| `parsers` | Frontmatter, AST, sections, positions, layer 1 (definitions, `<Term>`, block math), layer 2 (comment cards) |
| `payload` | The sent copy: numbering of sentences/code/math and mapping back to source spans |
| `providers` | `gemini`, `local`, `remote` adapters; response validation; usage; retry classification |
| `cards` | Concept slots (D13), front templates and particles, back assembly from numbers, formula choices, machine checks |
| `review` | Local preview with the real Anki templates, automatic warnings, `broken` marks |
| `export` | `cards.json`, genanki call, import |
| `storage` | SQLite migrations, caches, IDs |
| `mcp` (Phase 6) | Exposes `scan` / `make_cards` / `build` as MCP tools |

Parsing and layer 1–2 extraction need no API key and no network. An LLM failure (invalid JSON, empty result, timeout) never deletes or replaces existing cards or Anki notes.

## Change detection and caching

1. Walk only the configured content root; skip hidden/vendor dirs; do not follow symlinks; reject paths escaping the root.
2. Hash the raw file bytes (SHA-256) before any normalization.
3. Keep `observed_hash` (seen by scan) separate from the generation cache key, so a failed generation is retried even if the file is unchanged.
4. A parse error is reported for that file; other files continue.

Generation cache key = SHA-256 of `source_id + document_hash + payload_hash + parser_version + prompt_version + schema_version + provider + model_id + generation_config`. A cache hit makes no API call. An empty result is stored as `empty` (valid outcome, no endless re-calls). Invalid JSON, timeouts and blocked responses never overwrite a successful cache entry. Changing provider or model is a new key.

## Card states

| Object | States |
| --- | --- |
| Card revision | `current`, `superseded` |
| Track | `memorize`, `understand` (from card type) |
| Evidence check | `valid` (numbers exist, same section), `invalid` |
| Review mark | none, `broken` (+ reason) |
| Source | `present`, `removed`, `unknown` |
| Export | `never_exported`, `exported`, `stale` (changed since last `.apkg`) |

`valid` means the back points at real source text; it does not mean the card is correct. Backs are verbatim, so factual errors can only come from the note itself; a front can still ask something the back does not answer. Such cards are suspended in Anki and tagged `study::fix` (D6). `invalid` and `broken` cards are never exported.

## `.apkg` build and import

Requirements, not verified behavior (verified in Phase 3):

1. `build` writes every `current`, `valid`, not-`broken` card to `cards.json`. Definitions and comment cards use `StudyEngine Basic v1`, formulas `StudyEngine Formula v1` (recognition with choices, D13), principle/compare/limitation cards `StudyEngine Explain v1`.
2. No deck options are written; decks use my default preset (D7). genanki writes `.study-engine/exports/study-<date>.apkg` with constant note-type and deck IDs and GUIDs derived from `stable_id`.
3. Every build contains **all** cards (not a delta). Same GUIDs, so re-import does not duplicate.
4. Import with `open` by default; with `--import` and Anki + AnkiConnect running, call `importPackage` on `127.0.0.1` only. If Anki is closed, leave the file and say so.
5. Import never deletes. Cards gone from MDX are exported once more with `study-engine::removed`.
6. Managed fields edited in Anki are overwritten on the next import. Fixes go to MDX or the extractor.

To verify in Phase 3: note/card IDs, review history and **suspend state** survive re-import; Anki's update condition (modification time); behavior after a note-type version change; behavior with the note open in the Anki browser; decks attach to the Default preset.

## Rendering

- Never insert model-returned HTML. Convert an allowed Markdown subset to safe HTML; escape code; block `script`, `iframe`, event handlers, dangerous URIs. Unknown MDX components are dropped and reported.
- Math: convert math nodes to Anki MathJax `\(...\)` / `\[...\]` (never a global `$` replace). KaTeX macro compatibility is checked in real Anki.
- Images: text-only in the MVP. Local images may later be copied into Anki media from an allowlist, named by hash. No remote downloads.

## Providers

| Provider | Use | Notes |
| --- | --- | --- |
| `gemini` | Default | Model ID comes from config, verified against the API; structured output via response schema. No silent fallback to free-form output |
| `local` | After distillation (D10) | llama.cpp + GGUF + JSON-schema grammar; process exits after the batch; `keep_alive: 0` if served by Ollama |
| `remote` | Optional | An OpenAI-compatible endpoint (Lambda container or a VM) reached over an authenticated tunnel |

All providers return the same output contract ([contracts.md](contracts.md#llm-output)). Provider error bodies are never printed raw (they can echo input); only safe codes, HTTP status and job IDs.

## Blog practice page (later)

D8. Not part of the first build.

- A `studySets` content collection (`src/content/study-sets/<post-id>.md`, YAML) holds hand-written application tasks: `post`, `domain`, `items[{ id, kind: derive|apply|debug|design, prompt, keyPoints[], anchors[] }]`. A validator checks the post is published, anchors exist, IDs are unique, and no answer/score/personal fields exist.
- `/{lang}/study/{slug}/` shows the task, hides key points until the answer is submitted, then reveals key points and links to the note's sections, then asks for a self-classification: forgot / misconception / could not apply.
- Answers stay in the page; saving to this device's `localStorage` is opt-in; export is a JSON download. Nothing goes to `/api/*`, analytics, or comments. The page is `noindex` and excluded from the sitemap and Pagefind.
- The only change to existing blog files: a one-line link at the end of `BlogPost.astro` when a set exists, the collection in `content.config.ts`, and a validator script.

## Agent layer (Phase 6)

The pipeline stays deterministic. "Agent" means two things, added after the pipeline works:

1. An MCP server (stdio first) exposing `scan`, `make_cards(note)`, `build`, so any MCP client can drive the engine.
2. A review-history loop: read lapse counts from Anki (AnkiConnect, read-only), find cards I keep failing, and propose splitting or regenerating them. Proposals go through the same `review`/`build` path; the loop never writes to Anki directly.
