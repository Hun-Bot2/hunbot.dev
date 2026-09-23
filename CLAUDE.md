# CLAUDE.md — hun-bot.dev Code Map

> AI-friendly reference. Read this before touching any file.
> For agent rules and constraints, see `AGENTS.md`.
> For deeper topic docs, see `docs/`.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Astro 5 (SSG/hybrid, `output: "hybrid"`) |
| Adapter | `@astrojs/vercel` (serverless) |
| Content | MDX via `@astrojs/mdx`, Astro Content Collections |
| Styling | Tailwind CSS + `global.css` tokens |
| Search | Pagefind (static, runs after `astro build`) |
| Math | `remark-math` + `rehype-katex` |
| Comments | Giscus (client-side, GitHub Discussions) |
| Analytics | GoatCounter + Google Analytics |
| View counts | Upstash Redis via serverless API route |
| Fonts | Google Fonts (per-language), KaTeX (jsDelivr) |
| Deployment | Vercel (CI from GitHub) |

**Language:** TypeScript everywhere except `rss.xml.js` and public scripts.

---

## Repo Layout

```
hun-bot-blog/
├── src/
│   ├── components/         # Astro components (UI building blocks)
│   ├── content/            # All MDX/Markdown content + schemas
│   ├── data/               # Static data files (TS)
│   ├── i18n/               # Translation strings
│   ├── layouts/            # Page-level layout wrappers
│   ├── pages/              # Astro routes
│   ├── styles/             # Global CSS
│   └── utils/              # Pure helper functions
├── public/                 # Static assets (images, scripts, fonts)
├── contracts/              # Wire + storage contracts for the private Research OS (inert to the build)
├── docs/                   # Project documentation
│   ├── architecture/       # System architecture and deps
│   ├── content/            # Content ops workflows
│   ├── decisions/          # ADRs (security, monetization, etc.)
│   ├── features/           # Feature-level docs (search, library, etc.)
│   └── ops/                # Operational guides (CSP, SEO, perf, etc.)
├── AGENTS.md               # AI agent rules and constraints
├── CLAUDE.md               # This file — code map
├── astro.config.mjs        # Astro config (integrations, i18n, image)
├── vercel.json             # Security headers, deployment config
└── tailwind.config.mjs     # Tailwind config
```

---

## Content Collections (`src/content/`)

Defined in `src/content.config.ts`. Each collection has a Zod schema — check it before adding frontmatter fields.

| Collection | Glob base | Purpose |
|---|---|---|
| `blog` | `src/content/blog/**/*.{md,mdx}` | Blog posts in ko/jp/en |
| `resources` | `src/content/resources/**` | Curated external links (Library) |
| `papers` | `src/content/papers/**` | AI paper cards (Library) |
| `topics` | `src/content/topics/**` | Library topic definitions + Discover taxonomy nodes |
| `academicReviews` | `src/content/academic-reviews/**` | Structured paper review posts |

> **Topic taxonomy lifecycle:** beyond the original Library fields, each topic carries `parent` (a topic id, or `null` — `null` is what makes a node a domain; nesting is not limited to two levels), `order` (display weight within its parent, default `0`), `aliases` (previous ids that must keep resolving after a rename), and `mergedInto` (set alongside `status: "archived"` when a topic is merged into another). Nothing is ever deleted — rename adds an alias, merge sets `mergedInto`, retire sets `status: "archived"`; routes and item references keep resolving. All four fields are optional/defaulted, so existing topic files validate unchanged. Full lifecycle spec: `docs/decisions/discover-direction.md` §Taxonomy. Enforced by `scripts/validate-taxonomy.mjs` (`npm run taxonomy:validate`, part of `content:validate`), which rejects an unresolved `parent`, a `parent`/`mergedInto` cycle, duplicate topic ids, a duplicate or id-colliding alias, an archived topic with an active child, and a paper/resource whose topic reference isn't active or merged into an active topic. Topic reference resolution (a stored id, a uniquely-owned alias, or a bounded `mergedInto` chain to an active topic) is shared logic in `scripts/lib/topic-resolution.mjs` (`buildTopicIndex()`, `isResolvableTopicReference()`), used by both `scripts/validate-library.mjs` and `scripts/validate-learning-paths.mjs` so the two validators cannot silently disagree about what a valid topic reference is.

