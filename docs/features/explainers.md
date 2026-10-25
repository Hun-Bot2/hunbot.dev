# Explainers

An **explainer** is a long-form Korean article that comments on one paper or one piece of external writing. A bot drafts it and the site owner reviews and approves it; nothing unreviewed is ever exported. It is commentary in its own words: never a translation or a close paraphrase of the source, and it always names and links the source.

Decision records: [`docs/decisions/site-structure.md`](../decisions/site-structure.md#revision-2026-10-22-explainers-join-the-library) (explainers join the Library) and [Revision 2026-10-23](../decisions/site-structure.md#revision-2026-10-23-the-library-gets-four-views) (they get their own view, and `claims` and `signals` are added) and [Revision 2026-10-23c](../decisions/site-structure.md#revision-2026-10-23c-reading-becomes-a-fourth-public-surface) (they move to the Reading section and the detail page becomes a split reader). This file is the schema and the behaviour; the record is the reasoning.

## Where explainers live

| | |
|---|---|
| Collection | `explainers`, `src/content/explainers/<id>.md` (Markdown body, JSON frontmatter like `resources` and `papers`) |
| Listing | the 해설 view, `/{lang}/reading/` (a row per explainer, `ExplainerRow`); the front page of the Reading section (읽을거리) |
| Detail page | `/{lang}/reading/explainers/{id}/` (`ExplainerPost` layout, a split reader) |
| Review badge | `src/components/library/ProvenanceBadge.astro` (`full` on the page, `compact` on the row) |
| Source language chip | `src/components/library/SourceLanguageChip.astro` |
| Helpers | `src/utils/explainers.ts` |
| Validator | `scripts/validate-explainers.mjs` (`npm run explainers:validate`, part of `content:validate`) |

## Schema (the pipeline export must match this)

The schema is an **allowlist**: every field a record may carry is below, and any other field is rejected. Defined in `src/content.config.ts`; enforced independently by `scripts/validate-explainers.mjs`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | slug (`[a-z0-9-]`, lower case) | yes | URL slug and file name; must equal the file name without extension |
| `title` | string | yes | |
| `dek` | string, at most 400 characters | yes | One or two sentences, owner-approved text; shown on the row (two lines) and under the title |
| `canonicalLanguage` | `"ko"` | no (default `ko`) | `ko` only for now |
| `publishedAt` | `YYYY-MM-DD` | yes | |
| `updatedAt` | `YYYY-MM-DD` | no | |
| `source.name` | string | yes | Name of the paper or the writing |
| `source.url` | http(s) URL | yes | Link to the original |
| `source.language` | `ko` \| `en` \| `ja` | yes | The source's language (ISO code; not the site's `jp`). A `ja` source requires `name` and `url` to be present and is shown as 일본 자료 |
| `source.kind` | `paper` \| `article` | yes | |
| `ids.doi` | DOI, well formed | no | Used only to link a paper card |
| `ids.arxiv` | bare arXiv id, e.g. `2401.01234` | no | Used only to link a paper card |
| `authorship` | `"bot"` | yes | An enum so `"owner"` can be added; `ProvenanceBadge` already renders both |
| `review.status` | `draft` \| `pending` \| `approved` \| `rejected` | yes | Only `approved` is published |
| `review.humanReviewed` | boolean | yes | `approved` requires `true` |
| `review.reviewedAt` | `YYYY-MM-DD` \| `null` | yes | `approved` requires a date (the badge shows it) |
| `review.reviewer` | string \| `null` | no | |
| `tags` | array of short slugs | no (default `[]`) | The existing tag taxonomy. The first tag is the 주제 facet value; tags map to a 분야 through `src/data/libraryAreas.ts` |
| `image` | `{ kind: og \| screenshot, src: /images/resources/<name>.webp, width, height }` or `{ kind: typographic, label }` | no | Same rules as `resources`. Without an image, the row shows a typographic plate (a large serif 해설 and the source language code) |
| `claims` | array of at most 8 `{ claim, judgement, check }` | no | The source's claims in the owner's words (never a quote, at most 300 characters), the owner's `judgement` (`agree` \| `doubt` \| `unverified`), and `check`, how a reader can check it (at most 300 characters). Rendered after the body as the claims ledger |
| `signals` | array of signal ids (slugs) | no (default `[]`) | Library signals this explainer grew out of: the lineage, declared here on the later artifact. Each id must be a file in `src/content/signals/`; a reference to an unpublished signal is withheld from the signal row, not an error |

The body is Markdown. Use `##` and `###` headings: the table of contents is built from them.

### Rejected fields

These never appear in an explainer, and the validator rejects each by name with its reason, at any nesting depth:

- quotes from the source (`quote`, `quotes`, `excerpt`, `passage`, ...)
- model names, costs, token counts (`model`, `cost`, `tokens`, `usage`, `prompt`, ...)
- verification-check results (`verification`, `checks`, `factCheck`, ...)
- private signals and scores (`score`, `rank`, `pipeline`, `rights`, ...). A top-level `signals` **array of ids** is the lineage declaration above and is allowed; an object-valued `signals` (the private scores) is still rejected by name

The forbidden-name lists in `contracts/research-os/research-item.schema.json` (`x-contract`: corpus-only, personal-state and removed-score names) apply as well; the validator reads them from that file. They are not edited for explainers: the file is vendored byte-for-byte by the private repository.

## What `scripts/validate-explainers.mjs` rejects

