# Roadmap

Status: Phase 0 tooling implemented 2026-11-10; the run waits for completed sample notes (D12) ([tools/study-engine/README.md](../../tools/study-engine/README.md)); the Gemini run, labelling and decision are pending. Each phase needs the previous phase's result. Decisions D1–D13 are in [decisions.md](decisions.md).

| Phase | Builds | Main skill learned |
| --- | --- | --- |
| 0 | Gemini baseline + eval set | Structured output, eval design |
| 1 | Parser, layers 1–2, numbering, leak test | AST processing, fixtures |
| 2 | Layer 3 with cache and preview | Provider adapters, retries, caching |
| 3 | `review` + two-track `.apkg` + real Anki checks | Anki internals, integration testing |
| 4 | Two weeks of real use | Measuring a tool honestly |
| 5 | Distilled small model | LoRA, GGUF, llama.cpp grammars, serverless inference |
| 6 | MCP server + review-history loop | MCP, agent SDKs, tracing |
| 7 | Productization decision | — |

## Phase 0 — baseline and eval

1. Verify model ID, tier and quotas ([evaluation.md](evaluation.md) §1).
2. Pick 5 study notes (D11) and write reference points first.
3. Minimal script in `tools/study-engine/`: section split, layer-1 rules, numbered copy, prompt v1, JSON check, back assembly, usage log. No Anki writes.
4. Run rules only vs rules + Gemini (optionally a local model) and decide.
5. Set up eval tooling once: promptfoo (or a plain test script) over the 5 notes; traces to Langfuse free tier or OpenTelemetry to a file.

Done when: reference points, result table, call log and a recorded decision exist.

Implementation was split by difficulty:

| Tier | Scope | Status |
| --- | --- | --- |
| 1 | Engine-only `.env`, note loading (frontmatter, MDX/Markdown AST, sections, numbered units, `card-break`), layer 1–2 rules, heading baseline | Done, offline |
| 2 | Numbered sent copy, prompt v1, Gemini response schema, REST adapter with bounded retry, output validation (types, slots, unit IDs, same section, heading) | Done; not yet called |
| 3 | CLI (`rules`, `preview`, `llm --confirm <digest>`, `sheet`, `score`), response cache, usage log, blind labelling sheet, A/B metrics | Done |

First offline run (7 candidate notes, before D11 limited sources to `study/`): rules produced cards for 5; two free-form technical notes produced none (no definition lists or question headings). `study/rag01.mdx` fails to parse as MDX, so the blog cannot build it either. In `study/ai01.md`, bold-label summary bullets (`**생성 모델:** …`) match the definition rule but are not definitions — a known rule false positive to measure in labelling.

## Phase 1 — parser and rule cards

