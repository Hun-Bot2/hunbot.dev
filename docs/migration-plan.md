# Migration Plan

Reviewed: 2026-05-12

This is a PR-sized implementation plan. It preserves the current Astro/Vercel/static-first architecture. No item should be implemented as part of a documentation-only task.

## P0 Correctness

### PR: Centralize Localized Blog URL Generation

- Problem: `src/utils/blog.ts`, RSS, sitemap, public 3D script metadata, and route files disagree on post URLs. Actual post routes are language scoped, but some helpers emit `/blog/{post.id}/`.
- Expected small diff: Add a tested helper that converts a content ID into `/{lang}/blog/{slug}/`; update direct consumers.
- Likely files changed: `src/utils/blog.ts`, `src/pages/rss.xml.js`, `src/pages/sitemap.xml.ts`, `src/components/BlogCard.astro`, possibly `public/scripts/neuralNetwork.js` if still used.
- Test or verification required: Unit tests for ID-to-URL cases; `npm run build`; manually open representative `ko`, `jp`, and `en` post links; validate RSS and sitemap URLs.
- Rollback strategy: Revert helper and consumer changes together.
- Implementation risk: Medium, because URLs are public contracts and Korean prefix behavior must be verified against generated output.
- Codex action: Defer until explicitly asked to implement.

### PR: Make Post `hreflang` Translation-Aware

- Problem: Post language picker filters unavailable translations, but `BaseHead.astro` emits alternate links for every supported language.
- Expected small diff: Pass available languages into `BaseHead` for post pages and filter alternate links when provided.
- Likely files changed: `src/layouts/BlogPost.astro`, `src/components/BaseHead.astro`, `src/pages/[lang]/blog/[...slug].astro`.
- Test or verification required: Build; inspect rendered head for a post with all translations and a post with only one language; verify `x-default`.
- Rollback strategy: Revert `BaseHead` prop and post layout changes.
- Implementation risk: Medium, because SEO metadata is sensitive.
- Codex action: Defer.

### PR: Fix RSS And Sitemap Route Accuracy

- Problem: RSS and custom sitemap currently generate non-localized post links and include route patterns that do not match the current page tree.
- Expected small diff: Reuse the localized URL helper, remove nonexistent static routes, and decide whether custom sitemap complements or duplicates `@astrojs/sitemap`.
- Likely files changed: `src/pages/rss.xml.js`, `src/pages/sitemap.xml.ts`, possibly `public/robots.txt`.
- Test or verification required: XML validation; sample every generated URL against the local build output; verify `robots.txt` sitemap references.
- Rollback strategy: Revert feed/sitemap files only.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Add Content Frontmatter Validation

- Problem: Any `.md` or `.mdx` under `src/content/blog` is loaded into the collection. Draft notes without frontmatter can break builds.
- Expected small diff: Add a validation script or documented checklist that fails when required frontmatter is missing, without adding dependencies if possible.
- Likely files changed: `package.json`, `scripts/` or `docs/`, maybe no dependencies.
- Test or verification required: Run validation against current content; confirm it flags incomplete drafts and accepts known good posts.
- Rollback strategy: Remove script and package script entry.
- Implementation risk: Low.
- Codex action: Defer.

## P1 Security

### PR: Harden View Counter Input And Redis Keys

- Problem: The view API accepts raw client `slug` values and uses them in Redis keys.
- Expected small diff: Add slug validation, maximum length, and a key builder that rejects invalid values.
- Likely files changed: `src/pages/api/views.ts`, optional helper in `src/utils`.
- Test or verification required: API tests or local curl checks for missing, valid, invalid, and oversized slugs; verify existing post IDs still work.
- Rollback strategy: Revert API helper and route changes.
- Implementation risk: Medium.
- Codex action: Defer until P0 route/feed correctness is scheduled; this is the first recommended security PR.

### PR: Add Lightweight Abuse Protection To View Counter

- Problem: Current one-hour duplicate suppression does not prevent high-volume writes across many slugs or spoofed forwarded IP values.
- Expected small diff: Add short-window rate-limit buckets and safer IP parsing.
- Likely files changed: `src/pages/api/views.ts`.
- Test or verification required: Repeated request checks; Redis key growth monitoring in staging; verify localhost skip behavior remains.
- Rollback strategy: Revert API rate-limit block.
- Implementation risk: Medium.
- Codex action: Defer until slug validation lands.

### PR: Start CSP Tightening With Script Inventory

- Problem: CSP currently allows inline and eval-style scripts. Immediate removal would break current inline component behavior.
- Expected small diff: Document the inline script inventory, move one low-risk inline script to a public/module script, and keep behavior identical.
- Likely files changed: `vercel.json`, one component, one public script if needed.
- Test or verification required: Manual smoke test theme, menus, language picker, TOC, analytics, comments, and view counter.
- Rollback strategy: Restore previous CSP and inline script.
- Implementation risk: High if attempted broadly; low if done incrementally.
- Codex action: Defer.

## P2 Maintainability

### PR: Extract Blog Collection Helpers

