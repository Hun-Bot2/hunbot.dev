# Signals and weekly notes

Two kinds of record in the Library, both the owner's judgement layered on external material, both reviewed by a human before they are public. A **signal** is one item that passed the owner's filter, with a verdict and the one line on why it was kept. A **weekly note** is the owner's conclusions for one week, with last week's questions answered and the questions carried forward.

Decision record: [`docs/decisions/site-structure.md`](../decisions/site-structure.md#revision-2026-10-23-the-library-gets-four-views). This file is the schema and the behaviour; the record is the reasoning. Explainers are in [`explainers.md`](./explainers.md).

The angle that separates this from a news site: **every item shows the owner's judgement and where it led**, not just the item.

## The Library's four views

| Tab | Route | Content | Shown when |
|---|---|---|---|
| 신호 | `/{lang}/library/signals/` | a dated ledger of signals, with a verdict filter | at least one signal is published |
| 해설 | `/{lang}/library/explainers/` | published explainers | at least one explainer is published |
| 주간 노트 | `/{lang}/library/weekly/` (+ `/{n}/`, `rss.xml`) | weekly notes, newest issue first | at least one note is published |
| 자료 | `/{lang}/library/` | the Library hero, the tab bar, the curated resources and picks | always |

Order on every view: **masthead** (`LibraryMasthead.astro`: a serif h1 "라이브러리" at `clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)` and one line that changes per view) → **tab bar** → (the hero, 자료 only) → content. A view with nothing published has no tab and no route (`getStaticPaths` returns no paths). The tab bar is `LibraryTabs.astro`: real links, `aria-current="page"`, serif labels, a small mono count set like a superscript, active = ink + 2px accent underline, inactive = `--secondary`, 44px targets, **sticky just under the site header** (paper ground, 1px rule below), and below 640px it scrolls sideways without a scrollbar; the tab list comes from `getLibraryTabs()` in `src/utils/library-tabs.ts`. The slugs `signals`, `explainers` and `weekly` are reserved: `scripts/validate-picks.mjs` fails if a pick section uses one.

**Languages.** The text is Korean on every language's page, under that language's chrome. The `jp` and `en` pages of these views are `noindex, follow` and canonical to the `ko` page; the sitemap lists `ko` URLs only.

**Delivery.** Web and RSS only (`/{lang}/library/weekly/rss.xml`, linked with `<link rel="alternate">` on the weekly pages). No email, no signup, no newsletter provider; `scripts/validate-product-boundaries.mjs` fails on a form or an email field under the Library pages and components.

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
| `issue` | positive integer | yes | unique; equals the file name; the route is `/library/weekly/{issue}/` |
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
- **RSS**: `/{lang}/library/weekly/rss.xml`, one item per published note (issue, title, dek, `publishedAt`).

## The Library hero

`src/components/library/LibraryHero.astro` (behaviour `library-hero-client.ts`, selection `selectHeroSlides()` in `src/utils/hero.ts`), at the top of `/{lang}/library/` only. Slides, at most four: the latest published explainer, the latest weekly note, "today's signals" (the most recent `keptAt` day: the count and up to three titles with stamps), then the newest 자료 items (with a preview image first) to fill up to four, so the hero exists before any of the new kinds is published. Eyebrows: `해설 · 일본 자료`, `주간 노트 No. n`, `신호 · date`, `자료 · kind`. Fewer than two slides renders one static slide with no controls. Its four binding conditions are in `docs/decisions/creative-direction.md` (The Exceptions).

**Plates by kind** (the media column when a slide has no image; never drawn from the title): explainer = the `ExplainerRow` plate language, large (serif 해설, the source language code JA/EN/KO in mono at the corner, a Japanese source in the accent); weekly note = a huge serif issue numeral "No. 1" with the week range in mono; signals = the day's verdict stamps, rotated and overlapping, with the date; 자료 = its image, else the host in mono on the ruled plate. The corner label is the kind or category.

**Floating controls on the Library views.** The filter (`BlogFilterBar anchor="tabs"`) rests at the right end of the tab row on desktop (the row reserves room) and at the bottom right above the safe area on phones, where the row has no room; the language globe (`FloatingLanguagePicker belowTabs`) rests just below the tab row. Dragging is unchanged.

## Fixtures

Draft fixtures show the design and render nowhere: `src/content/signals/fixture-ja-doubt.md` (a Japanese article, verdict doubt), `fixture-en-try.md` (an English paper, verdict try, referenced from the explainer fixture through `signals`), `src/content/weekly-notes/1.md` (issue 1: two resolved questions, two open ones, `weekOf` 2026-10-19 covering both signals' `keptAt`), and the explainer fixture `fixture-en-paper.md` now carries three `claims`. Each is `review.status: "draft"` with a `TEMP:` title, so no fixture string reaches `dist/client/**/index.html`, a feed or the sitemap.

To preview them locally, change `review.status` from `"draft"` to `"approved"` in all five files (the only field to flip; `review.humanReviewed` is already `true`) and revert afterwards. `content:validate` fails on an approved `TEMP:` title as a reminder.

## Public-repository rules

This repository is public. Docs, code and commit messages do not name external sites or people used as references, the private pipeline's sources or its per-source rights decisions, model names or costs, or verification-pipeline internals. State only that a record is bot-drafted and human-reviewed, and the schema above.
