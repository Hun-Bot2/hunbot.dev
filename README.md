# hun-bot.dev

> A personal research notebook: what I build, the papers I study, what I read, and the tools I keep.
>
> Live site: [https://hun-bot.dev](https://hun-bot.dev) · Korean first, with Japanese and English

![Astro](https://img.shields.io/badge/Framework-Astro_5-orange?style=flat-square)
![Vercel](https://img.shields.io/badge/Hosting-Vercel-black?style=flat-square)
![Pagefind](https://img.shields.io/badge/Search-Pagefind-blue?style=flat-square)

## What's on the site

| Section | Path | What it holds |
| :--- | :--- | :--- |
| **글** (Writing) | `/{lang}/blog/` | Build logs, study notes, reviews, retrospectives |
| **논문** (Papers) | `/{lang}/research/` | Paper study log, paper reviews, learning paths, topics |
| **읽을거리** (Reading) | `/{lang}/reading/` | My judgement on external material: 해설 (explainers, split reader with a claims ledger), 신호 (signals), 주간 노트 (weekly notes, web + RSS only) |
| **라이브러리** (Library) | `/{lang}/library/` | Tools and references I use, as a card grid by area; each item has its own page with my note |
| **탐색** (Explore) | `/{lang}/explore/` | A map of the declared links between posts, papers and items |

Anything that isn't reviewed stays a draft and is never built: blog posts with `draft: true`, explainers/signals/weekly notes until approved, and Library notes until `draft: false`.

## Stack

- **Astro 5** (hybrid output) with MDX and typed Content Collections (Zod schemas in `src/content.config.ts`)
- **Vercel** for hosting and the two serverless routes (view counts, anonymous feedback); **Upstash Redis** for view counts
- **Pagefind** static search, **KaTeX** for math, **Giscus** for comments
- **Analytics**: GoatCounter (cookie-free) always; Google Analytics only after the reader consents in the banner
- Styling: Tailwind + the "Atelier" design tokens in `src/styles/tokens.css` (paper, ink, 1px rules, one accent)

## Run it

```bash
npm install
npm run dev        # http://localhost:4321/ko/
npm run build      # astro build + Pagefind index
npm test
```

`.env` holds `REDIS_URL` and `REDIS_TOKEN` for view counts; the site builds without them.

CI (`.github/workflows/`) runs `content:validate`, `product:validate`, `csp:validate`, `views:validate` and `npm test` before the build, and the route, SEO, UI, search, home, Library, link and performance checks after it. To run the most common ones locally:

```bash
npm run content:validate && npm test && npm run build && npm run routes:validate && npm run links:validate && npm run seo:validate
```

## Writing content

- **Post**: add `src/content/blog/{ko|jp|en}/{category}/{slug}.mdx` with `title`, `description`, `pubDate`. Remove `draft: true` to publish.
- **Library note**: `npm run note:new -- <item-id>` creates a draft in `src/content/item-notes/`. Write it, then set `draft: false`. A note drafted from an item's docs is marked `authorship: bot` and shows an "AI 초안" label; publishing it also needs `reviewedAt`. Rules: [`docs/content/item-notes.md`](docs/content/item-notes.md).
- **Translations**: Japanese and English posts are translations of the Korean ones, produced by a local translation pipeline and checked before publishing.

## Docs

- [`CLAUDE.md`](CLAUDE.md): code map (routes, components, utilities, collections)
- [`docs/decisions/`](docs/decisions/): why the site is structured the way it is (site structure, creative direction, security)
- [`docs/ops/`](docs/ops/): UI conventions, CSP, SEO, performance budget, third-party services
- [`docs/features/`](docs/features/): Library, explainers, signals and weekly notes, search
