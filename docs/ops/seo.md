# SEO And Feed Checklist

This site stays static-first, so SEO work should be deterministic and easy to validate from source or generated output.

## Current Route Contract

Public localized routes use:

- `/ko/`
- `/jp/`
- `/en/`
- `/ko/blog/...`
- `/jp/blog/...`
- `/en/blog/...`
- `/ko/library/...`
- `/jp/library/...`
- `/en/library/...`
- `/ko/paths/...`
- `/jp/paths/...`
- `/en/paths/...`

Do not advertise routes that do not exist.

## Head Metadata

`src/components/BaseHead.astro` owns:

- canonical URL
- `hreflang` alternates
- `x-default`
- Open Graph metadata
- Twitter metadata
- RSS alternate links
- structured data

Blog posts pass `availableLangs`, so post alternates should only include languages that have a matching translated post.

## Feeds

The site exposes:

- `/rss.xml` for the global feed
- `/ko/rss.xml`
- `/jp/rss.xml`
- `/en/rss.xml`

There is no JSON feed route at this time, so pages should not advertise `/feed.json`.

## Sitemap

The custom sitemap should include:

- root and about pages
- localized home, about, blog, category, tag, Library, search, and path routes
- Library section routes
- learning path index and detail routes
- generated blog pagination
- generated blog posts

It should not include impossible nested routes such as `/blog/ko/...`.

## Validation

Run:

```sh
npm run seo:validate
npm run routes:validate
npm run search:validate
npm run build
npm run seo:validate
```

Run `seo:validate` after build when checking generated sitemap, feed, and head output.

## Deferred

- Dynamic OG image generation.
- Newsletter-specific feed surfaces.
- Library items in RSS.
- YouTube-specific structured data.
- Paid/pro acquisition pages.
