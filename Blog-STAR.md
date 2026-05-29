# Blog STAR Summary

This document summarizes the `BLOG` devlog files in `src/content/blog/ko/devlog/BLOG` as precisely as possible. It separates factual implementation from plans or unresolved issues.

## Blog_Develop_01

### Problem
- The blog needed a cleaner article-focused layout after moving away from the previous Three.js-centered structure.
- Header width was constrained by the page wrapper.
- Footer rendering and spacing needed cleanup.
- Dark theme colors and content layout were inconsistent across `/`, `/blog`, and `/about`.

### How I Solved It
- Reworked the header to a full-width sticky layout and moved it outside `.global-wrapper` in the relevant pages.
- Cleaned up the footer by removing duplicate rendering and tightening spacing.
- Defined a dark theme palette in `src/styles/global.css`.
- Removed blue accents and unified link/focus styling with orange tones.
- Added `scroll-margin-top` to headings to avoid sticky-header overlap.
- Adjusted BlogPost and TOC dark-theme styling for consistency.
- Kept Astro’s mostly static rendering model and hydrated only the parts that needed interactivity.

### Result
- The blog adopted a cleaner content-first layout.
- Header and footer layout became more consistent and readable.
- Dark mode contrast improved.
- Core pages gained more visual consistency.
- The initial platform direction was established around Astro, Tailwind CSS, MDX, and Content Collections.

### Implemented Function
- Full-width sticky header with action icons.
- Simplified footer layout.
- Dark theme token setup.
- Improved heading scroll offset behavior.
- Consistent blog/article dark styling.
- Theme toggling through `BaseHead.astro` and site-wide tokenized styling in `global.css`.

## Blog_Develop_02

### Problem
- The site needed multilingual support.
- Existing blog content was not organized by language.
- Content Collection image handling caused path and type errors.
- Public-folder image usage conflicted with the previous image schema and import logic.

### How I Solved It
- Added Astro i18n configuration with `ko`, `jp`, and `en`.
- Built a translation dictionary and `useTranslations()` helper.
- Added a `LanguagePicker` component.
- Reorganized routes under `src/pages/[lang]/`.
- Reorganized content into language-specific folders.
- Moved images from `src/assets` to `public/images`.
- Replaced `image()` schema usage with string-based image paths in `content.config.ts`.
- Simplified image handling in `BaseHead.astro`, `BlogPost.astro`, and `about.astro`.
- Removed legacy `/blog` structure and unused image imports.

### Result
- The site gained language-based routing.
- UI text became translatable across Korean, Japanese, and English.
- Image-related build errors were resolved according to the devlog.
- Content and routing structure became simpler and more predictable.
- Default Korean URLs remained prefix-free while Japanese and English used `/jp/` and `/en/`.

### Implemented Function
- Astro i18n routing.
- Typed translation dictionary system.
- Language picker UI.
- Language-specific blog and about pages.
- Public-image URL based hero image handling.
- Redirect-oriented root/about routing plus per-language blog index and post pages.

## Blog_Develop_03

### Problem
- Switching language inside a post could produce a 404 when that post had no translated counterpart.
- The project still used the old `.vercel.app` domain.
- SEO/discovery metadata needed cleanup.
- Comments were not yet integrated.

### How I Solved It
- Collected alternate-language availability per post in `getStaticPaths`.
- Passed `availableLangs` into the post layout and filtered the language picker to only show existing translations.
- Updated site/domain-related static URLs to `https://hun-bot.dev`.
- Refactored `BaseHead` to compute canonical, `hreflang`, Open Graph locale, feed links, and verification metadata.
- Updated `robots.txt` and sitemap-related output.
- Added `GiscusComments.astro` and rendered a fallback box when required env vars are missing.
- Normalized locale output so `ko/jp/en` map to `ko-KR`, `ja-JP`, and `en-US`.

### Result
- Missing translations no longer appeared as selectable language options.
- The site was reconfigured around `hun-bot.dev`.
- SEO metadata and crawl/discovery configuration were improved.
- Giscus-based comments were added with a safe disabled state.
- Sitemap output was verified against the new domain.

