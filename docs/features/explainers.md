# Explainers

An **explainer** is a long-form Korean article that comments on one paper or one piece of external writing. A bot drafts it and the site owner reviews and approves it; nothing unreviewed is ever exported. It is commentary in its own words: never a translation or a close paraphrase of the source, and it always names and links the source.

Decision record: [`docs/decisions/site-structure.md`](../decisions/site-structure.md#revision-2026-10-22-explainers-join-the-library). This file is the schema and the behaviour; the record is the reasoning.

## Where explainers live

| | |
|---|---|
| Collection | `explainers`, `src/content/explainers/<id>.md` (Markdown body, JSON frontmatter like `resources` and `papers`) |
| Listing | a row in the one Library list, `/{lang}/library/` (`ExplainerRow`), filterable under the existing 종류 facet as `explainer` |
| Detail page | `/{lang}/library/explainers/{id}/` (`ExplainerPost` layout) |
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

The body is Markdown. Use `##` and `###` headings: the table of contents is built from them.

### Rejected fields

These never appear in an explainer, and the validator rejects each by name with its reason, at any nesting depth:

- quotes from the source (`quote`, `quotes`, `excerpt`, `passage`, ...)
- model names, costs, token counts (`model`, `cost`, `tokens`, `usage`, `prompt`, ...)
- verification-check results (`verification`, `checks`, `factCheck`, ...)
- private signals and scores (`signals`, `score`, `rank`, `pipeline`, `rights`, ...)

The forbidden-name lists in `contracts/research-os/research-item.schema.json` (`x-contract`: corpus-only, personal-state and removed-score names) apply as well; the validator reads them from that file. They are not edited for explainers: the file is vendored byte-for-byte by the private repository.

## What `scripts/validate-explainers.mjs` rejects

- an approved entry that is not human reviewed, has no review date, has no body, or still has a `TEMP:` title
- a missing or malformed `source.url`, or a missing `source.name`
- `source.language: "ja"` without source attribution (name and URL both)
- any field outside the allowlist, and any forbidden field (above)
- an `authorship`, `canonicalLanguage`, `review.status`, `source.kind` or `source.language` outside its enum
- a malformed DOI or arXiv id, a malformed tag, a malformed image
- an `id` that is not slug-safe, differs from the file name, or is duplicated

Tests: `test/explainers.test.mjs`.

## Published, unpublished, fixtures

An explainer is **published** only when `review.status === "approved"` and `review.humanReviewed === true`. `getPublishedExplainers()` in `src/utils/explainers.ts` is the single definition. An unpublished entry produces no listing row, no detail route (no page is generated for any language), no sitemap entry and no search entry.

Two draft fixtures (`src/content/explainers/fixture-jp-article.md`, a Japanese-source article, and `fixture-en-paper.md`, an English paper with an arXiv id) exist to check the design. Both are `review.status: "draft"` with a `TEMP:` title, so they render nowhere and no fixture string reaches `dist/client/**/index.html`. To see them locally, change `review.status` to `"approved"` in the file (the only field to flip) and revert it afterwards; `content:validate` fails on an approved `TEMP:` title as a reminder.

## Behaviour

- **Row** (`ExplainerRow`): same `.entry` grid as the external rows, an on-site link (no new tab, no ↗), a 2px accent rule on its left edge, a mono 해설 eyebrow with the source-language chip (accent for `ja`, quiet for `en` / `ko`), the title, the `dek` (two lines), then compact badge, source name and a read link. It carries the same filter data attributes as every Library row.
- **Detail page**: breadcrumb (라이브러리 / 해설), title, dek, a rule, the full badge, the body, the source box (original, language chip, kind, an external "view original" link, and the notice that this is commentary, not a translation), the related paper card slot, tags. It reuses the blog shell and has no comments, view counter or feedback box.
- **Badge** (`ProvenanceBadge`): `full` is a `<details>` disclosure (no JavaScript, keyboard operable, 40px target) with two fixed segments plus the review date, so the pill keeps its shape across states: author ("AI 초안", or "직접 씀" for `owner`) and review ("사람이 검토함" with a check, or "검토 전"). `compact` is inline text for the row.
- **Related paper**: shown only when an approved `papers` entry carries an identical DOI or arXiv id in `source.externalIds` (`findPaperForExplainer()`; versions and resolver prefixes are normalized). Never matched on title. The link goes to that card's anchor on `/{lang}/research/`.
- **Languages**: written in Korean only. The `ko`, `jp` and `en` pages all list and serve the same Korean text under their own page chrome (the `resources` fallback rule); the `jp` and `en` detail pages show a "Korean only" notice, are `noindex` and canonical to the `ko` page, and the sitemap lists the `ko` URL only.
- Not shown on the home page's Library block (external items only).

## Public-repository rules

This repository is public. Docs, code and commit messages do not name external sites or people used as references, the private pipeline's sources or its per-source rights decisions, model names or costs, or verification-pipeline internals. State only that an explainer is bot-drafted and human-reviewed, and the schema above.
