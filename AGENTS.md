# AGENTS.md

## 1. Project Context

This repository is `hun-bot.dev`, a multilingual personal tech blog built with Astro 5, MDX, Astro Content Collections, Tailwind CSS, and Vercel serverless deployment. Preserve the current stack and static-first publishing model unless the user explicitly asks for a migration.

Expected project shape:
- Astro pages and layouts under `src/pages`, `src/layouts`, and `src/components`.
- Blog content under `src/content/blog/{ko,jp,en}/...` as Markdown/MDX.
- Public images, PDFs, fonts, and browser scripts under `public/`.
- Minimal dynamic behavior through serverless API routes, currently only page views backed by Upstash Redis-style REST credentials.
- Local LLM translation/curation workflow is documented in project docs/content, but generated translations must still be reviewed by a human before publication.

Do not recommend or implement migration to Next.js, Remix, a CMS, Supabase, or a full-stack architecture unless a later task explicitly asks for it.

## 2. Non-Negotiable Constraints

- Do not change the framework, deployment adapter, package manager, or deployment architecture without explicit instruction.
- Do not introduce large migrations or broad rewrites for narrow tasks.
- Keep diffs small, focused, and reviewable.
- Do not expose, print, commit, or summarize secret values. A root `.env` file exists; treat it as sensitive.
- Preserve existing URL behavior, language routing, canonical URLs, `hreflang`, RSS, sitemap, robots, and SEO metadata unless the task is specifically about changing them.
- Preserve the static-first Astro approach. Add or expand serverless APIs only when necessary.
- Do not add dependencies unless the task clearly requires them and the tradeoff is explained.
- Do not refactor unrelated files while editing content or UI.

## 3. Development Commands

Package manager: `npm` (`package-lock.json` is present).

- Install: `npm install`
- Dev server: `npm run dev` (`astro dev`)
- Build: `npm run build` (`astro build`)
- Preview: `npm run preview` (`astro preview`)
- Astro CLI passthrough: `npm run astro`
- Test: Not currently defined
- Lint: Not currently defined
- Typecheck: Not currently defined

Major dependencies include `astro`, `@astrojs/vercel`, `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@astrojs/tailwind`, `@upstash/redis`, `sharp`, `remark-math`, `rehype-katex`, and `unist-util-visit`. There is no separate `devDependencies` section at the time this file was written.

## 4. Architecture Conventions

- Use Astro Content Collections from `src/content.config.ts`. Blog entries are loaded from `src/content/blog` and must satisfy the frontmatter schema: `title`, `description`, `pubDate`, optional `updatedDate`, `heroImage`, `tags`, `category`, `series`, and `seriesOrder`.
- Keep content language directories as `ko`, `jp`, and `en`. Content IDs include the language prefix; route code removes that prefix when building URLs.
- Current localized routes live under `src/pages/[lang]/`. Blog posts are served by `src/pages/[lang]/blog/[...slug].astro`; blog index, tags, and categories are also language scoped.
- Although Astro i18n has `ko` as the default locale, the current site heavily uses `/ko/...` links and root redirects to `/ko/`. Do not assume Korean URLs are unprefixed without checking the existing route helpers and generated output.
- `BaseHead.astro` owns global CSS import, canonical links, alternate `hreflang`, Open Graph/Twitter metadata, font loading, analytics scripts, and structured data. Treat it as SEO-critical.
- `src/pages/rss.xml.js`, `src/pages/sitemap.xml.ts`, `public/robots.txt`, and the `@astrojs/sitemap` integration are discovery-critical. Preserve feed and sitemap behavior unless explicitly changing it.
- Use public asset paths such as `/images/...` and `/assets/...` for content frontmatter and MDX images. Do not move public assets into `src/assets` without a deliberate image-pipeline change.
- Keep API routes minimal. Dynamic serverless routes should set `export const prerender = false` when needed, validate inputs, and avoid logging sensitive details.
- Keep the Vercel security headers in `vercel.json` intact or tighter. Do not broadly weaken CSP to solve a local rendering issue.

## 5. Testing and Verification

When changing code or content, choose verification based on risk:

- Run `npm run build` for route, content collection, MDX, RSS, sitemap, and Astro integration changes.
- Manually verify affected localized pages at `/ko/...`, `/jp/...`, and `/en/...` when touching routing, language pickers, `BaseHead`, or content IDs.
- For pure helpers such as slug, route, category, or read-time logic, prefer adding focused unit tests if a test setup is introduced later.
- For build-time content behavior, prefer validation scripts that inspect generated paths, required frontmatter, canonical links, and alternate language links.
- If automated tests are absent, document the manual checklist used and any verification not run.

## 6. Security Rules

- Never print or commit `.env` contents, API tokens, Redis credentials, verification secrets, private URLs, or credentials.
- Validate API inputs such as `slug`; do not trust client-supplied paths or Redis key fragments.
- Keep rate limiting and abuse protection for view-count APIs at least as strong as the current IP-plus-TTL Redis lock.
- Avoid logging raw request headers, IP-derived keys, tokens, or third-party payloads.
- Do not weaken CSP, frame, referrer, or permissions headers without explicit approval and a safer replacement.
- Do not store raw third-party content, scraped data, or generated summaries/translations unless the source, license, and publication intent are clear.

## 7. Review Guidelines

Flag these as high priority in future reviews:

- Broken localized URLs, especially `/ko`, `/jp`, `/en` route mismatches.
- Canonical, `hreflang`, Open Graph, RSS, sitemap, or robots regressions.
- Astro build failures, MDX/frontmatter schema failures, or generated route changes.
- API input validation gaps, Redis key injection risks, or view-count abuse protection regressions.
- Unnecessary dependencies or package-manager churn.
- Large diffs without tests or a clear manual verification checklist.
- Accidental content route changes caused by renames, case changes, folder moves, or language-prefix handling.
- SEO regressions in `BaseHead.astro`, RSS, sitemap, or public metadata.
- Secret exposure in code, logs, docs, screenshots, generated files, or examples.

## 8. Library / Resource Curation Guidance

For the planned Library section:

- Keep approved public data separate from private candidate data and unpublished notes.
- AI-generated summaries or translations must be human-reviewed before publication.
- Open-source resources should include license, source URL, author/project attribution, and retrieval/update date when practical.
- Do not mirror third-party assets, raw datasets, or full-text resources unless license and permission are clear.
- Prefer linking and summarizing over copying. Store only the metadata and excerpts needed for the public blog experience.
