# 002: Zero-To-Hero Blog Roadmap

Status: Implemented.

## Goal

Define the next planning sequence for turning `hun-bot.dev` from a multilingual personal tech blog into a focused AI-native knowledge hub for builders.

This plan is a roadmap only. It does not implement routes, schemas, UI, content changes, or automation by itself.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Product Purpose

The blog should become a public technical workspace that makes the site owner's thinking inspectable:

- build logs for real products and experiments
- paper reviews written from a builder's perspective
- design, vibe coding, developer documentation, useful feed, and AI paper resources that are worth revisiting
- presentation materials connected to posts and Library entries
- YouTube companion notes that turn videos into durable references
- future newsletter or report material only after it is reviewed and intentionally productized
- multilingual posts in Korean, Japanese, and English after human review
- static-first public knowledge without a CMS, database, upload flow, or ingestion backend

The personal blog remains the trust asset. A later service or paid product may be separate, but that work is not part of this roadmap unless a numbered plan explicitly approves it.

## Roadmap Levels

### Level 0: Preserve The Base

Keep the site stable while content is reviewed manually.

- Preserve `/ko`, `/jp`, and `/en` route behavior.
- Keep Astro, Content Collections, MDX, Tailwind, Vercel, and Pagefind.
- Keep all new plans static-first unless a later plan explicitly justifies a narrow dynamic path.
- Keep MDX review and translation commits separate from framework, UI, validation, and infrastructure commits.

Covered by current plans:

- `001` is the product direction source of truth.
- `003` through `013` are implemented as static-first workstreams.
- The remaining MDX review set is intentionally outside this roadmap until the owner approves it.

### Level 1: Make The Purpose Obvious

Readers should understand the site's direction within one minute.

- Add clearer site positioning and information architecture.
- Make home, about, blog, Library, projects, and search feel like parts of one system.
- Keep personal tone, but reduce accidental policy or internal process language in public UI.

Detailed plan:

- `003-editorial-identity-and-information-architecture.md`

### Level 2: Make The Library Useful

The Library should move from sample cards to a usable research surface.

- Improve section pages.
- Add lightweight filters and sorting.
- Connect papers, topics, resources, decks, and relevant posts when routes exist.
- Keep approved public data separate from private candidates.

Detailed plan:

- `004-library-discovery-and-section-depth.md`

### Level 3: Make Discovery Work

Search and cross-linking should help readers find posts, papers, decks, and resources across languages and sections.

- Improve Pagefind UI and filters.
- Add topic/tag/category discovery surfaces.
- Create learning paths or project trails when enough content exists.

Detailed plans:

- `005-search-and-cross-content-discovery.md`
- `006-project-and-learning-path-surfaces.md`

### Level 4: Make Publishing Repeatable

The owner should be able to publish reviewed multilingual content without fragile manual checks.

- Add non-invasive content workflow docs and validation.
- Keep AI draft use explicit and human-reviewed.
- Avoid private candidate ingestion, scraping, or automatic publication.

Detailed plan:

- `007-content-operations-and-review-workflow.md`

### Level 5: Make The Site Grow

The public site should be easier to share, crawl, and revisit.

- Complete SEO, RSS, sitemap, and social preview improvements.
- Add only growth features that match the static-first architecture.

Detailed plan:

- `008-seo-social-and-feed-growth.md`

### Level 6: Make The Experience Feel Premium

The site should feel like a carefully maintained technical product, not a pile of pages.

- Improve visual system consistency.
- Raise accessibility quality.
- Tighten mobile ergonomics.
- Keep UI restrained and content-first.

Detailed plan:

- `009-design-system-accessibility-polish.md`

### Level 7: Make It Fast And Safe

Performance and security work should continue incrementally.

- Optimize selected media after review.
- Reduce unnecessary global CSS and JS.
- Continue CSP hardening.
- Keep third-party services deliberate and documented.

Detailed plans:

- `010-performance-media-and-build-budget.md`
- `011-security-privacy-and-platform-hardening.md`

### Level 8: Connect Media Without Product Creep

The owner plans to publish high-quality technical videos roughly every 3-4 days. The site should be ready to turn those videos into reviewed public artifacts without adding a media platform, newsletter backend, or paid product too early.

- Connect videos to blog companion notes, Library cards, paper cards, topics, resources, and decks.
- Keep generated transcripts, raw notes, and private drafts outside public content until reviewed.
- Treat YouTube as a trust and acquisition channel, not the first revenue source.

Detailed plan:

- `012-youtube-media-companion-workflow.md`

### Level 9: Keep Productization Separate

Future monetization should not accidentally turn the personal blog into a heavy full-stack app.

- Keep the free public Library useful.
- Defer payments, accounts, saved resources, private review queues, and team features.
- Plan a separate product or separated product layer only after demand is clear.

Detailed plan:

- `013-service-monetization-and-separation.md`

## Execution Rules

- Pick one numbered plan at a time.
- Do not bundle MDX publication with UI or infrastructure work.
- Prefer validation scripts over heavy test frameworks unless the repository already grows a test setup.
- Every plan should end with `npm run build` unless it is docs-only.
- Any plan that changes routes must verify `/ko`, `/jp`, and `/en`.
- Any plan that adds dynamic infrastructure must explain why static-first content, build-time validation, or local tooling is insufficient.

## Recommended Commit

`docs: add zero-to-hero blog roadmap`
