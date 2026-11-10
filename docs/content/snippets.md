# VS Code snippets

Project snippets live in `.vscode/hunbot.code-snippets` and work in `.mdx` and `.md` files (MDX language support: the recommended `unifiedjs.vscode-mdx` extension). Type the prefix and press Tab; Tab again moves through the fields, and choice fields show a dropdown.

## Safety defaults

- Every frontmatter snippet starts with `draft: true`. Flip it to `false` to publish.
- Unedited fields default to the blog's own placeholder values (`설명 입력`, `tag`, `series 이름`). If one is left in, `getAllPosts()` excludes the post and `npm run blog:validate` lists it with the reason, so a half-filled post never goes live even if `draft` is flipped.
- `pubDate` is filled with today's date.
- Category choices are values that `normalizeCategory()` (`src/utils/blog.ts`) already maps, so the post lands in the intended bucket (ai / devlog / review / misc).

## Frontmatter by folder

| Prefix | Folder | Category choices | Extras |
| --- | --- | --- | --- |
| `fm-study` | `src/content/blog/{lang}/study/` | `공부`, `ai engineering`, `paper` (→ ai) | `series`, commented `informedBy`, and the Study Engine `anki` block (`enabled`, `deck`, `send`) |
| `fm-devlog` | `devlog/<PROJECT>/` | `devlog` and the project aliases (`blog_devlog`, `algo_bot`, `local_llm_devlog`, …) (→ devlog) | `series`, `seriesOrder`, commented `heroImage` |
| `fm-tech` | `technical_note/<TOPIC>/` | `ai engineering`, `architecture`, `chatting_system`, `devlog`, `공부` | commented `series` |
| `fm-paper` | `paper-review/` | `paper_review`, `paper` | commented `papers` (paper card ids); section headings for problem / idea / results / limits |
| `fm-review` | `review/` | `review`, `hackathon` (→ review) | — |
| `fm-essay` | `product_thinking/`, `personal_log/`, `notes/`, `retrospective/` | `thoughts`, `contemplation`, `career`, `retrospective` (→ misc) | — |
| `fm-areview` | `src/content/academic-reviews/{lang}/` | — | `paper` block (title, authors, venue, year, url), commented `paperId`, the six review component imports and a skeleton |

The `anki` block in `fm-study` is not part of the blog schema; Zod drops it, so it never affects the site. Study Engine reads it from the raw file ([docs/study-engine/contracts.md](../study-engine/contracts.md#note-frontmatter)). `send: false` keeps a note out of any external LLM.

Not covered: `src/content/papers/**` (JSON cards with a minted `itemId`, produced by the research pipeline), explainers, signals and weekly notes (allowlisted JSON records with a review block), and item notes (`npm run note:new -- <item-id>` creates them).

## Study Engine blocks

These shape a note so Study Engine can extract cards without an LLM ([docs/study-engine/decisions.md](../study-engine/decisions.md) D2, D6).

| Prefix | Inserts | Becomes |
| --- | --- | --- |
| `study-skeleton` | `## 용어 정리` with a definition item, `## 공식` with a sentence and block math, a question heading | Memorize cards (definitions, formula) and an understand card from the question heading |
| `def` | `- **용어:** 정의` | A memorize `definition` card |
| `mathblock` | `$$ … $$` | A memorize `formula` card when a sentence precedes it |
| `anki-card` | `{/* anki id="…" Q: … A: … */}` | A card exactly as written; hidden on the blog |
| `card-break` | `{/* card-break */}` | A forced section boundary for the LLM layer; hidden on the blog |

Comment cards must use MDX comments. HTML comments (`<!-- -->`) and `<|...|>` markers break the MDX compiler.

## Shared components

| Prefix | Inserts |
| --- | --- |
| `term`, `import-term` | `<Term term title>` margin glossary and its import |
| `linkcard` | `LinkCard` import and tag. The build fails unless `href` is a published on-site page |
| `rv-result`, `rv-eq`, `rv-limit`, `rv-comment` | Review components (`ResultHighlight`, `EquationNote`, `LimitationBlock`, `MyCommentary`) for academic reviews; `fm-areview` adds their imports |

## Verification (2026-11-10)

On a clean worktree of `719ee0b`, every snippet was expanded with its defaults and placed in each folder, once as a draft and once published with real values:

- `npm run blog:validate` and `npm run reviews:validate` passed; the published copies produced no warnings.
- `npm run build:astro` succeeded and rendered all published copies (6 blog folders + 1 academic review); drafts were not rendered.
- In the study page the comment card and `card-break` text were absent, KaTeX rendered, `Term` rendered, and `LinkCard` resolved to `/ko/blog/study/linux/secure-boot/`.
- Published copies with untouched defaults were flagged by the quality gate (`placeholder description`, `placeholder tags`, `placeholder series`).

## Changing snippets

Edit `.vscode/hunbot.code-snippets` (JSON with comments). In bodies, a literal `$` must be written `\\$` and a literal `}` inside a placeholder `\\}`. Keep category choices in sync with `CATEGORY_ALIASES` in `src/utils/blog.ts`.
