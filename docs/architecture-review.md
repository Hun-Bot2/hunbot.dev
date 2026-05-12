# Architecture Review

Reviewed: 2026-05-12

## Current Architecture Summary

`hun-bot.dev` is a multilingual personal tech blog built on Astro 5, MDX, Astro Content Collections, Tailwind CSS, and the Vercel serverless adapter. The intended model is static-first: most pages are generated from filesystem content, and dynamic behavior is limited to a small page-view API backed by Redis-compatible serverless persistence.

The stack to preserve:

- Astro pages, layouts, and components in `src/pages`, `src/layouts`, and `src/components`.
- Markdown/MDX blog content loaded from `src/content/blog`.
- Public images, PDFs, fonts, and standalone browser scripts under `public/`.
- Vercel deployment with security headers in `vercel.json`.
- Lightweight external services for analytics, comments, fonts, CSS, and view counts.

## Route Structure

Current route files:

| Route file | Purpose | Notes |
| --- | --- | --- |
| `src/pages/index.astro` | Root redirect | Redirects to `/ko/`. |
| `src/pages/about.astro` | Root about redirect | Redirects to `/ko/about/`. |
| `src/pages/[lang]/index.astro` | Localized home | Static paths for `ko`, `jp`, `en`; shows latest posts for that language. |
| `src/pages/[lang]/about.astro` | Localized about | Static paths for `ko`, `jp`, `en`; text comes from `src/i18n/ui.ts`. |
| `src/pages/[lang]/blog/index.astro` | Localized blog index | Lists all posts for one language; no pagination. |
| `src/pages/[lang]/blog/[...slug].astro` | Localized post detail | Generates paths from content IDs. |
| `src/pages/[lang]/blog/categories.astro` | Category index | Builds category counts per language. |
| `src/pages/[lang]/blog/categories/[category].astro` | Category detail | Generates one static path per language/category pair. |
| `src/pages/[lang]/blog/tags.astro` | Tag index | Builds tag counts per language. |
| `src/pages/rss.xml.js` | Global RSS feed | Currently emits links that do not match localized post route shape. |
| `src/pages/sitemap.xml.ts` | Custom sitemap | Currently emits non-localized post URLs and some routes that do not exist. |
| `src/pages/api/views.ts` | Page-view API | `prerender = false`; uses Redis-compatible REST persistence. |

Important route convention: `astro.config.mjs` sets `defaultLocale: 'ko'` with `prefixDefaultLocale: false`, but much of the site currently links to `/ko/...` explicitly. Future work must verify actual generated output before assuming Korean routes are prefix-free.

## Content And Data Flow

1. `src/content.config.ts` defines one `blog` collection using `glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' })`.
2. Content IDs include the language folder prefix, for example `ko/devlog/BLOG/Blog_Develop_01`.
3. Route code filters posts by `post.id.startsWith(`${lang}/`)`.
4. Post slugs are usually created by removing the language prefix from `post.id`.
5. Post pages render through `src/layouts/BlogPost.astro`, which also attaches metadata, view counts, table of contents, series navigation, and comments.

Required frontmatter:

- `title`
- `description`
- `pubDate`

Optional frontmatter:

- `updatedDate`
- `heroImage`
- `tags`
- `category`
- `series`
- `seriesOrder`

Content maintainability risks:

- Any `.md` or `.mdx` file under `src/content/blog` must satisfy the schema. The current active note at `src/content/blog/ko/tech/공부.mdx` appears to be raw notes without frontmatter and should be treated as draft content unless completed before build.
- Category values are free-form, so category URLs, labels, and grouping can drift.
- Some generated or translated content appears to contain repeated frontmatter-like blocks inside the body. This may be intentional documentation, but it is worth validating before publication.

## Rendering Model

- Astro renders the blog and localized pages statically from content collections.
- The Vercel adapter is configured as serverless, mainly to support API routes.
- `src/pages/api/views.ts` opts out of prerendering and runs dynamically.
- Client-side behavior comes from inline scripts in Astro components and standalone scripts under `public/scripts`.

