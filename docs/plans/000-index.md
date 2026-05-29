# Planning Index

This directory keeps implementation plans before code work starts. Plans should be small, numbered, and scoped to one PR or one reviewable workstream.

The broader product/service direction and long-running roadmap now live in [`../service-plans/`](../service-plans/). Use [`../service-plans/001-product-service-direction.md`](../service-plans/001-product-service-direction.md) to keep implementation plans aligned with the full AI-native curation service, not only the Design Library.

## Current Plan Set

| Plan | Status | Scope |
| --- | --- | --- |
| [001-library-section-pages.md](./001-library-section-pages.md) | Implemented | Multilingual Library section listing pages |
| [002-seo-routing-feeds.md](./002-seo-routing-feeds.md) | Implemented | P0/P4 SEO, canonical routes, RSS, sitemap, and OG sequencing |
| [003-content-validation-and-library-governance.md](./003-content-validation-and-library-governance.md) | Implemented | P0/P4 content validation and Library publication safety |
| [004-view-counter-security.md](./004-view-counter-security.md) | Implemented | P1 view counter slug safety, Redis keys, and abuse protection |
| [005-maintainability-refactors.md](./005-maintainability-refactors.md) | Implemented | P2 shared helpers, category handling, math config, and theme persistence |
| [006-ux-performance-growth.md](./006-ux-performance-growth.md) | Implemented | P3 pagination and public image performance guidance |
| [007-csp-hardening.md](./007-csp-hardening.md) | Implemented | P1 incremental CSP tightening and script inventory |

## Service Plans

Service plans are organized separately in [`../service-plans/000-index.md`](../service-plans/000-index.md).

The old plan paths `008` through `019` remain as redirect pointer files so existing references do not break. Edit the canonical files in `docs/service-plans/`, not the redirect files.

## Planning Rules

- Keep the site Astro-based, multilingual, and static-first.
- Do not introduce a database, authentication, upload flow, payment, newsletter, or ingestion pipeline unless a later plan explicitly approves it.
- Keep content review separate from UI implementation.
- Keep MDX translation/content commits separate from framework, schema, and UI commits.
- Preserve `/ko`, `/jp`, and `/en` routing behavior.
- Keep the plan set broad across Design, Vibe Coding, Developer Docs, AI Papers, Useful Feeds, Decks, and media companion resources.
- Run `npm run build` for route, content collection, MDX, Pagefind, sitemap, or UI changes.

## Recommended Commit Order

1. Keep reviewed MDX publication separate from code, UI, validation, and infrastructure commits.
2. Use [`../service-plans/002-zero-to-hero-roadmap.md`](../service-plans/002-zero-to-hero-roadmap.md) to choose the next product workstream.
3. Use service plans `003` through `011` for static-first blog and Library improvements.
4. Add the media companion workflow with service plan `012` before building video-specific pages.
5. Keep monetization and service separation explicit with service plan `013` before adding paid, newsletter, or account features.

## Plan Template

Each numbered plan should include:

- Goal
- Non-goals
- Existing context
- Route/content impact
- Implementation steps
- Validation
- Rollback notes
- Open questions