> **Paper identity and provenance (2026-09-14):** `papers` carries a canonical work identity separate from its projection id — `id` (URL-bearing, human-chosen) and `itemId` (`itm-` + 26-char lowercase Crockford-base32 ULID, opaque, minted once, the join key to the private Research OS item and every note anchored to it). The legacy single-enum `decision` field is removed; it conflated acceptance status, honor, presentation format, and provenance into one value and could not express "accepted **and** oral". It is replaced by `acceptanceStatus` (`accepted`/`rejected`/`preprint`/`unknown`, default `unknown`), `honors` (array, max 4, default `[]`, e.g. `oral`/`spotlight`), and `presentationFormat` (nullable, e.g. `poster`) — all three registry-backed by `src/data/paperVocabularies.ts`, never a Zod enum. `provenance` (`VERIFIED`/`RADAR`, default `RADAR`) is the one other closed Zod enum in this repository besides `depth`: it drives destructive TTL in the private Research OS, so it is never assignable by assertion — `VERIFIED` requires both `review.humanReviewed: true` and a `venue` that resolves to a registry id. `source.openReviewId`/`semanticScholarId`/`arxivId` are replaced by `source.externalIds`, a bounded list (max 12) of `{ scheme, value }` entries — a list, not a map, because one work can carry both a preprint DOI and a publisher DOI — with `scheme` cross-checked against `src/data/identifierSchemes.ts` and any `doi` entry checked for well-formedness. `signals.hasCode`/`hasProjectPage` are now nullable (default `null`, not `false` — "not yet checked" is never "no"); `signals.topicScore`/`sourceScore`/`usefulnessScore`/`freshnessScore`/`totalScore` are removed outright (ranking inputs, not observations; no replacement field). Full spec: `docs/decisions/research-item-identity.md`. All render sites (`src/pages/[lang]/library.astro`, `src/pages/[lang]/library/[section].astro`) must call the `getAcceptanceStatusDisplayName()`/`getHonorDisplayName()`/`getVenueDisplayName()` display helpers — never render a stored id straight into a pill.

### Blog Content Layout

```
src/content/blog/
├── ko/          # Korean posts (primary language)
│   ├── devlog/
│   ├── paper-review/
│   ├── product_thinking/
│   ├── technical_note/
│   ├── review/
│   ├── notes/
│   ├── personal_log/
│   ├── retrospective/
│   └── study/
├── jp/          # Japanese (translations of ko/)
└── en/          # English (translations of ko/)
```

### Blog Post Frontmatter Schema

```yaml
---
title: string           # required
description: string     # required
pubDate: YYYY-MM-DD     # required
updatedDate: YYYY-MM-DD # optional
heroImage: string       # optional, public path e.g. /images/...
tags: string[]          # optional
category: string        # optional, normalized by normalizeCategory()
series: string          # optional, groups posts into a series
seriesOrder: number     # optional, ordering within series
draft: boolean          # optional, default false — hides from site when true
---
```

> **Draft system:** `draft: true` removes a post from all listings, the sitemap, RSS, and its own detail page. Every route reads blog content through `getAllPosts()` — **no route may call `getCollection('blog')` at all**, and `scripts/validate-blog-content.mjs` fails the build if one does. The rule used to be the weaker "pass your own `!data.draft` predicate", which was wrong twice over: its substring test matched only the bare `getCollection('blog')` form and skipped any route that passed arguments, and a draft filter alone is not what *published* means. `sitemap.xml.ts` and both `rss.xml.js` routes therefore advertised 15 quality-gate-excluded posts as live URLs — 404s submitted to search engines, dead links in every feed. Fixed 2026-09-23: `getAllPosts()` is the single definition of published, because it is the only place that applies both the draft filter and the quality gate.
>
> **Frontmatter quality gate:** `getAllPosts()` also excludes a non-draft post when its frontmatter is unedited template content (`getFrontmatterIssues()` in `src/utils/blog.ts`) — a placeholder `description` (or one under 10 characters), `tags` containing `tag1`/`tag2`/`tag`, `category` exactly `'category'`, or `series` exactly `'series 이름'`/`'series name'` — or when it shares the same language, `title`, and `pubDate` as another post (always a copy-paste mistake, so every copy is excluded). A post is published only when it is not a draft **and** has no placeholder frontmatter. `scripts/validate-blog-content.mjs` reports every excluded file and reason as a warning, not a build failure.

