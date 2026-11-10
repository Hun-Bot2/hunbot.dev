# Data contracts

Status: v0.3 (2026-11-10). Examples are synthetic. Decisions referenced as D1–D10 are in [decisions.md](decisions.md).

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
| `anki.enabled` | `true` under `study/`, else `false` | Whether the note is a source. `false` stops new cards; it does not delete existing Anki notes |
| `anki.deck` | `series`, then `Study` | Target deck |
| `anki.tags` | `[]` | Extra tags merged with the note's `tags` |
| `anki.send` | `true` | Whether layer 3 may send this note to an external provider. `false` = rules only (or a local provider) |

## Extraction layers

| Layer | Source | Card | AI |
| --- | --- | --- | --- |
| 1. Rules | Root list items `- **term:** text` / `- **term**: text`, `<Term term title>`, block math with a preceding sentence | `definition`, `formula` | No |
| 2. Comment cards | `{/* anki ... */}` | As written | No |
| 3. LLM | `##`–`####` sections not used by layers 1–2 | One of the card types below | Chooses type, fills slots, picks back numbers |

Sentences used by layers 1–2 are removed from the layer-3 copy. A section with nothing worth remembering returns an empty list; that is a valid result.

## Card types and tracks

| `type` | Track | Front template | Back |
| --- | --- | --- | --- |
| `definition` | memorize | `{term}란?` | Source sentence(s) |
| `formula` | memorize | `{concept}의 식은?` | The source math node, unchanged |
| `why` | understand | `{subject}은(는) 왜 {phenomenon}? 설명하라.` | Key points = source sentences |
| `how` | understand | `{task}은(는) 어떻게 하나? 설명하라.` | Key points = source sentences |
| `compare` | understand | `{a}와(과) {b}의 관계·차이를 설명하라.` | Key points = source sentences |

Templates are Korean because the notes are Korean; the engine picks the particle (은/는, 와/과) from the final consonant. A heading ending in `?` may be used verbatim as the front (`front_from_heading: true`). Example: the softmax formula is `formula` (memorize); the bias–variance trade-off is `why`/`compare` (understand).

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

- Units: sentence `S`, code block `C`, block math `M`. A list item or table row is one unit.
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

```json
{
  "schema_version": "2.0",
  "source_id": "00000000-0000-4000-8000-000000000001",
  "cards": [
    {
      "type": "why",
      "slots": { "subject": "shim", "phenomenon": "GRUB보다 먼저 실행되나" },
      "front_from_heading": false,
      "back": ["S2", "S3"],
      "heading": "Secure Boot가 하는 일"
    }
  ]
}
```

- `type` is one of the five types; `slots` keys must match that type exactly.
- `back`: 1–4 unit IDs that exist in the sent copy and belong to the same section.
- Slot values are plain text with a length limit. `heading` must equal a real AST heading.
- `schema_version` and `source_id` must echo the request. Unknown fields are rejected. At most `STUDY_MAX_CARDS` (default 5) cards per note.
- JSON wrapped in a code fence is not repaired into success. A model without structured output is not silently used in free-form mode.
- Zod is the final runtime check; the provider JSON Schema and Zod schema are tested for consistency.

## Identifiers

| ID | Assigned / kept |
| --- | --- |
| `card_key` | Layer 1: `def:{normalized term}` or `math:{hash}`; layer 2: `note:{id}`; layer 3: `{type}:{hash(normalized back sentences)}` |
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
| Note types | `StudyEngine Basic v1` (memorize), `StudyEngine Explain v1` (understand); one template each; IDs are code constants |
| Fields | `StableId`, `Front`, `Back`, `Source` |
| Explain template | Front shows the task and "explain first, then flip"; Back shows the key points as a list plus the source |
| Deck | ID derived deterministically from the deck name; no deck options written (D7) |
| GUID | `anki_guid` |
| Tags | Note tags + `study-engine` + `study::memorize` / `study::understand`; `study-engine::removed` for cards gone from MDX |

`StableId` is the first field, so Anki's duplicate check uses it (the browser's sort column shows a UUID — accepted). `Source` holds the note title and heading path, never an absolute path or a private URL.
