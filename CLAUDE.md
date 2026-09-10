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
| `topics` | `src/content/topics/**` | Library topic definitions |
| `academicReviews` | `src/content/academic-reviews/**` | Structured paper review posts |

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

> **Draft system:** `draft: true` removes a post from all listings, sitemap, and RSS. Remove it or set `draft: false` when a post is ready to publish.

---

## Route Architecture (`src/pages/`)

```
src/pages/
├── index.astro                          → redirects to /ko/
├── about.astro                          → redirects to /ko/about/
├── api/
│   └── views.ts                         → POST/GET view counts (prerender=false)
├── rss.xml.js                           → (unused legacy, see [lang]/rss.xml.js)
├── sitemap.xml.ts                       → custom XML sitemap
└── [lang]/
    ├── index.astro                      → /ko/, /jp/, /en/ (home)
    ├── about.astro                      → /ko/about/ etc.
    ├── search.astro                     → /ko/search/ (Pagefind UI)
    ├── rss.xml.js                       → /ko/rss.xml per-language feed
    ├── library.astro                    → /ko/library/ (Library hub)
    ├── paths.astro                      → /ko/paths/ (learning paths index)
    ├── blog/
    │   ├── index.astro                  → /ko/blog/ (all posts, paginated)
    │   ├── [slug].astro                 → (legacy, see [...slug].astro)
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
│   └── dependency-map.md    NPM packages and their roles
├── content/
│   ├── workflow.md          Content review and publishing workflow
│   └── public-images.md     Image size/format/naming guidelines
├── decisions/
│   ├── discover-direction.md  Discover product direction, dynamic taxonomy, phased build order
│   ├── monetization.md      No monetization — current decision boundary
│   ├── product-boundaries.md  What stays public vs private (+ local preferences carve-out)
│   └── security.md          Security risk register (SEC-001..SEC-012)
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
    └── ui-conventions.md    UI/accessibility rules and card patterns
```