- an approved entry that is not human reviewed, has no review date, has no body, or still has a `TEMP:` title
- a missing or malformed `source.url`, or a missing `source.name`
- `source.language: "ja"` without source attribution (name and URL both)
- any field outside the allowlist, and any forbidden field (above)
- an `authorship`, `canonicalLanguage`, `review.status`, `source.kind` or `source.language` outside its enum
- a malformed DOI or arXiv id, a malformed tag, a malformed image
- more than 8 `claims`, a claim without `claim`/`check`, a `judgement` outside its enum, any unlisted or forbidden field inside a claim
- a `signals` id that is not slug-safe or names no file in `src/content/signals/`
- an `id` that is not slug-safe, differs from the file name, or is duplicated

Tests: `test/explainers.test.mjs`.

## Published, unpublished, fixtures

An explainer is **published** only when `review.status === "approved"` and `review.humanReviewed === true`. `getPublishedExplainers()` in `src/utils/explainers.ts` is the single definition. An unpublished entry produces no listing row, no detail route (no page is generated for any language), no sitemap entry and no search entry.

Two draft fixtures (`src/content/explainers/fixture-jp-article.md`, a Japanese-source article, and `fixture-en-paper.md`, an English paper with an arXiv id) exist to check the design. Both are `review.status: "draft"` with a `TEMP:` title, so they render nowhere and no fixture string reaches `dist/client/**/index.html`. To see them locally, change `review.status` to `"approved"` in the file (the only field to flip) and revert it afterwards; `content:validate` fails on an approved `TEMP:` title as a reminder.

## Behaviour

- **Reading view**: published explainers are the 해설 view, `/{lang}/reading/` (newest first, one `ExplainerRow` each), under the Reading section's page label and tab bar (`src/components/SectionTabs.astro`). The route always exists; while no explainer is published it shows an empty line (and is noindex and out of the sitemap). They are not part of the 자료 list (the 2026-10-22 arrangement, superseded by Revisions 2026-10-23 and 2026-10-23c, which moved explainers out of the Library).
- **Row** (`ExplainerRow`): same `.entry` grid as other editorial rows, an on-site link (no new tab, no ↗), a 2px accent rule on its left edge, a mono 해설 eyebrow with the source-language chip (accent for `ja`, quiet for `en` / `ko`), the title, the `dek` (two lines), then compact badge, source name and a read link.
- **Detail page, a split reader** (`ExplainerPost` layout). From **1100px** it uses the full window width: a slim toolbar (48px, 1px rule under it; left the breadcrumb 읽을거리 / 해설, centre the explainer title in small mono, truncated, right a "원문 보기 ↗" pill) and two panes under it, **source on the left (45%)** and **explainer on the right (55%)**, a 1px rule between, each pane scrolling on its own (`overflow: auto`, `overscroll-behavior: contain`, `tabindex="0"`, labelled regions); the page itself does not scroll. The **source pane** (on `--paper-deep`) is the source's title page, never its text: the `source` kind and language chip, the original's title as given in `source.name` in the large serif, its host, then the **claims ledger** (numbered entries `[1]`, `[2]`… `#claim-1`…, each with 원문의 주장 / 내 판단 stamp / 확인하는 방법), then the original box ("원문 보기 ↗" and the notice that this is commentary, not a translation). With no `claims` the pane is just the title page and the link. The **explainer pane** is the eyebrow, title (own scale, always larger than prose headings), dek, rule, the full badge, the `.prose` body (capped at 46rem), the related paper card slot, backlinks and tags. **Below 1100px** it is one column and the page scrolls normally: the explainer first, then the source panel with the ledger (DOM order is explainer-first on every width, so the reading order of assistive technology follows the h1). It reuses the blog's `.prose` and has no comments, view counter, feedback box or table of contents.
- **Claim references**: a link to `#claim-n` in the body (write it as `[주장 1](#claim-1)`) is styled as a small numbered chip (mono, `--paper-deep`). On desktop, `public/scripts/explainer-reader.js` scrolls the source pane to that entry, moves focus to it and flashes its background once (smooth scroll and flash are skipped under `prefers-reduced-motion`); without the script the browser's own anchor scroll still works. `scripts/validate-explainers.mjs` rejects a `#claim-n` that has no ledger entry n.
- **Later, not now**: embedding the original document (a PDF or the page itself) in the left pane. Not built: it needs per-source licensing evidence (`canRepublish`-style) and a CSP `frame-src`/`object-src` decision (`docs/ops/csp.md`), and the title page plus claims ledger already carries the "read against the source" job.
- **Badge** (`ProvenanceBadge`): `full` is a `<details>` disclosure (no JavaScript, keyboard operable, 40px target, never wraps) with two fixed segments plus the review date, so the pill keeps its shape across states (below 480px the date leaves the pill and shows in the page's meta row as 검토일; the panel still has it): author ("AI 초안", or "직접 씀" for `owner`) and review ("사람이 검토함" with a check, or "검토 전"). `compact` is inline text for the row.
- **Related paper**: shown only when an approved `papers` entry carries an identical DOI or arXiv id in `source.externalIds` (`findPaperForExplainer()`; versions and resolver prefixes are normalized). Never matched on title. The link goes to that card's anchor on `/{lang}/research/`.
- **Languages**: written in Korean only. The `ko`, `jp` and `en` pages all list and serve the same Korean text under their own page chrome (the `resources` fallback rule); the `jp` and `en` detail pages show a "Korean only" notice, are `noindex` and canonical to the `ko` page, and the sitemap lists the `ko` URL only.
- Not shown on the home page's Library block (external items only).

## Public-repository rules

This repository is public. Docs, code and commit messages do not name external sites or people used as references, the private pipeline's sources or its per-source rights decisions, model names or costs, or verification-pipeline internals. State only that an explainer is bot-drafted and human-reviewed, and the schema above.
