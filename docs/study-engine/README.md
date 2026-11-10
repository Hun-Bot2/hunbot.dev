# Study Engine

Status: **design, no code yet** · last updated 2026-11-10

The blog is where I write. Study Engine turns what I wrote into practice. Anki is where I keep it.

Study Engine is a local pipeline that reads my MDX study notes, extracts flashcards (rules first, an LLM only where rules cannot), and imports **all** valid cards into Anki as an `.apkg`. It is also my learning project for current LLM engineering: structured output, evals, distillation of a small model, self-hosted inference, and MCP-based agents.

This folder is the single source of truth. Every document describes the **current** design; superseded ideas are not kept side by side. When a decision changes, the affected documents are edited and [decisions.md](decisions.md) records the change.

## Goals

- Keep writing notes exactly as I do now (MDX, after each 90-minute lecture). No required markers. Optional editor snippets (`fm-study`, `study-skeleton`, `def`, `anki-card`) make notes easier to extract: [docs/content/snippets.md](../content/snippets.md).
- Two tracks of cards: **memorize** (definitions, formulas, notation) and **understand** (relations, reasons, trade-offs explained in my own words).
- Every card's back is my own sentences, verbatim. The LLM only picks sentence numbers.
- Anki is mandatory and uses my existing deck settings. Easy or unwanted cards are suspended in Anki, not filtered beforehand.
- The engine works without any API (rule-extracted cards); the LLM adds coverage.

## Non-goals (for now)

GUI, SaaS, payments, multi-user, OCR, PDF/slide ingestion, a custom spaced-repetition scheduler, publishing lecture material.

## Documents

| Document | Contents |
| --- | --- |
| [decisions.md](decisions.md) | Current decisions (D1–D10) with the reason for each |
| [architecture.md](architecture.md) | Pipeline, modules, card states, `.apkg` import, providers, the blog practice page |
| [contracts.md](contracts.md) | Note frontmatter, extraction layers, card types and tracks, payload numbering, LLM output schema, IDs, storage, Anki note types |
| [cli.md](cli.md) | `scan`, `generate`, `review`, `build`, `usage` |
| [privacy.md](privacy.md) | Public/private boundary, external API rules, Git and build leak checks |
| [evaluation.md](evaluation.md) | Rules-vs-LLM experiment, metrics, the two-week comparison, distillation eval |
| [roadmap.md](roadmap.md) | Phases 0–7 with acceptance criteria, infrastructure choices, what not to learn yet |
| [evidence.md](evidence.md) | Learning-science sources and how they map to features |
| [landscape.md](landscape.md) | What people at the frontier build and sell; fit with my other projects |
| [repository-audit.md](repository-audit.md) | Facts about this blog repo the design depends on, verified facts, open items |
| [config.env.example](config.env.example) | Future configuration keys (no values) |

## Where things live

```text
hun-bot-blog/
├── docs/study-engine/        # these documents (public)
├── tools/study-engine/       # future engine code (not created yet)
├── .local/study-engine/      # private working notes, Git-ignored
└── .study-engine/            # future DB, caches, logs, exports, Git-ignored
```

The engine reads `src/content/blog/**` read-only. It never edits notes and never changes the blog's build, routes, or deployment.

## First step

Phase 0 in [roadmap.md](roadmap.md): a Gemini baseline plus a small hand-labelled eval set, comparing rules-only with rules+LLM on five real notes. Nothing else is built before that result.
