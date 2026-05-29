# Service Plans Index

This directory keeps product and service plans for the long-term direction of `hun-bot.dev`.

Use this folder for broad service planning: Library scope, media companion workflows, monetization boundaries, public/private content policy, and future product separation. Use [`../plans/000-index.md`](../plans/000-index.md) for smaller implementation plans tied to concrete PRs.

## Current Service Plan Set

| Plan | Status | Scope |
| --- | --- | --- |
| [001-product-service-direction.md](./001-product-service-direction.md) | Source of truth | Full AI-native human-reviewed curation service direction |
| [002-zero-to-hero-roadmap.md](./002-zero-to-hero-roadmap.md) | Draft | Roadmap from personal blog to AI-native knowledge hub |
| [003-editorial-identity-and-information-architecture.md](./003-editorial-identity-and-information-architecture.md) | Implemented | Purpose, navigation, home/about positioning, and public copy |
| [004-library-discovery-and-section-depth.md](./004-library-discovery-and-section-depth.md) | Implemented | Deeper Library section browsing, grouping, relationships, and filters |
| [005-search-and-cross-content-discovery.md](./005-search-and-cross-content-discovery.md) | Implemented | Pagefind search UX, filters, and cross-content discovery |
| [006-project-and-learning-path-surfaces.md](./006-project-and-learning-path-surfaces.md) | Implemented | Static project trails and learning paths across posts/resources/decks |
| [007-content-operations-and-review-workflow.md](./007-content-operations-and-review-workflow.md) | Implemented | Human review workflow, content validation, and publication discipline |
| [008-seo-social-and-feed-growth.md](./008-seo-social-and-feed-growth.md) | Implemented | Translation-aware SEO, feeds, sitemap, social previews, and acquisition surfaces |
| [009-design-system-accessibility-polish.md](./009-design-system-accessibility-polish.md) | Implemented | Shared UI quality, accessibility, mobile, and theme polish |
| [010-performance-media-and-build-budget.md](./010-performance-media-and-build-budget.md) | Implemented | Media optimization, build baselines, Pagefind size, and asset loading |
| [011-security-privacy-and-platform-hardening.md](./011-security-privacy-and-platform-hardening.md) | Implemented | CSP, third-party services, comments, view counter, and privacy hardening |
| [012-youtube-media-companion-workflow.md](./012-youtube-media-companion-workflow.md) | Draft | Static workflow connecting videos, posts, Library cards, papers, and decks |
| [013-service-monetization-and-separation.md](./013-service-monetization-and-separation.md) | Draft | Keep the personal blog as a trust asset while deferring product monetization |

## Redirect Files

The previous top-level and implementation-plan paths now remain as lightweight pointer files:

- [`../product-service-direction.md`](../product-service-direction.md) redirects to `001`.
- [`../plans/008-zero-to-hero-roadmap.md`](../plans/008-zero-to-hero-roadmap.md) through [`../plans/019-service-monetization-and-separation.md`](../plans/019-service-monetization-and-separation.md) redirect to `002` through `013`.

Keep these redirect files small. Edit the canonical service plan files in this directory.

## Planning Rules

- Keep the site Astro-based, multilingual, and static-first.
- Keep the Library broad across Design, Vibe Coding, Developer Docs, AI Papers, Useful Feeds, Decks, and media companion resources.
- Do not introduce database, authentication, upload, payment, newsletter, or ingestion infrastructure without a specific implementation plan and explicit approval.
- Keep public approved content separate from private candidates, raw source material, embeddings, and unreviewed AI output.
- Keep MDX review/publication separate from framework, UI, schema, and infrastructure work.

## Recommended Service Sequence

1. Keep `001` current as the source of truth.
2. Use `002` to choose the next high-level workstream.
3. Use `003` through `011` for static-first blog and Library improvements.
4. Use `012` before building video-specific or media companion surfaces.
5. Use `013` before adding any paid, newsletter, account, or separate service work.
