# Blog UI/UX Audit And Improvement Plan

Audited: 2026-09-10. Scope: `/{lang}/blog/`, its taxonomy pages, and the homepage listing surfaces.

## How This Audit Was Done

Repeat this before any future redesign, in this order. The order matters — the structural findings below were invisible from screenshots and obvious from counting.

1. **Read the route sources**, not just the components. Two pages that look similar can have different information architectures.
2. **Check route reachability.** Grep each listing page for links to the routes it is supposed to lead to. Generated does not mean reachable.
3. **Count the content.** Group posts by every field the UI groups by, and count the buckets. A UI axis that produces mostly singleton buckets is the wrong axis.
4. **Compare rendered totals against source totals.** A mismatch is a filtering bug, and it will not look like one on screen.
5. **Only then look at pixels.**

Step 4 is what found the most serious issue on this site. The blog index reported 87 posts; the source has 50 publishable ones.

## Findings

Ordered by severity. Evidence is cited so each can be re-verified.

### F1 — Draft posts are publicly published (correctness, not UX)

`getAllPosts()` at [`src/utils/blog.ts:47`](../../src/utils/blog.ts) is the only code that filters `draft: true`. **No page calls it.** Every listing and detail route calls `getCollection('blog')` raw, so `filterPostsByLanguage()` and `getPostsByLanguage()` pass drafts straight through.

Affected: blog index, homepage, categories, category detail, tags, pagination, and post detail pages — 8 routes.

Korean content is 50 publishable posts and 37 drafts. The blog index renders 87. `Local LLM 개발일지 02`, `알고리즘 복습 호율화`, and `블로그 개발일지 01` are all `draft: true` and all render publicly today.

The dangerous part is the asymmetry: RSS ([`[lang]/rss.xml.js:18`](../../src/pages/[lang]/rss.xml.js)) and the sitemap ([`sitemap.xml.ts:13`](../../src/pages/sitemap.xml.ts)) filter drafts correctly. So drafts are **readable but unindexed** — invisible to feed and SEO checks while visible to every reader who opens the blog page.

`CLAUDE.md` states that `draft: true` "removes a post from all listings, sitemap, and RSS." That is true of the sitemap and RSS and false of every listing.

### F2 — Page 1 and page 2 are different architectures

[`blog/index.astro`](../../src/pages/[lang]/blog/index.astro) groups all posts by **series**, with a series sidebar. [`blog/page/[page].astro`](../../src/pages/[lang]/blog/page/[page].astro) renders a **flat reverse-chronological** list with pagination.

These are two unrelated designs occupying one numbered sequence. A reader moving from page 1 to page 2 does not get more of the same thing.

### F3 — Pages 2..N are unreachable

`index.astro` contains no `PaginationNav` and no link matching `page/` — zero occurrences. The paginated routes are generated, indexed, and orphaned. The only way to reach page 2 is to type the URL.

### F4 — The tags page is a dead end

[`blog/tags.astro`](../../src/pages/[lang]/blog/tags.astro) contains **zero `href` attributes**. It lists every tag with a count and links none of them. No `/blog/tags/[tag]` route exists to link to.

### F5 — Series is the wrong primary axis

50 publishable Korean posts produce 19 series groups, **13 of them singletons**. The dominant grouping on the site's main listing page is therefore mostly groups of one.

### F6 — Placeholder metadata is shipping

13 posts carry `series: 'series 이름'` and 14 carry `category: 'category'` — literal template placeholder text. That is roughly a quarter of published posts, and it is why the blog index shows a large nonsense series group.

**Contained:** `getAllPosts()` in `src/utils/blog.ts` now excludes posts with placeholder frontmatter (placeholder `description`/`tags`/`category`/`series`, or duplicate language+title+pubDate) from every listing, so these no longer render. `scripts/validate-blog-content.mjs` reports the excluded files as warnings. The underlying content is unchanged — these are still unfinished drafts in all but name — and still needs real titles, descriptions, categories, and series written before publishing.

### F7 — Category display contradicts the category model

