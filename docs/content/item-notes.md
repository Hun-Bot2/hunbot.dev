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

The body is required and must not be empty (HTML comments do not count as text) once the note is published; a draft may be only the placeholder comment. At most one note per item (a pick with a body already has one, so it may not also have an `item-notes` file).

## Guardrails

1. **Your own words.** Do not copy the item's description, marketing copy or documentation. A short quotation only when necessary, attributed, and secondary to the note. Automated check: a note whose body repeats a run of 40 or more characters of the item's `summary` is rejected.
2. **Names and images.** The item's name may be used to refer to it. The item page shows the item's own preview image (`image`, already delivered with the resource and shown on its card in the list), unaltered, decorative (`alt=""`), by owner decision 2026-10-25. Most resources have `license.canRepublishAssets: false`, so this is not backed by a license check: the owner accepted that the preview image is shown as it is in the list, and the earlier rule (image on the page only when `canRepublishAssets` is `true`) no longer applies. Without an image the page shows the item's monogram tile. No other logos or screenshots are added, and nothing is fetched at build or run time.
3. **Criticism is grounded.** Write what you found in use ("I found X slow when Y"), not an unsupported claim about the maker.
4. **Always link the original.** The item page carries the original box; it is the only external link out of the page.
5. **Non-commercial.** No affiliate links, no tracking parameters.
6. **Draft hygiene.** A non-draft note may not contain `TEMP:`.

## Backlinks

The page lists the site's own writing that links to it ("이 페이지를 언급한 글"), found by scanning the bodies of published posts, explainers, weekly notes, signals and item notes for links to the page's path or to the item's own website. Nothing is inferred from similarity.
