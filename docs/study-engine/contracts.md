# Data contracts

Status: v0.3 (2026-11-10). Examples are synthetic. Decisions referenced as D1–D13 are in [decisions.md](decisions.md).

## Note frontmatter

The blog's fields (`title`, `description`, `pubDate`, …) are untouched. The engine optionally reads an `anki` block. The blog schema is not `.strict()`, so the extra key does not break the build (Zod drops it). The engine reads raw MDX, so notes without frontmatter are also readable.

```mdx
---
title: "Gradient Descent"
description: "Synthetic example."
pubDate: "2026-11-09"
anki:
  enabled: true
  deck: "Study::Machine Learning"
  tags: [optimization]
  send: true
---

# Gradient Descent

Parameters move in the direction of the negative gradient of the loss.

## Terms

- **Learning rate:** how far parameters move in one step.

{/* anki id="gd-direction"
Q: Which direction does gradient descent move the parameters?
A: The negative gradient of the loss.
*/}
```

| Key | Default | Meaning |
| --- | --- | --- |
| `anki.enabled` | `true` | Only read for notes under `<lang>/study/`, the only sources (D11). `false` excludes the note; it does not delete existing Anki notes |
| `anki.deck` | `series`, then `Study` | Target deck |
| `anki.tags` | `[]` | Extra tags merged with the note's `tags` |
| `anki.send` | `true` | Whether layer 3 may send this note to an external provider. `false` = rules only (or a local provider) |

## Extraction layers

| Layer | Source | Card | AI |
| --- | --- | --- | --- |
| 1. Rules | Root list items `- **term:** text` / `- **term**: text`, `<Term term title>`, block math with a preceding `X의 식:` sentence (the following list or paragraph = symbol meanings) | `definition`, `formula`, `principle` (question headings) | No |
| 2. Comment cards | `{/* anki ... */}` | As written | No |
| 3. LLM | `##`–`####` sections not used by layers 1–2 | Any of the five slots | Names concepts and fills their slots with unit numbers |

Sentences used by layers 1–2 are removed from the layer-3 copy. A section with nothing worth remembering returns an empty list; that is a valid result.

## Concept slots and cards (D13)

Every card belongs to a concept and fills one of five slots:

| Slot (`type`) | Track | Front | Back |
| --- | --- | --- | --- |
| `definition` | memorize | `{concept}란?` | Definition sentence(s) |
| `principle` | understand | `{concept}은(는) {question}? 설명하라.` (or the question heading verbatim) | Key points = source sentences |
| `formula` | memorize | The formula or code + `이 식은 / 이 코드는 어떤 기법인가?` + choices `①–④` | `**{concept}**` + symbol meanings or key points |
| `compare` | understand | `{a}와(과) {b}: {axis}의 trade-off를 설명하라.` (no axis: `…의 관계·차이를 설명하라.`) | Key points |
| `limitation` | understand | `{concept}의 한계는? 그 한계에서 나온 기술은?` (no successor: `{concept}의 한계는?`) | Limit sentences + `→ **{successor}**` |