---

## Route Architecture (`src/pages/`)

```
src/pages/
├── index.astro                          → redirects to /ko/
├── api/
│   ├── feedback.ts                      → POST anonymous feedback, write-only (prerender=false)
│   └── views.ts                         → POST/GET view counts (prerender=false)
├── rss.xml.js                           → /rss.xml — site-wide feed across all languages, linked from BaseHead on every page
├── sitemap.xml.ts                       → custom XML sitemap
└── [lang]/
    ├── index.astro                      → /ko/, /jp/, /en/ (home)
    ├── search.astro                     → /ko/search/ (Pagefind UI)
    ├── rss.xml.js                       → /ko/rss.xml per-language feed
    ├── library.astro                    → /ko/library/ (Library hub)
    ├── paths.astro                      → /ko/paths/ (learning paths index)
    ├── blog/
    │   ├── index.astro                  → /ko/blog/ (all posts, paginated)
    │   ├── [...slug].astro              → /ko/blog/{slug}/ (post detail)
    │   ├── page/[page].astro            → /ko/blog/page/2/ (pagination)
    │   ├── categories.astro             → /ko/blog/categories/
    │   ├── categories/[category].astro  → /ko/blog/categories/{cat}/
    │   └── tags.astro                   → /ko/blog/tags/
    ├── library/
    │   └── [section].astro              → /ko/library/{section}/
    ├── paths/
    │   └── [path].astro                 → /ko/paths/{id}/
    └── reviews/
        ├── index.astro                  → /ko/reviews/
        └── [...slug].astro              → /ko/reviews/{slug}/
```

**i18n config:** `defaultLocale: 'ko'`, `prefixDefaultLocale: false` in `astro.config.mjs` — but the site explicitly links to `/ko/...`. All route helpers prefix the language; do not assume Korean URLs are prefix-free.

---

## Utility Functions (`src/utils/`)

| File | Key exports | What it does |
|---|---|---|
| `blog.ts` | `getAllPosts()`, `filterPostsByLanguage()`, `getPostsByLanguage()`, `getPaginatedPosts()`, `normalizeCategory()`, `getCategoryCounts()`, `getSeriesPosts()`, `estimateWordCount()` | All blog query/filter/sort logic. **Start here for any blog listing change.** `getAllPosts()` filters `draft: true`. |
| `blog-routing.ts` | `getBlogUrlFromPost()`, `getBlogUrlFromId()`, `getBlogSlugFromId()`, `getBlogLanguageFromId()` | Converts content IDs → localized URLs. **Only source of truth for post URLs.** |
| `academic-review-routing.ts` | `getAcademicReviewUrlFromId()` | Same as blog-routing but for `academicReviews`. |
| `homepage.ts` | `getHomepageData()` | Aggregates recent posts + library data for home page. |
| `library.ts` | `librarySections`, `getLibrarySectionPath()` | Library section metadata and URL helpers. |
| `learning-paths.ts` | `getPublishedLearningPaths()`, `getLearningPathUrl()` | Published learning paths and URLs. |
| `view-counter.ts` | `getViewCount()`, `incrementViewCount()` | Redis-backed view count read/write. |
| `responsive-public-images.ts` | `getResponsiveImageSet()` | Public image srcset helpers. |
| `remark-localized-blog-links.mjs` | Remark plugin | Rewrites relative MDX links to localized blog URLs at build time. |
| `canonicalization.ts` | `canonicalizeUrl()`, `normalizeTitle()`, `computeContentHash()`, `normalizeExternalIdentifier()`, `deriveDedupKey()` | URL canonicalization, CJK-safe title normalization, versioned content hashing, and identifier-index dedup-key derivation for the private Research OS pipeline. Not imported anywhere in the public site. **Vendored byte-for-byte by the private Research OS repository**, together with `contracts/research-os/research-item.schema.json`. Editing either file here means the copy there is stale; that repository's `npm run contract:sync` compares them exactly, and `INV-12` guards `CONTENT_HASH_FIELDS` specifically — a change to it leaves both copies individually valid while silently invalidating every stored hash. |

