# Decisions

Each entry is the **current** decision. Other documents must agree with this file; if they disagree, this file wins and the other document is fixed. "Changed" lines record what an entry replaced, so the history is visible without keeping outdated text elsewhere.

## D1. Local command, LLM behind a swappable provider (2026-11-09)

The engine is a local CLI run on demand. The LLM is called through a provider adapter: `gemini` (default now), `local` (llama.cpp on my machine), `remote` (a self-hosted endpoint, later).

- Jenkins: rejected — needs an always-on server for a job that runs a few times a week.
- Chat apps + MCP as the pipeline: rejected — a person must start every run.
- GitHub Actions cron: allowed later for the batch job (the repo is public, so minutes are free), but never for notes that should not be public.
- Always-on cloud VMs: rejected for this workload (a few hundred calls a month). See D9.

## D2. Card selection is rules + LLM (2026-11-09)

My notes do not follow one format. On 2026-11-09, of 87 Korean notes under `study/`, `technical_note/`, `devlog/`, 18 had `- **term:** definition` lists, 28 had question-style headings, and 50 (57%) had neither. Non-AI methods (regex, morphological analysis, TextRank/KeyBERT cloze, pre-LLM question generation) cannot decide what is worth remembering or how to ask it. So:

1. **Rules (no AI)** extract what is certain: definition lists, `<Term>`, block math, comment cards.
2. **LLM** handles the remaining sections: it chooses a card type and fills the front's slots.
3. **Checks (no AI)** validate schema, sentence numbers, and limits.

Phase 0 measures whether rules alone are enough; if they are, no API is used.

## D3. Backs are verbatim: sentence-number references (2026-11-09)

The engine numbers sentences, code blocks and block math (`[S12]`, `[C1]`, `[M1]`) in the copy it sends. The LLM returns numbers, never back text. The engine assembles the back from the original source. The source MDX is never modified.

Rejected: writing `<|END|>`-style markers in MDX. `@mdx-js/mdx` 3.1.1 fails on `문장입니다. <|END|>` (`Unexpected character |`), and hand-written markers bring back the "I must format my notes" problem. Tokenizer-reserved strings (`<|...|>`) are not used even in the sent copy. An optional `{/* card-break */}` comment lets me force a boundary.

## D4. Anki import is a generated `.apkg` with stable GUIDs (2026-11-09)

- Node does parsing, extraction and LLM calls and writes `cards.json`; Python **genanki** writes the `.apkg`.
- Each note's GUID derives from its `stable_id`, so re-importing updates notes instead of duplicating them. Note-type and deck IDs are constants; a template change bumps the note-type version.
- Import: macOS `open file.apkg`, or AnkiConnect `importPackage` when Anki is running.
- Import never deletes notes. Cards that disappear from MDX get the tag `study-engine::removed`.
- **MDX is the source of truth.** Managed fields edited inside Anki are overwritten by the next import.
- Changed: replaces the earlier AnkiConnect field-by-field upsert design (no work journal or `unknown_result` recovery needed).

## D5. Visibility facts (2026-11-09)

- Posts under `study/` are published on the blog unless `draft: true`; folders do not hide anything.
- The repository `Hun-Bot2/hunbot.dev` is **public**. Everything committed, drafts included, is readable on GitHub.
- Most of my study notes are already committed. Lecture material (PDFs, slides, screenshots) is not, and must not be.

## D6. Two tracks, Anki mandatory, import everything (2026-11-10)

| Track | What | Card types | Anki note type |
| --- | --- | --- | --- |
| memorize | Definitions, formulas, notation (e.g. the softmax formula, log rules) | `definition`, `formula` | `StudyEngine Basic v1` |
| understand | Relations, reasons, trade-offs (e.g. why high bias / low variance trade off and how to control it) | `why`, `how`, `compare` | `StudyEngine Explain v1` |

- The track follows from the card type. Rule-extracted definitions and block math are always memorize.
- Understand cards: explain aloud or on paper, flip, compare with the key points (my sentences), grade with Again/Hard/Good.
- Tags `study::memorize` / `study::understand`.
- **All** cards that pass machine checks are imported. I clean up in Anki by **suspending** (not deleting — a deleted note returns on the next import because its GUID is gone).
- A bad card: suspend it, tag `study::fix`, fix the cause in MDX or the extractor.
- `stable_id` is assigned when a card is first generated. LLM cards are keyed by `type + hash(normalized back sentences)`, so regenerating from the same evidence continues the same card.
- AnkiWeb sync stays on: cards contain only my own note text, and AnkiWeb collections are private to my account. A separate profile is needed only if school rules forbid keeping course content in a personal cloud.
- Changed: replaces "only human-approved cards are exported" and "Anki is optional/later".

## D7. My Anki defaults; `review` is a QA tool, not an approval gate (2026-11-10)

- The engine never sets scheduling. The `.apkg` carries no deck options, so imported decks use my default preset (button intervals today: Again 10 min, Hard 15 min, Good 1 day, Easy 2 days). Whether genanki decks attach to the Default preset is verified in Phase 3.
- `study review` renders new/changed cards with the real Anki templates and MathJax and shows automatic warnings. I mark broken cards (`broken` + reason). Only those are excluded from `build`; the reasons become test cases for fixing the extractor. Once extraction is stable, `review` is used for new card types or new subjects.

## D8. The blog practice page is for application tasks only, later (2026-11-10)

Recall and explanation practice happen in Anki (D6). A blog page `/{lang}/study/{slug}/` is reserved for tasks that card flipping handles badly: derivations, implementation, debugging, design judgments. It is built only for published notes, keeps answers in the page (optionally this device's `localStorage`), sends nothing to servers or analytics, and is not part of the first build. See [architecture.md](architecture.md#blog-practice-page-later).

## D9. Infrastructure: idle cost about $0 (2026-11-10)

- Default: run locally (or in GitHub Actions later); Gemini via API.
- Small-model inference: llama.cpp with a JSON-schema grammar, locally (a 0.5B Q4 model needs well under 1 GB and exits after the batch) or in an AWS Lambda container (about $0 idle, 15-minute cap).
- Training: LoRA on my own GPU workstation (Autocage); Colab or Modal only if needed.
- Oracle Cloud Always Free is a playground, not the pipeline host: the current allowance is 2 OCPU / 12 GB, A1 is not offered in South Korea North (Chuncheon), and an instance idle under 20% for 7 days may be reclaimed — exactly the pattern of a weekly batch job.
- Not now: Cloudflare Workers for inference (128 MB memory), Workers AI BYO-LoRA (only older Gemma 2 / Llama 2 / Mistral bases), Bedrock Custom Model Import, AgentCore, SageMaker, vLLM/SGLang, Kubernetes.

## D10. Small model: learn by distilling, start with classification (2026-11-10)

The small model is a learning goal, not a cost or privacy necessity (Gemini is cheap and my notes are already public). Order:

1. Collect labels while using Gemini: `review` defects (bad) and cards I keep unsuspended in Anki (good). They are the eval set even if no model is trained.
2. LoRA-fine-tune Qwen3-0.6B / Qwen2.5-0.5B / Gemma 3 270M on the narrow sub-tasks small models do well: track classification (memorize / understand / none) and evidence-sentence selection. Fronts come from templates and headings rather than free generation.
3. Compare with Gemini on the same eval set and publish the numbers in a devlog.

I checked the Gemini API terms for personal use of outputs as training data (2026-11-10).