- Particles follow how the last character is read in Korean: Hangul batchim; acronyms letter by letter (`RRF는`, `LSTM은`); words by their usual ending (`token이란`, `dense와`); digits (`3이란`).
- Formula choices: up to three other concepts of the same kind (math or code) from the same run in a stable hash order, then the concept's `confusables`; with fewer than two options the front asks `이 식은 / 이 코드는 무엇인가?`.
- Rules fill the same slots: definition lists and `<Term>` → `definition`; `X의 식:` + `$$`, or `X 사용법:` / `X의 코드:` / `X 예시:` + a code block, with the following list or paragraph → `formula`; question headings → `principle` (concept = the heading's subject, `RRF는 왜 …?` → `RRF`).
- Application problems are not a slot: they are written weekly by a frontier model outside the pipeline (D13).

## Comment cards

- `.mdx`: `{/* anki ... */}`. Future `.md`: `<!-- anki ... -->`. HTML comments fail in the current MDX compiler.
- The whole card is inside the comment, so nothing appears on the blog.
- Only root-level flow-expression comments count; examples inside code, quotes, lists or JSX are ignored.
- `id` is optional, unique per note, `[a-z0-9][a-z0-9_-]{0,79}`. Without it the key is the order in the note, and moving the card changes its identity (warned).
- Inside the comment: `Q:` at a line start begins the question, `A:` the answer. Missing or duplicate markers are errors with position.
- `{/* card-break */}` forces a layer-3 section boundary.

## Sent copy and numbering

The provider receives a copy built by the engine, never the source file.

~~~text
## Secure Boot가 하는 일
[S1] Secure Boot는 서명이 확인된 코드만 부팅 과정에서 실행되게 합니다.
[S2] Ubuntu에서는 shim이 먼저 실행되고 GRUB이 뒤를 잇습니다.
[C1] ```bash
mokutil --sb-state
```
~~~

- Units: sentence `S`, code block `C`, block math `M`. A list item is one unit; a table body row is one unit written as `header: value · header: value`. Parsing enables GFM like Astro does.
- Sentences are split only inside text nodes; never inside code, math or inline code.
- Each unit maps to a source span. Images, JSX, imports and link targets are omitted (link text is kept).
- Markers are `[S12]`-style; tokenizer-reserved forms (`<|...|>`) are never used.

## Source coordinates

| Field | Meaning |
| --- | --- |
| `source_id` | UUID assigned when a note is first seen; independent of path, title, content |
| `source_path` | Path relative to the content root; local only |
| `document_hash` | SHA-256 of raw file bytes |
| `heading_path` | Headings from the top to the current section |
| `unit_id` | `S1`, `C1`, `M1`; valid only for one `document_hash` |
| `source_span` | `[start, end)` offsets plus line/column, bound to the document hash |

Offsets are UTF-16 code units; lines and columns are 1-based; positions include the original newlines and frontmatter. Fixtures cover BOM, CRLF, emoji, combining characters and Hangul.

## LLM output

The model returns concepts, not cards (`schema_version` 3.0, prompt `v4-system`: all instructions are sent as Gemini's system instruction and the user message holds only `source_id` and the numbered note; it is told to pick core techniques, mechanisms, APIs and trade-offs before metric names or table entries, and to phrase principle questions in its own words):

```json
{
  "schema_version": "3.0",
  "source_id": "src-6d7d1a8df14b65ad",
  "concepts": [
    {
      "name": "RRF",
      "definition": ["S3"],
      "principle": { "question": "왜 점수 대신 순위를 합치는가", "units": ["S3", "S4"] },
      "formula": { "unit": "M1", "symbols": ["S6", "S7"], "confusables": ["CombSUM"] },
      "compare": [{ "with": "weighted sum", "axis": "척도 의존성", "units": ["S5"] }],
      "limitation": [{ "units": ["S8"], "led_to": "learned fusion" }]
    }
  ]
}
```

- At most `STUDY_MAX_CARDS` (default 5) concepts per note; every slot is optional.
- Each slot's units must exist in the sent copy and stay in one section; `formula.unit` must be an `[M#]` or `[C#]` unit. Two slots of one concept may not use the same sentences (the later one is rejected).
- Names, questions, `with`, `axis`, `led_to` and confusables are plain text (≤ 40–60 chars, no markup).
- A bad slot is dropped with a reason; the rest of the concept survives. A bad envelope (schema, `source_id`) fails the response.
- An LLM card whose key equals a rule card's key is skipped (rules win).
- JSON wrapped in a code fence is not repaired. A model without structured output is not silently used in free-form mode. Zod is the final runtime check.

## Identifiers

| ID | Assigned / kept |
| --- | --- |
| `card_key` | From the concept name: `def:{concept}`, `formula:{concept}`, `principle:{concept}:{hash(question)}`, `compare:{a}|{b}` (sorted), `limitation:{concept}:{hash(units)}`; comment cards `note:{id}` |
| `stable_id` | UUID assigned when `(source_id, card_key)` is first generated; never changes |
| `anki_guid` | Derived deterministically from `stable_id` |
| `revision_id` | New when front, back, deck or tags change |

Similar cards from a regeneration are linked by overlapping back spans; nothing is merged automatically. A moved note keeps its `source_id` through a local path mapping.

## Storage (logical)

| Table | Contents / constraints |
| --- | --- |
| `sources` | ID, current path, observed and processed hashes |
| `generation_jobs` | Cache key UNIQUE, payload hash, status, retry time |
| `cards`, `card_revisions` | `stable_id` UNIQUE, `(source_id, card_key)` UNIQUE, track, unit IDs and spans, content hash |
| `review_marks` | Card revision, `broken`, reason, time |
| `exports` | `.apkg` hash, included revisions |
| `usage_events` | Per call: time, model, tokens (null when not reported), latency, outcome |

If the DB is lost, `stable_id` is recoverable from each Anki note's `StableId` field.

## Anki note types (`.apkg`)

| Item | Value |
| --- | --- |
| Note types | `StudyEngine Basic v1` (definition, comment cards), `StudyEngine Formula v1` (recognition with choices), `StudyEngine Explain v1` (principle, compare, limitation); IDs are code constants |
| Fields | `StableId`, `Front`, `Back`, `Source` |
| Explain template | Front shows the task and "explain first, then flip"; Back shows the key points as a list plus the source |
| Deck | ID derived deterministically from the deck name; no deck options written (D7) |
| GUID | `anki_guid` |
| Tags | Note tags + `study-engine` + `study::memorize` / `study::understand`; `study-engine::removed` for cards gone from MDX |

`StableId` is the first field, so Anki's duplicate check uses it (the browser's sort column shows a UUID — accepted). `Source` holds the note title and heading path, never an absolute path or a private URL.