`normalizeCategory()` collapses categories into 4 buckets (`ai`, `devlog`, `review`, `misc`). [`blog/categories.astro`](../../src/pages/[lang]/blog/categories.astro) ignores that and renders all **21 raw categories**, coloring each by string hash from a 40+ entry palette that includes `text-[#fffffc]`.

This contradicts [`ui-conventions.md`](./ui-conventions.md) — "prefer readable contrast over decorative color" — and near-white text is a contrast failure on a light theme.

### F8 — Listings carry no topical signal

[`PostListCard.astro`](../../src/components/blog/PostListCard.astro) renders hero image, date, title, and description. No category, no tags. A reader scanning the list cannot tell a paper review from a devlog without reading each description.

### F9 — Most posts have no hero image

31 of 50 posts have no `heroImage`, so `PostListCard` falls back to `/images/blank.png`. The listing is dominated by identical placeholder tiles that consume the card's most prominent element while carrying no information.

## Plan

### Phase 0 — Stop publishing drafts

Point all 8 routes at `getAllPosts()`, or apply the same `!data.draft` predicate they already use in RSS and the sitemap. Add a validator asserting that no route calls `getCollection('blog')` without a draft filter, so this cannot regress.

This is a content-visibility change: roughly 37 Korean posts stop being publicly readable. It is the correct behavior and matches documented intent, but it is outward-facing and needs explicit sign-off before it ships.

*Exit:* rendered post count equals publishable source count in all three languages; `blog:validate` fails if a route skips the filter.

### Phase 1 — Fix metadata before redesigning around it

Replace the `'series 이름'` and `'category'` placeholders with real values or remove the fields. Decide which of the 21 raw categories are real and map the rest.

Doing this before Phase 2 is deliberate: any filter UI built on top of placeholder values will look broken and will be blamed on the UI.

*Exit:* zero placeholder values; every raw category maps to an intended `normalizeCategory()` bucket.

### Phase 2 — Rebuild `/blog` around date and category

Make reverse-chronological the primary axis, matching what page 2 already does and resolving F2.

- **Category tabs** from the 4 normalized buckets — few enough for tabs, and already the site's category model.
- **Date filter** by year — 50 posts across 2025–2026 makes year the right granularity; month would produce mostly-empty buckets, the F5 mistake repeated.
- **Series becomes a secondary view**, not the page's structure. It is genuinely useful for the 6 real multi-post series and actively harmful as the primary grouping for the 13 singletons.
- Add `PaginationNav` to page 1, closing F3.
- Add category and tags to `PostListCard`, closing F8.
- Drop the hero image from the list card, or show it only when present, closing F9.

**Reuse the Discover filter mechanism**: URL query parameters with `localStorage` persistence, server-rendered content that a client script shows and hides, filter script external rather than inline. Same pattern, same constraints, one implementation to maintain, and it keeps the [product boundary carve-out](../decisions/product-boundaries.md) satisfied. Building a second, different filtering approach for the blog would be the main avoidable mistake available here.

*Exit:* `npm run build`, `ui:validate`, `routes:validate`, `links:validate`, `seo:validate` pass; filtering works with JavaScript disabled; page 1 and page 2 share one architecture.

### Phase 3 — Taxonomy pages

Either give tags a destination (`/blog/tags/[tag]`) or remove the tags page. A page that lists 100 unclickable words is worse than no page. Closes F4.

Re-render `blog/categories.astro` against the 4 normalized buckets with the existing category color treatment rather than hash-assigned decoration. Closes F7.

*Exit:* no listing page contains an unlinked taxonomy term; `ui:validate` passes.

## Guardrails

- No UI framework, no component library, no new dependencies — `AGENTS.md` §2.
- Do not change post URLs, canonical tags, `hreflang`, RSS, or sitemap output. This work is listings and navigation only.
- Filter state stays client-side. No API route, no view-count-style serverless addition.
- Keep every page usable without JavaScript.

## Verification

```sh
npm run build
npm run ui:validate
npm run links:validate
npm run seo:validate
npm run blog:validate
```

Then check `/ko/`, `/jp/`, and `/en/` blog listings by hand, since language routing is the most common regression here.
