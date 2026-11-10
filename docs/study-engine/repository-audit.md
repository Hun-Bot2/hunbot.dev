# Repository audit

Facts about the blog repo that the design depends on. Checked 2026-11-10 against commit `719ee0b` (main). Only verified facts; anything inferred is marked.

## Stack

| Item | Value | Source |
| --- | --- | --- |
| Framework | Astro 5 (`astro ^5.16.6`) | `package.json` |
| Output | `@astrojs/vercel`; pages prerendered; only `src/pages/api/{views,feedback}.ts` are `prerender = false` | `astro.config.mjs`, API files |
| Package manager / runtime | npm, Node `>=24` (`.nvmrc` 24); my local Node is 26.8.1 | `package.json`, `.nvmrc` |
| MDX | `@astrojs/mdx ^4.3.13`; remark localized links, `remark-cjk-friendly`, `remark-math`; rehype external links, `rehype-katex`; Shiki dual theme | `astro.config.mjs` |
| Styling | Tailwind + Atelier tokens (`src/styles/tokens.css`) | `CLAUDE.md` |
| Search | Pagefind over `dist/client` and `.vercel/output/static` | `package.json` `search:index` |
| i18n | `ko` (default), `jp`, `en`, language prefix in URLs | `astro.config.mjs` |
| Server state | Upstash Redis (view counts, write-only feedback) | `src/pages/api/*.ts` |

**Blog schema** (`src/content.config.ts`): required `title`, `description`, `pubDate`; optional `updatedDate`, `heroImage`, `tags`, `category`, `series`, `seriesOrder`, `draft`, `papers`, `informedBy`, `signals`. Not `.strict()`, so unknown keys such as `anki` are dropped without an error (Zod default; inferred from code, not tested).

**Publishing**: every route reads posts through `getAllPosts()` (`src/utils/blog.ts`), which removes `draft: true` and template frontmatter. Folders such as `study/` are not filtered.

## UI facts relevant to a practice page

- Header nav already has five items (글 / 논문 / 읽을거리 / 라이브러리 / 탐색) plus search, theme, GitHub, LinkedIn.
- Post layout (`src/layouts/BlogPost.astro`): title → `.prose` (Pagefind body) → series → Backlinks → Giscus. `public/scripts/feedback-box.js` posts to `/api/feedback`.
- Browser storage today: theme, language suggestion, filter state, analytics consent. Nothing stores user-written text.
- Analytics: GoatCounter always, Google Analytics after consent. Typed answers must never go into URLs or events.

## Deploy and CI

- Vercel (`vercel.json`: redirects, security headers, CSP).
- `.github/workflows/ci.yml` (Node 24): `content:validate` → `product:validate` → `csp:validate` → `views:validate` → `npm test` → `npm run build` → 9 post-build validators. No artifact upload. The build needs no secrets.
- The repository `Hun-Bot2/hunbot.dev` is public.

## Baseline (2026-11-10)

Measured on a clean worktree of HEAD and on my working tree.

| Command | Clean HEAD | Working tree |
| --- | --- | --- |
| `npm test` | 288/288 pass | 3 fail |
| `npm run content:validate` | pass | **fail**: 5 files without frontmatter |
| `npm run product:validate` | pass | pass |
| `npx astro check` (not in CI) | 6 errors, 22 hints | not run |
| `npm run build` + listing/routes/SEO/search/links validators | pass | not run |

- `study/rag01.mdx` also fails MDX parsing (`Could not parse expression with acorn`, an unescaped `{` or similar), found by the Phase 0 tool on 2026-11-10.
- Working-tree failures come from uncommitted notes without frontmatter: `study/NLP_LoRA.mdx`, `study/Week10-RL.mdx`, `study/ai01.md`, `study/rag01.mdx`, `devlog/Orven/01.mdx`. **Pushing them as-is fails CI.** The 3 test failures read real content and likely share this cause (inferred).
- The 6 `astro check` errors predate this work: `PickCard.astro:38`, `academic-review-routing.ts:82`, `blog-routing.ts:76`, `research.ts:71,116`, one test fixture.

## Note inventory (2026-11-09)

- Korean notes under `study/`, `technical_note/`, `devlog/`: 87; 18 with definition lists, 28 with question headings, 50 with neither (grep-based, no semantic review).
- `study/`: 7 `.mdx` + 1 `.md` in the working tree, 2 of them committed; 8 `.ipynb` files (not in the collection glob).
- A private preliminary inventory of 107 Korean MDX files is in `.local/study-engine/sample-candidates.json`.

## Verified facts used by the design

| Fact | Evidence |
| --- | --- |
| HTML comments break MDX | `@mdx-js/mdx` 3.1.1: `<!-- ... -->` → `Unexpected character !` |
| MDX comments work and do not render | `{/* ... */}` compiles; output keeps it as a JS comment |
| `<|END|>` breaks MDX | `문장입니다. <|END|>` → `Unexpected character |`; `{/* <|END|> */}` compiles |
| Drafts do not leak into the build | See [privacy.md](privacy.md#leak-paths-checked-on-a-clean-build-of-commit-719ee0b-2026-11-10) |

These compile checks ran on Node 26, not Node 24, and are not a full Astro build.

## Related work in the repo

- No `study_engine_initial_setup.md` exists.
- Unmerged branch `feat/study-archive-migration` (checked out in a separate local worktree): migrates study notes (14 content files), adds `src/components/study/{Statement,MathBlock,ModelExplorer}.astro` and many `public/images/STUDY/**` images (origin unchecked). A future practice page must not collide with `src/components/study/`; merge order is open.

## Open items

- Gemini model ID, tier, quotas, structured-output support ([evaluation.md](evaluation.md) §1).
- The five Phase 0 notes and their reference points.
- genanki `.apkg` behavior in real Anki: re-import, suspend state, Default preset, note-type change.
- MathJax and code rendering in Anki and AnkiWeb.
- `node:sqlite` suitability and backup.
- Node 24 run of parser tests.
- Name `study` (npm/trademark) if anything is ever published.