Preserve the static-first model. Do not expand dynamic/serverless behavior unless a specific feature requires it.

## I18n Model

Languages:

- `ko`
- `jp`
- `en`

Primary i18n sources:

- `astro.config.mjs` for Astro locale configuration.
- `src/i18n/ui.ts` for UI translations and language detection.
- `src/content/blog/{ko,jp,en}` for translated content.
- `FloatingLanguagePicker.astro` for switching languages, including filtering post pages by available translations.
- `BaseHead.astro` for canonical and alternate language metadata.

Known i18n risks:

- `BaseHead.astro` always emits alternate links for all supported languages based on path normalization. Post pages may not have all translations, so metadata can advertise missing translated URLs.
- `FloatingLanguagePicker.astro` filters available languages only when post route props provide `availableLangs`; non-post pages show all languages.
- `Header.astro`, `LocalizedLink.astro`, and route pages each contain their own URL-building logic. That increases drift risk.
- `BlogPost.astro` breadcrumbs are hardcoded in English and link to non-localized root paths.

## SEO, RSS, And Sitemap Model

SEO-critical files:

- `src/components/BaseHead.astro`
- `src/layouts/BlogPost.astro`
- `src/pages/rss.xml.js`
- `src/pages/sitemap.xml.ts`
- `public/robots.txt`
- `astro.config.mjs`

Current behavior:

- `BaseHead.astro` sets title, description, canonical URL, Open Graph, Twitter metadata, language metadata, alternate `hreflang`, RSS link, JSON feed link, and structured data.
- Blog post pages add article metadata and article JSON-LD.
- `@astrojs/sitemap` is enabled and `public/robots.txt` points to sitemap outputs.
- A custom `sitemap.xml.ts` also exists.

Known SEO/discovery risks:

- RSS links use `/blog/${post.id}/`, which does not match current localized post routes such as `/{lang}/blog/{slug}/`.
- The custom sitemap uses the same non-localized pattern and includes routes such as `/blog/` and `/archive/` that are not represented by the current route files.
- `BaseHead.astro` links to a JSON feed file, but no matching JSON feed route was found.
- Alternate links can point to unavailable translations.
- Site metadata and analytics scripts are centralized in `BaseHead.astro`, making that component high impact.

## External Services

Current external services and public resources:

- Vercel serverless hosting and headers.
- Redis-compatible serverless persistence for page views.
- Giscus for comments.
- GoatCounter and Google Analytics for analytics.
- Google Fonts for web fonts.
- jsDelivr for KaTeX CSS.
- A Three.js font resource if the public 3D visualization script is used.

Do not add new external services casually. Each service should have a clear purpose, CSP impact, privacy impact, and fallback behavior.

## Known Architectural Risks

| Risk | Impact | Where |
| --- | --- | --- |
| URL helpers disagree on localized post URLs | Broken links and SEO regressions | `src/utils/blog.ts`, `src/pages/rss.xml.js`, `src/pages/sitemap.xml.ts`, route files |
| Alternate links are not translation-aware | Search engines may crawl missing localized pages | `BaseHead.astro`, post route props |
| Repeated collection loading and sorting | Build-time cost and logic drift as content grows | Home, blog, tags, categories, post series |
| Free-form categories | Duplicate category pages and inconsistent navigation | Content frontmatter, category routes |
| Monolithic i18n dictionary | Harder review and higher merge-conflict risk | `src/i18n/ui.ts` |
| Inline scripts everywhere | CSP cannot be tightened cleanly | `BaseHead.astro`, components |
| View counter is the only dynamic path | Abuse and cost risk concentrate in one API | `src/pages/api/views.ts` |

## Principles To Preserve

- Keep Astro, Vercel, MDX, Content Collections, and Tailwind unless explicitly asked otherwise.
- Prefer static generation and build-time validation over runtime fetching.
- Keep serverless APIs narrow, validated, and rate-limited.
- Treat route shape, canonical URLs, `hreflang`, RSS, sitemap, and robots behavior as public contracts.
- Keep public content separate from private drafts and candidate Library data.
- Human-review AI-generated translations and summaries before publication.