---

## Components (`src/components/`)

### Global / Layout

| Component | Used in | What it does |
|---|---|---|
| `BaseHead.astro` | All layouts | `<head>`: canonical, hreflang, OG, fonts, analytics, theme bootstrap, JSON-LD |
| `Header.astro` | All pages | Site header with nav and language picker |
| `Footer.astro` | All pages | Site footer |
| `HeaderLink.astro` | `Header.astro` | Styled nav link with active state |
| `LocalizedLink.astro` | Various | Link that preserves current language prefix |
| `LanguagePicker.astro` | `Header.astro` | Dropdown for switching ko/jp/en |
| `FloatingLanguagePicker.astro` | Blog posts | Floating language switcher on post pages |
| `Breadcrumb.astro` | Blog posts | `Blog > Category > Post` trail |

### Blog

| Component | Used in | What it does |
|---|---|---|
| `BlogCard.astro` | Listing pages | Post card with title, date, category, tags |
| `blog/PostListCard.astro` | Blog listing | Compact post row for paginated lists |
| `blog/PaginationNav.astro` | Blog listing | Previous/next page navigation |
| `PostMeta.astro` | Post detail | Date, read time, tags |
| `TagList.astro` | Post detail, cards | Renders tag chips |
| `CategoryBadge.astro` | Post cards | Normalized category pill (ai/devlog/review/misc) |
| `FormattedDate.astro` | Various | Locale-aware date display |
| `TableOfContents.astro` | Post detail | Draggable floating TOC from heading anchors |
| `ViewCounter.astro` | Post detail | Fetches + POSTs view count via `/api/views` |
| `GiscusComments.astro` | Post detail | Embeds Giscus comment widget |
| `Bio.astro` | Post detail | Author bio block |

### Library

| Component | Used in | What it does |
|---|---|---|
| `library/LibraryIcon.astro` | Library pages | Section icon display |
| `library/LibraryPageStyles.astro` | Library pages | Shared Library card styles |

### Decks / Presentations

| Component | Used in | What it does |
|---|---|---|
| `decks/PresentationEmbed.astro` | MDX posts | Main presentation embed (HTML/PDF/images) |
| `decks/HtmlDeckFrame.astro` | `PresentationEmbed` | Sandboxed iframe for local HTML decks |
| `decks/SlideImageDeck.astro` | `PresentationEmbed` | Image-based slide navigation |
| `decks/DeckFallback.astro` | `PresentationEmbed` | PDF/download fallback |

### Academic Reviews

| Component | Used in | What it does |
|---|---|---|
| `reviews/EquationNote.astro` | Review MDX | Styled equation block |
| `reviews/KeyTakeaways.astro` | Review MDX | Summary callout |
| `reviews/LimitationBlock.astro` | Review MDX | Limitations section |
| `reviews/MyCommentary.astro` | Review MDX | Author commentary aside |
| `reviews/ReferenceList.astro` | Review MDX | Reference list |
| `reviews/ResultHighlight.astro` | Review MDX | Result callout box |

---

## Layouts (`src/layouts/`)

| Layout | Route | What it wraps |
|---|---|---|
| `BlogPost.astro` | `[lang]/blog/[...slug].astro` | Full post page: `BaseHead` + `Header` + TOC + `ViewCounter` + `GiscusComments` + `Footer`. Also handles series navigation and hreflang. |
| `AcademicReviewPost.astro` | `[lang]/reviews/[...slug].astro` | Review post page with structured review components. |

---

## Static Data (`src/data/`)

