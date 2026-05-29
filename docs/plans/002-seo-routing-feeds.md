# 002: SEO, Routing, Feeds, And OG Stability

Status: Implemented.

## Goal

Stabilize public discovery URLs after PR01 by making post alternates, RSS, sitemap, per-language feeds, and future OG image work use the same localized route contract.

This plan groups migration items that all depend on correct canonical blog URLs:

- Make post `hreflang` translation-aware.
- Fix RSS and sitemap route accuracy.
- Add per-language RSS feeds after global feed correctness.
- Keep dynamic OG images deferred until metadata inputs are stable.

## Non-goals

- Do not change the `/ko`, `/jp`, `/en` route convention.
- Do not remove the existing localized blog URL helper.
- Do not redesign `BaseHead.astro`.
- Do not add dynamic OG image generation before alternate links, RSS, and sitemap are verified.
- Do not change MDX content or blog slugs as part of this plan.

## Existing Context

- Localized blog URL helpers live in `src/utils/blog-routing.ts`.
- The main helper for post links is `getBlogUrlFromId(postId, fallbackLang?)`.
- Blog post route generation already builds `availableLangs` in `src/pages/[lang]/blog/[...slug].astro`.
- `BlogPost.astro` receives `availableLangs`, but `BaseHead.astro` currently emits alternate links for every supported language.
- RSS and the custom sitemap already import `getBlogUrlFromId`, but generated output should still be audited against built files.
- `@astrojs/sitemap` is enabled, so the custom sitemap must be treated carefully to avoid stale or duplicate discovery data.

## Implementation Sequence

1. **Translation-aware alternates**
   - Add an optional `availableLangs?: SupportedLanguage[]` prop to `BaseHead.astro`.
   - Keep current all-language alternate behavior when `availableLangs` is not provided.
   - For blog posts, pass `availableLangs` from `BlogPost.astro` to `BaseHead.astro`.
   - Filter `alternateLinks` and `og:locale:alternate` to only available post languages.
   - Set `x-default` to the default language URL when that language exists; otherwise use the current page canonical URL.

2. **RSS and sitemap accuracy audit**
   - Keep using `getBlogUrlFromId` for post links.
   - Remove any hard-coded `/blog/{id}` behavior if found.
   - Compare generated RSS and sitemap URLs against `dist/client` after build.
   - Keep only routes that exist in the current page tree.
   - Verify `public/robots.txt` points at a sitemap URL that is produced by the build.

3. **Per-language RSS feeds**
   - Add per-language feeds only after the global feed validates.
   - Use route shape `/ko/rss.xml`, `/jp/rss.xml`, and `/en/rss.xml` unless existing feed conventions require a different suffix.
   - Each feed must include only posts for its language and must use `getBlogUrlFromId`.
   - Keep the existing global RSS feed unless explicitly removed in a later plan.

4. **Dynamic OG image sequencing**
   - Do not implement dynamic OG generation in this plan unless all prior steps pass.
   - If added later, OG inputs must come from the same canonical title, description, language, and URL logic used by `BaseHead.astro`.
   - Add sample generation checks for all three languages before linking dynamic OG images publicly.

## Validation

Run:

```sh
npm run build
```

Manual checks:

- Inspect the rendered head for a post that exists in all languages.
- Inspect the rendered head for a post that exists in only one or two languages.
- Verify `canonical`, `hreflang`, `x-default`, and `og:locale:alternate`.
- Validate `/rss.xml` links to localized post URLs.
- Validate custom sitemap output links to generated pages.
- If per-language RSS is added, validate `/ko/rss.xml`, `/jp/rss.xml`, and `/en/rss.xml`.

## Rollback Notes

- Alternate-link changes should revert through `BaseHead.astro`, `BlogPost.astro`, and the post route together.
- Feed changes should revert only RSS/sitemap files and any feed links added to `BaseHead.astro`.
- Do not roll back `src/utils/blog-routing.ts` unless the helper itself was changed in this plan.

## Open Questions

- Should the global RSS feed remain all languages, or should it become Korean-only after per-language feeds exist?
- Should `x-default` prefer Korean when available, or always prefer the current canonical URL for translated posts?
- Should dynamic OG images be serverless or static-generated in a later PR?

## Recommended Commit Sequence

1. `fix: make post hreflang translation aware`
2. `fix: validate rss and sitemap localized urls`
3. `feat: add per-language rss feeds`
