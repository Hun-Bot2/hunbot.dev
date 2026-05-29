# 001: Product Service Direction

This document is the source of truth for the broader direction behind `hun-bot.dev`. It is not an implementation plan by itself. Numbered service plans live in [`docs/service-plans/000-index.md`](./000-index.md), and shorter implementation plans live in [`docs/plans/000-index.md`](../plans/000-index.md).

## Current Product Role

`hun-bot.dev` is a multilingual personal tech blog and public trust asset. It should stay lightweight, static-first, low-cost, and easy to deploy through the current Astro, Content Collections, Tailwind, and Vercel setup.

The long-term direction is larger than a personal blog: an AI-native, human-reviewed knowledge curation service for builders. The blog is the public base where the owner proves judgment through writing, reviewed resources, paper notes, decks, and practical technical interpretation.

## Service Scope

### Library Hub

The Library is the central public hub for curated resources, paper cards, topics, and deck references. It should show approved public data only.

### Design Library

The Design Library should cover:

- UI references
- design systems
- component libraries
- typography
- colors
- icons
- motion and interaction references
- AI design tools
- product inspiration

### Vibe Coding Library

The Vibe Coding Library should cover:

- Claude Code
- Codex
- Cursor
- Windsurf
- MCP
- agentic coding workflows
- prompt and context engineering
- local LLM development workflows

### Modern Developer Docs

The Modern Developer Docs section should cover:

- Astro
- React
- TypeScript
- Python
- Rust
- Docker
- Vercel
- GitHub Actions
- CI/CD
- security
- observability
- system design

### AI Papers Library

The AI Papers Library should provide concise human-reviewed paper cards for builders. It may cover ICLR, ICML, NeurIPS, ACL, EMNLP, CVPR, ICCV, ECCV, MLSys, KDD, WWW, SIGIR, and related venues.

Paper cards should focus on:

- TLDR
- problem
- key idea
- why it matters
- limitations
- who should read it

LLM-generated drafts may be used privately, but public paper summaries must be human-reviewed before publication.

### Useful Feeds And Latest

Useful Feeds should collect sources that are worth checking repeatedly:

- PyTorch Korea community feeds
- AI lab blogs
- framework release notes
- developer tooling updates
- useful technical community links

This does not imply automated feed ingestion yet. Public entries should remain reviewed and curated.

### Presentation And Deck Support

Deck support should stay backendless in the current phase:

- local HTML decks through sandboxed iframes
- PDF fallback links
- optional reviewed PPTX source downloads
- no server-side conversion pipeline
- no browser-side PPTX parser
- no external document viewers

Decks should support paper reviews, experiment notes, technical explanations, build logs, and YouTube companion notes.

### YouTube And Media Connection

The owner plans to publish high-quality technical videos roughly every 3-4 days. The channel should explain AI papers, tools, design references, and developer workflows from the owner's perspective.

The goal is practical technical context and curated judgment, not deep academic paper review. Each video should ideally produce reusable public artifacts:

- a blog companion note
- Library resource cards
- paper cards
- related docs or tool references
- deck references when useful
- future newsletter material

The YouTube channel is an acquisition and trust channel. It is not the first revenue source.

## Monetization Direction

The personal blog should remain the personal trust asset. A future service may become a separate product when the content and audience justify it.

Possible later monetization paths:

- free public Library
- newsletter
- paid reports
- sponsorship
- B2B research or workshops
- future Pro or Team Library service

Do not add payments, accounts, subscriptions, newsletters, or gated content to the personal blog until a separate plan explicitly approves that scope.

## Architecture Direction

The blog should stay static-first.

Approved public content can live in Git and Astro Content Collections. Private candidates, raw PDF text, embeddings, unreviewed LLM output, draft scoring notes, and unpublished candidate data should stay private and outside public content paths.

Dynamic features are deferred:

- comments expansion
- accounts
- saved topics
- payments
- review queues
- public uploads
- ingestion workers
- embeddings or RAG

Possible future infrastructure for a separate dynamic layer may include Turso, Upstash, Turnstile, R2, Cloudflare Workers, or D1. These are future candidates only. They should not be introduced into the current blog without a narrow implementation plan and explicit approval.

Heavy AI work should run locally on the owner's machine where practical. Public pages should publish only reviewed outputs, not private intermediate material.

## PR Sequencing Principles

- Document the product decision before implementing broad features.
- Prefer static schemas, route pages, validation, and docs before dynamic systems.
- Keep the Library broad: Design, Vibe Coding, Developer Docs, AI Papers, Useful Feeds, Decks, and media companion resources.
- Do not over-focus on Design at the cost of the larger knowledge curation service.
- Keep MDX publication and translation review separate from framework, UI, schema, and infrastructure work.
- Add new dynamic capabilities only when static-first content and workflow limits are clear.

## Current Repository Alignment

The current implementation direction aligns with this service if the next PRs stay broad:

- PR01 fixed language-aware blog URLs.
- PR02 added the Pagefind search foundation.
- PR03 added backendless presentation embedding.
- PR04 added Library data schemas for resources, papers, and topics.
- PR05 added a multilingual Library hub and section pages.
- Service plans `002` through `013` should guide the next static-first workstreams.

## Explicitly Deferred

Do not implement these in the current phase:

- database-backed Library
- authentication
- user upload
- comments expansion
- payment or subscription features
- newsletter product integration
- automated paper or feed ingestion
- automatic LLM summarization or translation publication
- vector search, embeddings, or RAG
- private candidate store inside the public repository
- server-side document conversion
- external document viewers

## Related Docs

- [`docs/service-plans/000-index.md`](./000-index.md)
- [`docs/plans/000-index.md`](../plans/000-index.md)
- [`docs/library-data-model.md`](../library-data-model.md)
- [`docs/library-page.md`](../library-page.md)
- [`docs/presentation-embed.md`](../presentation-embed.md)
- [`docs/search.md`](../search.md)
- [`docs/architecture-review.md`](../architecture-review.md)
