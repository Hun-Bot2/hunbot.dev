# 008: SEO, Social, And Feed Growth

Status: Draft.

## Goal

Improve public discovery for the blog and Library through stable SEO metadata, feed behavior, and social preview support.

This should build on the already implemented route correctness and Pagefind foundations.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not add a marketing platform, newsletter provider, analytics vendor, or paid feature.
- Do not add dynamic OG images before metadata inputs are stable.
- Do not weaken canonical, `hreflang`, robots, RSS, sitemap, or route behavior.
- Do not publish unreviewed translations only to improve SEO coverage.

## Existing Context

- `BaseHead.astro` owns canonical URLs, alternate links, Open Graph, Twitter metadata, font loading, analytics, and structured data.
- RSS routes and sitemap generation exist.
- `@astrojs/sitemap` and a custom sitemap route coexist.
- `docs/migration-plan.md` still lists translation-aware `hreflang`, RSS/sitemap accuracy, per-language RSS, and dynamic OG as important public discovery work.
- The site now has Library routes that should be discoverable but not over-index private or draft content.
- YouTube can become an acquisition and trust channel, but video-specific surfaces should wait for reviewed companion metadata.

## Product Decisions

- Route shape is a public contract.
- Korean, Japanese, and English pages should have correct localized metadata.
- Blog posts without translated counterparts should not advertise nonexistent translations.
- Feeds should serve real generated routes only.
- Social preview improvements should be deterministic and easy to rollback.
- Growth work should not add newsletter, paid, or account infrastructure before product separation is planned.

## Implementation Sequence

1. **Translation-aware alternates**
   - For blog posts, emit alternate links only for existing translated versions.
   - Keep non-post pages fully language-alternate if all language routes exist.
   - Verify `x-default` behavior.

2. **Feed and sitemap audit**
   - Validate RSS links against generated output.
   - Decide whether the custom sitemap route should stay, shrink, or delegate more to `@astrojs/sitemap`.
   - Do not duplicate impossible routes.

3. **Per-language feeds**
   - Add `/ko/rss.xml`, `/jp/rss.xml`, and `/en/rss.xml` if not already correct.
   - Link the language-specific feed from localized pages.
   - Keep global RSS only if it has a clear purpose.

4. **Social preview metadata**
   - Use existing static images first.
   - Add dynamic OG generation only after metadata is stable and sample output is tested for all languages.
   - Do not add large image dependencies unless the implementation requires them and the tradeoff is reviewed.

5. **Structured data review**
   - Confirm article JSON-LD and site JSON-LD match actual routes.
   - Add Library structured data only if it improves clarity and stays accurate.

6. **Validation scripts**
   - Extend route or SEO validation scripts if needed.
   - Prefer source/build-output checks over browser automation.

## Validation

Run:

```sh
npm run routes:validate
npm run search:validate
npm run build
```

Manual checks:

- Inspect rendered head for one post with all translations.
- Inspect rendered head for one post with missing translations.
- Validate RSS XML.
- Validate sitemap URLs against generated files.
- Check social metadata for `/ko/`, `/en/`, `/jp/`, and one post page.

## Rollback Notes

SEO changes should be split by concern. If alternates, feeds, or OG output regress, revert that specific commit rather than the whole growth plan.

## Open Questions

- Should the global RSS feed include all languages or redirect readers to per-language feeds?
- Should OG images remain static per page type or become generated per post?
- Should Library pages be included in RSS or only in sitemap/search?

## Recommended Commit Sequence

1. `fix: make post alternates translation aware`
2. `fix: validate rss and sitemap routes`
3. `feat: add per-language feeds`
4. `feat: add stable social preview metadata`
