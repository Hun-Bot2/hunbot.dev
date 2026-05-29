# Planning Index

This directory keeps implementation plans before code work starts. Plans should be small, numbered, and scoped to one PR or one reviewable workstream.

## Current Plan Set

| Plan | Status | Scope |
| --- | --- | --- |
| [001-library-section-pages.md](./001-library-section-pages.md) | Implemented | Multilingual Library section listing pages |
| [002-seo-routing-feeds.md](./002-seo-routing-feeds.md) | Implemented | P0/P4 SEO, canonical routes, RSS, sitemap, and OG sequencing |
| [003-content-validation-and-library-governance.md](./003-content-validation-and-library-governance.md) | Implemented | P0/P4 content validation and Library publication safety |
| [004-view-counter-security.md](./004-view-counter-security.md) | Implemented | P1 view counter slug safety, Redis keys, and abuse protection |
| [005-maintainability-refactors.md](./005-maintainability-refactors.md) | Implemented | P2 shared helpers, category handling, math config, and theme persistence |
| [006-ux-performance-growth.md](./006-ux-performance-growth.md) | Draft | P3 pagination and public image performance guidance |
| [007-csp-hardening.md](./007-csp-hardening.md) | Draft | P1 incremental CSP tightening and script inventory |

## Planning Rules

- Keep the site Astro-based, multilingual, and static-first.
- Do not introduce a database, authentication, upload flow, payment, newsletter, or ingestion pipeline unless a later plan explicitly approves it.
- Keep content review separate from UI implementation.
- Keep MDX translation/content commits separate from framework, schema, and UI commits.
- Preserve `/ko`, `/jp`, and `/en` routing behavior.
- Run `npm run build` for route, content collection, MDX, Pagefind, sitemap, or UI changes.

## Recommended Commit Order

1. Library UI polish only.
2. Reviewed translated MDX files.
3. Next product PR from `docs/plans/001-library-section-pages.md`.
4. Correctness and SEO stabilization from `docs/plans/002-seo-routing-feeds.md`.
5. Content safety and validation from `docs/plans/003-content-validation-and-library-governance.md`.
6. Security hardening from `docs/plans/004-view-counter-security.md` and `docs/plans/007-csp-hardening.md`.

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