- Frontmatter and positions preserved; heading tree, code, math, images, links in the AST; notes without frontmatter supported.
- Layer 1 (definition lists, `<Term>`, block math), layer 2 (comment cards, `card-break`).
- Numbered copy with span mapping.
- Leak regression test (`scripts/validate-private-boundary.mjs`, [privacy.md](privacy.md#leak-regression-test-phase-1)) and `.private/` in `.gitignore`.

Acceptance: same fixture → same output; fake markers inside code/quotes/JSX ignored; `Q:`/`A:` errors reported with positions; spans exact with CRLF, BOM, Hangul, emoji; no splitting inside code or math; one bad file does not block others; works offline without a key.

## Phase 2 — LLM layer

- Config-driven provider; card-type schemas; bounded retry.
- Preview and confirmation before sending; `anki.send: false` respected.
- Fronts from templates + slots (particle choice), backs from numbers.
- Cache and failure recovery; usage with `null` for unreported tokens.

Acceptance: unchanged input → 0 calls and 0 duplicate cards; unknown or cross-section numbers rejected; wrong slot names rejected; no endless 429 loop; empty result stored as `empty`; invalid JSON or timeouts never replace existing cards.

## Phase 3 — review, `.apkg`, real Anki

- `study review` with real templates, MathJax and automatic warnings; `broken` marks → excluded from build → logged as fixtures.
- Two note types, track tags, GUIDs from `stable_id`, no deck options.
- Build with the official `anki` package and a persistent build collection (D16); `open` / AnkiConnect `importPackage`. **Done 2026-11-10**: `build [--import]`, decks per D15, verified with the 26.9.4 importer; the `review` preview is still to do.

Prerequisite: a **test Anki profile**; never test on my real collection.

| Scenario | Expected |
| --- | --- |
| `invalid` or `broken` cards present | 0 of them in the `.apkg` |
| First import | One note per valid card; correct note type and tags per track |
| Deck options after import | Attached to my default preset; intervals unchanged |
| Same `.apkg` imported twice | 0 new notes; note/card IDs unchanged |
| Review, then edit MDX, regenerate, re-import | Fields updated; review log, scheduling, card IDs kept |
| Suspended card re-imported | Still suspended (verify) |
| Deleted card re-imported | Comes back (confirms "suspend, don't delete") |
| Card removed from MDX | Tagged `study-engine::removed`; nothing deleted |
| Note-type version change | Behavior recorded; migration step decided |
| Anki closed with `--import` | File created; message shown |
| Math, code | Rendered correctly in Anki (AnkiWeb checked separately) |

Keep before/after evidence (note/card IDs, review log, scheduling) locally.

## Phase 4 — two weeks of real use

Run manually after each lecture. Collect the measures in [evaluation.md](evaluation.md) §4. Add the weekly application-problem loop (D13): `study pack --since 7d` exports the week's concepts, their note text and the cards I keep failing as one Markdown file; I give it to a frontier model (Claude, Codex) in a chat; the answer comes back in a fixed YAML format that `study import` turns into cards, which go through `review` before `build`. Test DB backup/restore and recovery of `stable_id` from Anki. Only then add automation (git hook, launchd or Actions) for `scan` and preview preparation.

Done when: daily records, the A/B comparison with limits stated, and failure-recovery notes exist.

## Phase 5 — distill a small model

D10.

1. Dataset: Gemini cards from Phases 2–4 with labels (`broken` = bad, kept unsuspended = good, my track labels). A few hundred examples.
2. Train LoRA with Unsloth/TRL on the Autocage workstation: Qwen3-0.6B, Qwen2.5-0.5B, Gemma 3 270M. Tasks: track classification and evidence selection.
3. Merge, convert to GGUF (Q4/Q8), run with llama.cpp and a JSON-schema grammar.
4. Serve as the `local` provider; optionally a Lambda container as `remote`, measuring cold start and peak RAM.
5. Evaluate per [evaluation.md](evaluation.md) §5 and write a devlog with the numbers.

## Phase 6 — agent layer

- MCP server (stdio first) exposing `scan`, `make_cards`, `build`; follow the current MCP spec (2026-07-28: stateless, `server/discover`).
- Drive it from one agent SDK (Claude Agent SDK, OpenAI Agents SDK or Google ADK — pick one).
- Review-history loop: read lapses from Anki (AnkiConnect, read-only), propose splitting or regenerating failing cards; proposals go through `review`/`build`.
- OpenTelemetry GenAI spans or Langfuse traces for every run.

## Phase 7 — productization decision

Only after repeated personal benefit. Generic "notes → flashcards" is already free elsewhere ([landscape.md](landscape.md)), so any product would rest on: verbatim backs + two tracks, Korean notes, the review-history loop, or a public card-quality eval. Check name, licenses, provider terms and copyright first. No SaaS, GUI or payments before that.

## Infrastructure

| Option | Use | Status |
| --- | --- | --- |
| Local Mac | Default runner; small-model inference (exits after batch) | Use |
| GitHub Actions cron | Batch job for public notes | Later (Phase 4+) |
| AWS Lambda container | `remote` provider for a 0.5B GGUF; ~$0 idle; 15-min cap; up to 10 GB memory/image | Phase 5 experiment |
| Autocage workstation (GPU) | LoRA training | Phase 5 |
| Modal | Training/inference fallback ($30/month credit) | If needed |
| Oracle Always Free (2 OCPU / 12 GB) | Playground; risk of idle reclamation | Optional |
| Cloudflare Workers / Workers AI LoRA | Not suitable (128 MB; old LoRA bases only) | No |
| Bedrock Custom Model Import, AgentCore, SageMaker, vLLM/SGLang, Kubernetes, A2A | Beyond this workload | Not yet |

## Repository layout (when code starts)

```text
tools/study-engine/
├── src/{cli,parsers,payload,providers,cards,review,export,storage,mcp}/
├── apkg/build_apkg.py         # official anki package (venv in apkg/.venv); Python deps stay here
└── tests/{fixtures,integration}/
```

The blog's root `package.json`, build and deployment stay unchanged. Fixtures are synthetic.

## MVP done when

- Real notes processed and every parse error recorded.
- Unchanged inputs: 0 API calls.
- Re-importing the same cards: 0 new notes and review history kept (test-profile evidence).
- Every back traceable to source numbers; 0 `invalid`/`broken` cards exported; every enabled note's cards present in Anki.
- Hit rate, coverage, review time and token use measured with denominators and unknowns.
- With the API down, rule cards and existing Anki reviews still work.