- Problem: `getCollection('blog')`, language filtering, sorting, category extraction, and series sorting are duplicated across routes.
- Expected small diff: Add helper functions for common collection operations and update one or two routes first.
- Likely files changed: `src/utils/blog.ts`, selected route files.
- Test or verification required: Build; compare generated route count and post ordering before/after.
- Rollback strategy: Revert route helper usage and helper additions.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Replace Broad Category Normalization

- Problem: `normalizeCategory()` uses substring matching, which can misclassify categories such as words containing `ai`.
- Expected small diff: Replace substring matching with explicit aliases or remove normalization from current UI if it is legacy.
- Likely files changed: `src/utils/blog.ts`, `src/components/BlogCard.astro`, maybe category docs.
- Test or verification required: Unit tests for known categories; visual check where `BlogCard` is used.
- Rollback strategy: Revert function body.
- Implementation risk: Low.
- Codex action: Defer.

### PR: Resolve Math Plugin Duplication

- Problem: `remark-math` and `rehype-katex` are registered in both MDX and top-level markdown config.
- Expected small diff: Test whether one registration path is sufficient for both `.md` and `.mdx`, then remove duplicate registration if safe.
- Likely files changed: `astro.config.mjs`.
- Test or verification required: Build; manually inspect MDX posts with math and any future Markdown posts with math.
- Rollback strategy: Restore both registrations.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Consolidate Theme Persistence

- Problem: Theme code uses `sessionStorage` in `BaseHead.astro` and public theme scripts. Theme state resets after tab close and duplicates behavior.
- Expected small diff: Switch to one storage policy and one source of truth, probably `localStorage`, without changing visual defaults.
- Likely files changed: `src/components/BaseHead.astro`, `public/scripts/themeManager.js`.
- Test or verification required: Manual dark/light toggle persistence across reload, tab close, and system theme changes.
- Rollback strategy: Restore previous storage calls.
- Implementation risk: Low to medium.
- Codex action: Defer.

## P3 UX And Performance

### PR: Add Localized Blog Pagination

- Problem: Localized blog index renders all posts for a language.
- Expected small diff: Add paginated routes while preserving existing first-page URL.
- Likely files changed: `src/pages/[lang]/blog/index.astro`, new route file for page numbers if needed.
- Test or verification required: Build; check first, next, previous, and last pages for each language.
- Rollback strategy: Remove pagination route and restore all-post listing.
- Implementation risk: Medium due route contracts.
- Codex action: Defer.

### PR: Add Search Route Only After URL Fixes

- Problem: Header has a search button, but no search page or index. Search should not be added before URL helpers are correct.
- Expected small diff: Add a localized search page and static index plan, likely with Pagefind in a later dependency PR.
- Likely files changed: Header, new localized search page, package scripts if a search indexer is added.
- Test or verification required: Build; verify search results link to localized canonical post URLs.
- Rollback strategy: Remove search route and package script changes.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Add Image Size Guidelines And Spot Optimization

- Problem: Public images are used directly and may grow deploy size and page weight.
- Expected small diff: Document size guidelines and optimize only obvious large assets in a separate content/media PR.
- Likely files changed: docs, selected public images if explicitly approved.
- Test or verification required: Image inventory and page weight comparison.
- Rollback strategy: Restore original assets from git.
- Implementation risk: Low if scoped.
- Codex action: Defer.

## P4 Growth Features

### PR: Add Per-Language RSS Feeds

- Problem: There is one global RSS feed, and it currently has route correctness issues.
- Expected small diff: After URL helper fixes, add per-language feeds or filter the global feed by language-aware links.
- Likely files changed: `src/pages/rss.xml.js`, possibly new localized RSS routes, `BaseHead.astro`.
- Test or verification required: Validate each feed and confirm links match existing generated pages.
- Rollback strategy: Revert feed routes.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Define Library Content Schema

- Problem: Planned Library/resource curation needs separation between approved public data and private candidate data.
- Expected small diff: Add a draft schema and docs only, without ingestion automation.
- Likely files changed: `docs/`, possibly `src/content.config.ts` only if implementation is requested.
- Test or verification required: Manual schema review against sample approved and candidate entries.
- Rollback strategy: Remove schema/docs changes.
- Implementation risk: Low.
- Codex action: Defer.

### PR: Add Library Validation Before Any Ingestion

- Problem: AI summaries/translations and third-party resource metadata need human review, license, attribution, and source tracking.
- Expected small diff: Add validation rules for approved entries only after schema is agreed.
- Likely files changed: validation script, package script, docs.
- Test or verification required: Fixture-based validation for missing license, attribution, review status, and source URL.
- Rollback strategy: Remove script and package script entry.
- Implementation risk: Medium.
- Codex action: Defer.

### PR: Dynamic OG Images Only After SEO Baseline Is Stable

- Problem: Dynamic OG generation is listed as a future improvement, but current canonical/feed/sitemap issues should land first.
- Expected small diff: Add a static or serverless OG endpoint only when metadata inputs are stable.
- Likely files changed: new OG route, `BaseHead.astro`.
- Test or verification required: Generate sample OG images for all languages; validate social metadata.
- Rollback strategy: Revert route and metadata link.
- Implementation risk: Medium.
- Codex action: Defer.
