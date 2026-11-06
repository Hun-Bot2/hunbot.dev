# Item notes

A **note** is the owner's own commentary on one 자료 item. Since 2026-10-25 **every published item has an on-site page** (`/{lang}/library/item/{id}/`) and the note *fills* it ([Revision 2026-10-23c](../decisions/site-structure.md#revision-2026-10-23c-reading-becomes-a-fourth-public-surface), addendum; this supersedes "an item has a page if and only if it has a note" of [Revision 2026-10-23b](../decisions/site-structure.md#revision-2026-10-23b-자료-items-get-owner-notes-and-their-own-pages)). A page **with no note yet** shows the item's image or monogram, title, delivered summary, kind · area · topic, the original box and one line, "아직 작성한 노트가 없습니다."; it is `noindex` and not in the sitemap until a note exists. The 노트 badge on a card means "has an owner note".

## Starting a note

`npm run note:new -- <item-id>` (`scripts/new-item-note.mjs`) checks that the id is a published resource id or a non-draft pick slug, refuses if the item already has a note (an `item-notes` file, or a pick with its own body), and writes `src/content/item-notes/<id>.md` as a draft: `about`, `writtenAt` (today), `draft: true` and a placeholder HTML comment as the body. The validator accepts an empty body (or only a comment) **only while `draft: true`**; write the note, then delete the `draft: true` line to publish it.

## Where notes live

| | |
|---|---|
| Collection | `itemNotes`, `src/content/item-notes/<name>.md` (YAML frontmatter like `picks`, Markdown body) |
| A pick's own note | the Markdown body of `src/content/picks/<slug>.md`; a non-empty body counts as a note, with no `item-notes` file |
| Never edited | `src/content/resources/**` (exported by the pipeline, rendered as delivered) |
| Helpers | `src/utils/item-notes.ts` |
| Validator | `scripts/validate-item-notes.mjs` (`npm run item-notes:validate`, part of `content:validate`) |
| Page | `/{lang}/library/item/{id}/`, `id` = the resource id or the pick slug; one per published item |
| Starter | `npm run note:new -- <item-id>` (`scripts/new-item-note.mjs`) |

## Frontmatter

| Field | Type | Required | Notes |
|---|---|---|---|
| `about` | `"resource:<id>"` or `"pick:<slug>"` | yes | must resolve to an existing item; a non-draft note must resolve to a published one |
| `writtenAt` | `YYYY-MM-DD` | yes | |
| `updatedAt` | `YYYY-MM-DD` | no | not before `writtenAt` |
| `draft` | boolean | no, default `false` | `true` renders nowhere |
| `tags` | slug strings | no | |
| `authorship` | `owner` or `bot` | no, default `owner` | `bot`: a draft written from public sources, see [Bot drafts](#bot-drafts) |
| `sources` | up to 8 `http(s)` URLs | no, default `[]`; required and non-empty when `authorship: bot` | the sources a bot draft was written from |
| `reviewedAt` | `YYYY-MM-DD` | required for a non-draft bot note | the owner's review date |

The body is required and must not be empty (HTML comments do not count as text) once the note is published; a draft may be only the placeholder comment. At most one note per item (a pick with a body already has one, so it may not also have an `item-notes` file).

## Bot drafts

Since 2026-10-25 an item page may carry a **draft written from the item's documentation and public sources**, not in the owner's words, so every item has an explanation. It is an `itemNotes` entry with `authorship: bot`.

- **Labelled.** The page shows "AI 초안 · 사람이 검토함 {reviewedAt}" in its meta line and, after the body, a "참고한 자료" list of `sources` (host and path, external links).
- **Reviewed before it shows.** A bot note is `draft: true` until the owner has read it. Publishing means setting `reviewedAt` to the review date and removing `draft: true`; the validator rejects a non-draft bot note without `reviewedAt`, and the site ignores one even if it slips through. Drafts never render anywhere (no page content, no 노트 badge, no sitemap entry, no backlinks).
- **Writing rules.** Own sentences (no copied documentation or marketing copy; the 40-character guardrail below applies); facts only from the cited `sources`, and `sources` is required; no first-person claims of use ("I use", "I found") because the owner did not write it; sections in order with `##` headings: 무엇인가 / 이럴 때 쓴다 / 핵심 기능 / 시작하는 법 / 알아둘 점. Code blocks are rendered like blog code.
- **Taking over.** The owner may rewrite a draft freely. Once it is theirs, change `authorship` to `owner` (`sources` and `reviewedAt` may stay or go); the label then disappears.

## Guardrails

1. **Your own words.** Do not copy the item's description, marketing copy or documentation. A short quotation only when necessary, attributed, and secondary to the note. Automated check: a note whose body repeats a run of 40 or more characters of the item's `summary` is rejected.
2. **Names and images.** The item's name may be used to refer to it. The item page shows the item's own preview image (`image`, already delivered with the resource and shown on its card in the list), unaltered, decorative (`alt=""`), by owner decision 2026-10-25. Most resources have `license.canRepublishAssets: false`, so this is not backed by a license check: the owner accepted that the preview image is shown as it is in the list, and the earlier rule (image on the page only when `canRepublishAssets` is `true`) no longer applies. Without an image the page shows the item's monogram tile. No other logos or screenshots are added, and nothing is fetched at build or run time.
3. **Criticism is grounded.** Write what you found in use ("I found X slow when Y"), not an unsupported claim about the maker.
4. **Always link the original.** The item page carries the original box; it is the only external link out of the page.
5. **Non-commercial.** No affiliate links, no tracking parameters.
6. **Draft hygiene.** A non-draft note may not contain `TEMP:`.

## Backlinks

The page lists the site's own writing that links to it ("이 페이지를 언급한 글"), found by scanning the bodies of published posts, explainers, weekly notes, signals and item notes for links to the page's path or to the item's own website. Nothing is inferred from similarity.
