# Signals and weekly notes

Two kinds of record in the Reading section (읽을거리; they started in the Library and moved on 2026-10-23, [Revision 2026-10-23c](../decisions/site-structure.md#revision-2026-10-23c-reading-becomes-a-fourth-public-surface)), both the owner's judgement layered on external material, both reviewed by a human before they are public. A **signal** is one item that passed the owner's filter, with a verdict and the one line on why it was kept. A **weekly note** is the owner's conclusions for one week, with last week's questions answered and the questions carried forward.

Decision records: [`docs/decisions/site-structure.md`](../decisions/site-structure.md#revision-2026-10-23-the-library-gets-four-views) (the kinds) and [Revision 2026-10-23c](../decisions/site-structure.md#revision-2026-10-23c-reading-becomes-a-fourth-public-surface) (their move to `/{lang}/reading/`). This file is the schema and the behaviour; the record is the reasoning. Explainers are in [`explainers.md`](./explainers.md).

The angle that separates this from a news site: **every item shows the owner's judgement and where it led**, not just the item.

## The Reading section's views

| Tab | Route | Content | Shown when |
|---|---|---|---|
| 해설 | `/{lang}/reading/` | published explainers (the section's front page) | always generated; the tab shows when at least one explainer is published |
| 신호 | `/{lang}/reading/signals/` | a dated ledger of signals, with a verdict filter | at least one signal is published |
| 주간 노트 | `/{lang}/reading/weekly/` (+ `/{n}/`, `rss.xml`) | weekly notes, newest issue first | at least one note is published |

Order on every view: **page label** (`<section class="subpage-intro"><h1 class="eyebrow">읽을거리</h1></section>`, identical to Research; the per-view description is only the page's meta description; the weekly index adds its RSS link in the same row) → **tab bar** → content. A view with nothing published has no tab and (except the front page) no route (`getStaticPaths` returns no paths). `/{lang}/reading/` always exists so the nav item never 404s: with nothing published anywhere it is the page label and one empty line (`reading.empty`), `noindex` and not in the sitemap; the tab bar is omitted while nothing is published, and the view the reader stands on always stays in the bar. The tab bar is `src/components/SectionTabs.astro` (generic: real links, `aria-current="page"`, mono 0.875rem labels with a small mono count, active = ink + 2px accent underline, inactive = `--secondary`, 40px targets, **sticky just under the site header**, sideways scroll without a scrollbar below 640px); the tab list comes from `getReadingTabs()` in `src/utils/reading-tabs.ts`, and the page data from `getReadingViewData()` in `src/utils/reading-views.ts`. The old `/{lang}/library/{signals,explainers,weekly}...` URLs 301 to these routes (`vercel.json`); the three slugs stay reserved against pick sections (`reservedLibrarySlugs`, enforced by `scripts/validate-picks.mjs`).

**Languages.** The text is Korean on every language's page, under that language's chrome. The `jp` and `en` pages of these views are `noindex, follow` and canonical to the `ko` page; the sitemap lists `ko` URLs only.

**Delivery.** Web and RSS only (`/{lang}/reading/weekly/rss.xml`, linked with `<link rel="alternate">` on the weekly pages). No email, no signup, no newsletter provider; `scripts/validate-product-boundaries.mjs` fails on a form or an email field under the Library and Reading pages and components.

## `signals`

`src/content/signals/<id>.md`, JSON frontmatter (like `explainers`), the Markdown body is an optional short note. An **allowlist**: any other field is rejected (`scripts/validate-signals.mjs`, `npm run signals:validate`, part of `content:validate`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | slug | yes | URL-safe; must equal the file name |
| `title` | string | yes | the item's headline in the owner's words |
| `url` | http(s) URL | yes | the original |
| `source.name` | string | yes | |
| `source.language` | `ko` \| `en` \| `ja` | yes | the source's ISO language (not the site's `jp`); `ja` is shown as 일본 자료 |
| `source.kind` | `paper` \| `article` \| `release` \| `post` | yes | |
| `sourceDate` | `YYYY-MM-DD` | yes | when the original appeared |
| `keptAt` | `YYYY-MM-DD` | yes | when it passed the owner's filter; not before `sourceDate` |
| `verdict` | `confirmed` \| `doubt` \| `try` | yes | 확인함 / 의심 / 해볼 것 |
| `why` | string, one line, at most 200 characters | yes | why it was kept |
| `authorship` | `bot` \| `owner` | yes | |
| `review.status` / `humanReviewed` / `reviewedAt` / `reviewer` | as `explainers` | yes | published only when `approved` and `humanReviewed: true` with a `reviewedAt` date |
| `tags` | array of short slugs | no | the existing tag taxonomy |

**Rejected by name** (with the reason): quotes from the source, model names / costs / token counts, verification-check results, private signals and scores (`scripts/lib/forbidden-fields.mjs`, shared with the explainers and weekly validators), the contract's own forbidden lists, and lineage fields (`lineage`, `explainers`, `posts`, `related`, ...): where a signal led is declared on the later artifact, never on the signal.

### Lineage: "where it led"

Declared on the later artifact, derived on the signal:

- an explainer lists the signals it grew out of in `signals` (array of ids);
- a blog post lists them in `signals` (array of ids, frontmatter);
- the signal row shows "→ 해설 …" and "→ 글 …" links, derived by `getSignalLineage()` in `src/utils/signals.ts`. A declaration that points at an unpublished explainer is withheld; posts are the published posts of the page language.

`scripts/validate-explainers.mjs` and `scripts/validate-blog-content.mjs` check that every referenced id is a file in `src/content/signals/`. A reference to an existing but unpublished signal is not an error: it is simply not shown.

### The 신호 view

A dated ledger, newest first, grouped by `keptAt` day with the date set in the left margin like a notebook note (mono, `--secondary`, a hairline between margin and rows; the date sticks while that day scrolls). Each row (`SignalRow`): the verdict **stamp** (`Stamp.astro`: a bordered mono label rotated -2 degrees, 확인함 in `--state-reviewed`, 의심 in `--accent`, 해볼 것 in `--state-reading`), the title (serif, an external link with ↗), the `why` line, the optional note, the source name with the language chip (`SourceLanguageChip`; a Japanese source stays loud), and the lineage links. A verdict filter in the floating filter (`data-facet="verdict"`, `data-post-verdict` on each row). No autonomous motion.

## `weeklyNotes`

`src/content/weekly-notes/<issue>.md` (the file name is the issue number), JSON frontmatter; the Markdown body is the owner's conclusions. An allowlist (`scripts/validate-weekly.mjs`, `npm run weekly:validate`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `issue` | positive integer | yes | unique; equals the file name; the route is `/reading/weekly/{issue}/` |
| `title` | string | yes | |
| `dek` | string, at most 400 characters | yes | |
| `weekOf` | `YYYY-MM-DD` | yes | **a Monday**; the week runs `weekOf` through `weekOf + 6` days |
| `publishedAt` | `YYYY-MM-DD` | yes | not before `weekOf` |
| `resolved` | array of `{ question, outcome }` | no (default `[]`) | last weeks' open questions, answered now |
| `openQuestions` | array of strings | no (default `[]`) | carried to next week |
| `authorship` | `bot` \| `owner` | yes | |
| `review` | as `explainers` | yes | same published rule |
| `tags` | array of short slugs | no | |

The week's signals are **derived**: the published signals whose `keptAt` falls in `weekOf … weekOf + 6` (`getSignalsForWeek()` in `src/utils/weekly.ts`). A note never lists them (a `signals` field is rejected).

### The 주간 노트 views

- **Index**: a column of issues, each led by a large serif issue numeral ("No. 3"), with title, dek, the week range in mono, and counts (신호 n · 해결 n · 열린 질문 n). The whole issue is the link.
- **Detail**: above, a "지난 질문" strip (each `resolved` item, question then outcome). Then a **two-page notebook spread**: the left page 들어온 것 is the week's signals (compact stamps and titles), the right page 결론 is the body; a hairline gutter with a soft shade; one column below 900px (left page first). Below the spread, "다음 주로" lists `openQuestions`. Previous and next issue links close the page.
- **RSS**: `/{lang}/reading/weekly/rss.xml`, one item per published note (issue, title, dek, `publishedAt`).

## Filter and floating controls

신호 uses the visible `LibraryFilterBar` directly under the tab bar (the blog keeps its floating filter; the Library itself now filters with its category tabs, not this bar). 신호 filters by 판단, 출처 언어 and 출처 종류; the bar is not sticky (a sticky bar would take screen height from the list), and below 640px it collapses behind `필터 · n`. The language globe (`FloatingLanguagePicker belowTabs`) rests just below the tab row when the bar shows. Each signal row has an anchor (`#signal-<id>`) so a backlink can point at it.

## Fixtures

Draft fixtures show the design and render nowhere: `src/content/signals/fixture-ja-doubt.md` (a Japanese article, verdict doubt), `fixture-en-try.md` (an English paper, verdict try, referenced from the explainer fixture through `signals`), `src/content/weekly-notes/1.md` (issue 1: two resolved questions, two open ones, `weekOf` 2026-10-19 covering both signals' `keptAt`), and the explainer fixture `fixture-en-paper.md` carries three `claims`, with body links to `#claim-1` and `#claim-2`. Each is `review.status: "draft"` with a `TEMP:` title, and nothing in the Reading section is published, so `/{lang}/reading/` shows only its empty line, so no fixture string reaches `dist/client/**/index.html`, a feed or the sitemap.

To preview them locally, change `review.status` from `"draft"` to `"approved"` in all five files (the only field to flip; `review.humanReviewed` is already `true`) and revert afterwards. `content:validate` fails on an approved `TEMP:` title as a reminder.

## Public-repository rules

This repository is public. Docs, code and commit messages do not name external sites or people used as references, the private pipeline's sources or its per-source rights decisions, model names or costs, or verification-pipeline internals. State only that a record is bot-drafted and human-reviewed, and the schema above.