### Implemented Function
- Translation-aware language visibility on post pages.
- Custom domain configuration.
- Improved SEO metadata generation.
- Robots/sitemap updates.
- Giscus comments component with env-based fallback.
- Locale-aware canonical and `hreflang` generation.

## Blog_Develop_04

### Problem
- Code blocks were hard to read in light mode because custom global `code` and `pre` styles overrode Shiki’s theme output.

### How I Solved It
- Removed the forced white-text/dark-background styling behavior.
- Narrowed styling to `.prose pre.astro-code`.
- Kept only visual framing such as spacing, border radius, overflow handling, and border.

### Result
- Code blocks became readable again in light mode.
- Shiki-controlled light/dark syntax colors were preserved.
- Styling responsibility was reduced to layout chrome instead of syntax color overrides.

### Implemented Function
- Scoped code block styling for blog prose content.
- Light-mode-compatible code block presentation.

## Blog_Develop_05

### Problem
- The temporary hit counter increased even during localhost development.
- The current `hits.sh` based approach was not suitable for the intended production behavior.

### How I Solved It
- This entry does not describe a completed implementation.
- It documents an implementation plan centered on serverless functions plus a database or KV-style store.
- It also narrows the design context: the site is hosted on Vercel and built as a static Astro site, so any durable counter would need an external persistence layer or serverless backend.

### Result
- No completed technical result is stated in this devlog.
- The concrete outcome was a direction-setting plan for replacing the existing view-count approach.

### Implemented Function
- None explicitly implemented in this entry.
- Planned: serverless API-based view counter design.
- Planned: tag filtering, category-specific RSS improvements, social share buttons, improved About page, and popular posts based on views.

## Blog_Develop_06

### Problem
- The blog needed a more appropriate view-count implementation than the earlier temporary approach.
- Security headers had not yet been strengthened.
- Localhost views should not increase production counts.

### How I Solved It
- Chose Vercel KV / Upstash Redis for the view counter.
- Installed `@upstash/redis`.
- Added Redis-based view counting logic.
- Added localhost bypass logic so local development reads counts without incrementing them.
- Configured Redis credentials via `import.meta.env`.
- Studied and applied security headers in `vercel.json`, including CSP-related protections and browser restrictions.
- Selected the Tokyo region and free tier in Vercel Storage according to the devlog.

### Result
- A Redis-based view counter was implemented according to the devlog.
- Local development no longer incremented views.
- Security hardening headers were added/configured.
- The prior plan from `Blog_Develop_05` moved into an actual Redis-backed implementation.

### Implemented Function
- Redis-backed pageview API logic.
- Localhost-safe count retrieval behavior.
- Security header configuration in deployment settings.
- `utils/counter.ts` based counter implementation using Upstash Redis credentials.

## Blog_Develop_07

### Problem
- Maintaining Japanese and English blog versions manually was time-consuming.
- The author wanted language-specific blog organization without ongoing translation cost.
- Initial Local LLM translation output was unreliable and introduced fabricated or malformed content.

### How I Solved It
- Designed a local translation workflow using Local LLMs and manual review before commit/push.
- Selected Ollama `gamma2` for English translation and `Qwen2.5:7b` for Japanese translation.
- Set up Grafana-based monitoring for LLM execution visibility.
- Deleted faulty translation outputs and planned to revise the translation logic/prompting.
- Defined an operating flow where Korean source posts are written locally, translated by a local model, stored into `/en` and `/jp`, then manually reviewed before publishing.

### Result
- A translation workflow direction and monitoring setup were established.
- The first translation attempt failed quality checks, so outputs were discarded.
- The devlog does not show a completed high-quality automatic translation pipeline yet.
- The key finding was that raw model output could corrupt frontmatter and invent unrelated content, so guardrails were still missing.

### Implemented Function
- Local LLM translation workflow design.
- Grafana monitoring for LLM runtime observation.
- Model selection for English/Japanese translation.
- Manual review step before commit/push for translated content.

## Blog_Develop_08