| File | Shape | Used by |
|---|---|---|
| `decks.ts` | `Deck[]` | `PresentationEmbed.astro`, Library deck section |
| `learningPaths.ts` | `LearningPath[]` | `/[lang]/paths/` pages |
| `mediaCompanions.ts` | `MediaCompanion[]` | Reserved for future YouTube companion feature |
| `reviewTopics.ts` | Review topic list | Academic review index |
| `discoverFacets.ts` | `contentTypes: ContentTypeDefinition[]`, `contentTypeIds`, `isValidContentType()` | The `contentType` facet registry for `resources` (docs/decisions/discover-direction.md#Facets). Data, not an enum — cross-referenced by `scripts/validate-library.mjs`. |
| `venues.ts` | `venues: VenueDefinition[]`, `venueIds`, `isValidVenueId()`, `resolveVenueId()`, `getVenueRegistryErrors()` | The venue registry for `papers.venue` and `topics.venues` (docs/decisions/research-discovery-system.md#Venue-Registry). Data, not an enum — cross-referenced (with alias resolution) by `scripts/validate-library.mjs`. Coverage is deliberately partial: only venues actually referenced by content, plus IEEE VIS. Every entry's `access` is `unverified` until a real licensing check is done. |

---

## i18n (`src/i18n/`)

| File | What it has |
|---|---|
| `ui.ts` | `UILanguage` type (`'ko' \| 'jp' \| 'en'`), all UI strings keyed by language, `useTranslations(lang)` helper |

Translation strings for nav labels, button text, metadata labels, and page titles all live here. Do not hardcode UI strings in components.

---

## Public Scripts (`public/scripts/`)

| Script | Loaded on | What it does |
|---|---|---|
| `header-menu.js` | All pages | Mobile menu open/close + outside-click handler |
| `blog-filters.js` | `/[lang]/blog/` | Category/year/series filtering; URL params + localStorage |
| `feedback-box.js` | Blog posts | Posts anonymous feedback to `/api/feedback` |
| `language-suggest.js` | Blog posts | Suggests an existing translation from `navigator.language`; never redirects |
| `neuralNetwork.js` | (legacy, dormant) | Three.js neural network 3D visualization |
| `controlsManager.js` | (legacy, dormant) | Controls for 3D visualization |
| `themeManager.js` | (legacy, dormant) | Theme management for 3D visualization |

---

## Key Config Files

| File | Role |
|---|---|
| `astro.config.mjs` | Integrations (MDX, Tailwind, Vercel, Sitemap, RSS), i18n config, image config, Remark/Rehype plugins |
| `vercel.json` | Security headers (CSP, HSTS, X-Frame, Referrer-Policy), deployment config |
| `tailwind.config.mjs` | Tailwind theme (content paths, custom tokens) |
| `src/content.config.ts` | Content Collection schemas (Zod). **Always check here before adding frontmatter.** |
| `src/consts.ts` | `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `SUPPORTED_LANGUAGES` |
| `.env` | `REDIS_URL`, `REDIS_TOKEN` — never print or commit |

---

## Data Flow: Blog Post Lifecycle

```
src/content/blog/{lang}/{category}/{slug}.mdx
        │
        ▼
src/content.config.ts          ← Zod validation (schema check at build)
        │
        ▼
src/utils/blog.ts               ← getAllPosts() — filters draft:true, sorts by date
        │
        ├── Listing pages       src/pages/[lang]/blog/index.astro
        │                       src/pages/[lang]/blog/page/[page].astro
        │                       src/pages/[lang]/index.astro (recent posts)
        │
        ├── Taxonomy pages      categories.astro, tags.astro, categories/[category].astro
        │
        ├── Detail page         src/pages/[lang]/blog/[...slug].astro
        │       │                └─ uses getBlogSlugFromId() → slug
        │       ▼
        │   src/layouts/BlogPost.astro
        │       ├── BaseHead.astro     (SEO, hreflang, OG)
        │       ├── TableOfContents    (heading scan)
        │       ├── ViewCounter        (GET /api/views?slug=...)
        │       └── GiscusComments     (post-load)
        │
        ├── RSS feed            src/pages/[lang]/rss.xml.js
        └── Sitemap             src/pages/sitemap.xml.ts
```

---

## Data Flow: View Counter

```
Client (browser)
    │ GET /api/views?slug={slug}      → reads Redis key views:{slug}
    │ POST /api/views                 → increments if no recent hit from this IP
    ▼
src/pages/api/views.ts               (prerender = false, serverless)
    │
    ▼
src/utils/view-counter.ts            ← getViewCount(), incrementViewCount()
    │
    ▼
Upstash Redis (REDIS_URL + REDIS_TOKEN from .env)
```

---

## Category Normalization

Raw `category` frontmatter values are messy. `normalizeCategory()` in `src/utils/blog.ts` maps them to 4 display buckets:

| Display | Maps from |
|---|---|
| `ai` | `'공부'`, `'勉強'`, `'paper'`, `'ai engineering'`, `'ai-frontier'` |
| `devlog` | `'devlog'`, `'app_devlog'`, `'on-the-block'`, `'local_llm_devlog'`, … |
| `review` | `'review'`, `'hackathon'`, `'paper_review'`, … |
| `misc` | everything else |

---

## Adding a New Blog Post

1. Create `src/content/blog/{lang}/{category}/{slug}.mdx`
2. Add required frontmatter (`title`, `description`, `pubDate`)
3. Do **not** add `draft: true` if it's ready to publish
4. Run `npm run build` to verify frontmatter validates
5. Check `/{lang}/blog/` and `/{lang}/blog/categories/` render correctly

## Adding a New Feature / Route

1. Add the page under `src/pages/[lang]/`
2. Update `src/pages/sitemap.xml.ts` to include the new route
3. Update `src/i18n/ui.ts` for any new UI strings
4. Check CSP in `vercel.json` if new third-party domains are introduced (see `docs/ops/csp.md`)
5. Update this file if it changes the component/utility landscape

---

## Docs Index

```
docs/
├── architecture/
│   ├── overview.md          Full architecture narrative + route table
│   ├── dependency-map.md    NPM packages and their roles
│   ├── health-audit.md      Code/CSS/component health, stack assessment, tooling candidates
│   └── design-tokens-and-images.md  Token architecture + image pipeline proposals (staged)
├── content/
│   ├── workflow.md          Content review and publishing workflow
│   └── public-images.md     Image size/format/naming guidelines
├── decisions/
│   ├── 2026-09-10-site-hardening.md  Session decision log: why each change was made
│   ├── creative-direction.md  Creative identity, interactive-module boundaries, gimmick test, build order
│   ├── discover-direction.md  Discover product direction, dynamic taxonomy, phased build order
│   ├── monetization.md      No monetization — current decision boundary
│   ├── product-boundaries.md  What stays public vs private (+ local preferences carve-out)
│   ├── research-item-identity.md  Canonical research item ID, external-ID map, provenance tier, status history; supersedes papers.decision / signals.totalScore
│   ├── research-os-data-contract.md  Corpus/personal-state/operational/projection boundary, versioned queue+API envelope, content hash, 1 KB record budget
│   ├── research-os-cloud-architecture.md  Private Research OS on AWS: $0/month invariant, serverless architecture, cost guardrails, free-tier model
│   ├── research-discovery-system.md  Research discovery → understanding → hypothesis → experiment loop: registry, provenance, graphs, reading paths, AI reader, notebook, gold sets
│   └── security.md          Security risk register (SEC-001..SEC-012)
├── plans/
│   └── research-os-pre-aws/  Pre-AWS readiness audit, task DAG, and per-task packets (AWS_READY gate)
├── features/
│   ├── library-data-model.md  Content Collections for Library (resources/papers/topics)
│   ├── library-page.md      Library hub and section pages
│   ├── learning-paths.md    Learning path routes and metadata
│   ├── presentation-embed.md  PresentationEmbed component spec
│   └── search.md            Pagefind setup and indexing
└── ops/
    ├── csp.md               Inline script inventory + CSP hardening plan
    ├── performance.md       Performance budget and build guardrails
    ├── seo.md               SEO/feed checklist and route contract
    ├── third-party.md       Approved third-party services and domains
    ├── ui-conventions.md    UI/accessibility rules and card patterns
    └── ui-ux-plan.md        Blog listing audit (F1-F9) + phased redesign plan
```