### Problem
- Posts were not organized clearly by category.
- "Previous post" links generated incorrect URLs because of dynamic-route and casing behavior.
- Multi-part content needed a series navigation system.

### How I Solved It
- Fixed broken previous-post links by changing the link target to the lowercase slug form.
- Built category pages using Astro dynamic routing and `getStaticPaths`.
- Collected category values from frontmatter and generated `/blog/categories/[category]` pages automatically.
- Added a server-side hashing strategy to assign stable pastel colors to categories without client-side flicker.
- Added `series` and `seriesOrder` metadata handling to group, sort, and navigate related posts.
- Reassigned or normalized category metadata across existing devlog posts so the grouping feature had consistent source data.

### Result
- Category-based browsing became available.
- Previous-post navigation errors were resolved in the described case.
- Series posts gained ordered navigation and progress display.
- Category colors became deterministic at build time without client-side randomness.

### Implemented Function
- Category listing pages.
- Stable category color assignment.
- Series grouping and sorting.
- Previous/next series navigation.
- Progress indicator within a series.
- Automatic category path generation from frontmatter values.

## Blog_Develop_09

### Problem
- Redis-based view counts still increased on every refresh.
- The deployment environment was stateless, so traditional session-based deduplication was a poor fit.

### How I Solved It
- Added IP + TTL-based locking on top of Redis.
- Used `redis.set(historyKey, '1', { nx: true, ex: 3600 })` to permit only a new view within the TTL window.
- Returned the existing count instead of incrementing when the lock already existed.
- Continued using Redis `incr()` for atomic pageview increments.
- Kept the implementation lightweight by extending the existing `views.ts` flow instead of introducing a session store.

### Result
- Refresh-based duplicate counting was reduced by TTL-based deduplication.
- The existing Redis view-count system was improved without introducing a session store.
- Existing view totals remained compatible because the counter still used `incr()` on the same pageview key.

### Implemented Function
- Redis TTL lock for duplicate-view suppression.
- Atomic pageview increment flow.
- Duplicate-response handling for repeated views inside the TTL window.
- Fallback to `0` or the stored count when the duplicate-view lock is already present.

## Blog_Develop_10

### Problem
- When navigating between posts across folders and then switching language, routing stayed fixed to `/ko`, causing users to land on Korean content instead of the selected language version.

### How I Solved It
- This devlog describes the bug, but the provided text does not include the final fix.
- The documented root cause is that cross-post navigation logic hard-coded or preserved the Korean `/ko` prefix when moving between folders and then switching language.

### Result
- No completed result is stated in the devlog text.

### Implemented Function
- None explicitly confirmed in this entry.

## Overall Summary

### Main Problems Encountered
- Layout and theme inconsistency.
- Multilingual routing and translation gaps.
- Content Collection image path/type conflicts.
- Broken links from routing and slug/case mismatches.
- Weak initial view-count implementation.
- Duplicate counting on refresh.
- Incomplete or unreliable automatic translation quality.
- Cross-language post navigation bugs.
- Need for better SEO, comments, category navigation, and series navigation as the blog grew.

### Main Solutions Applied
- Refactored layout and dark-theme styling.
- Introduced Astro i18n and language-aware routing.
- Simplified image handling by switching to `public/images` string paths.
- Filtered language options by actual translated-post availability.
- Added custom domain and SEO metadata improvements.
- Integrated Giscus comments.
- Replaced temporary view logic with Redis-backed counting.
- Added TTL-based deduplication for repeated views.
- Implemented category and series features with static generation.
- Started a Local LLM translation workflow with monitoring.
- Strengthened deployment security with browser security headers in `vercel.json`.

### Main Results
- The blog became more structured, multilingual, and easier to navigate.
- Theme and layout quality improved.
- SEO and domain setup were strengthened.
- View counting moved from a temporary solution to a Redis-based implementation with duplicate suppression.
- Category and series navigation features were added.
- Some entries document plans or identified bugs rather than completed fixes, especially `05`, `07`, and `10`.
- The devlogs show steady movement from a simple personal blog toward a multilingual, SEO-aware, feature-rich static site with selective dynamic capabilities.
