# Item notes

A **note** is the owner's own commentary on one 자료 item. It is what gives an item an on-site page: *an item has a page if and only if it has a note*. Decision: [Revision 2026-10-23b](../decisions/site-structure.md#revision-2026-10-23b-자료-items-get-owner-notes-and-their-own-pages).

## Where notes live

| | |
|---|---|
| Collection | `itemNotes`, `src/content/item-notes/<name>.md` (YAML frontmatter like `picks`, Markdown body) |
| A pick's own note | the Markdown body of `src/content/picks/<slug>.md`; a non-empty body counts as a note, with no `item-notes` file |
| Never edited | `src/content/resources/**` (exported by the pipeline, rendered as delivered) |
| Helpers | `src/utils/item-notes.ts` |
| Validator | `scripts/validate-item-notes.mjs` (`npm run item-notes:validate`, part of `content:validate`) |
| Page | `/{lang}/library/item/{id}/`, `id` = the resource id or the pick slug |

## Frontmatter

| Field | Type | Required | Notes |
|---|---|---|---|
| `about` | `"resource:<id>"` or `"pick:<slug>"` | yes | must resolve to an existing item; a non-draft note must resolve to a published one |
| `writtenAt` | `YYYY-MM-DD` | yes | |
| `updatedAt` | `YYYY-MM-DD` | no | not before `writtenAt` |
| `draft` | boolean | no, default `false` | `true` renders nowhere |
| `tags` | slug strings | no | |

The body is required and must not be empty. At most one note per item (a pick with a body already has one, so it may not also have an `item-notes` file).

## Guardrails

1. **Your own words.** Do not copy the item's description, marketing copy or documentation. A short quotation only when necessary, attributed, and secondary to the note. Automated check: a note whose body repeats a run of 40 or more characters of the item's `summary` is rejected.
2. **Names and images.** The item's name may be used to refer to it. No logos or screenshots beyond the existing small list thumbnail, and only when the resource's `license.canRepublishAssets` is `true`; otherwise the item page shows no image.
3. **Criticism is grounded.** Write what you found in use ("I found X slow when Y"), not an unsupported claim about the maker.
4. **Always link the original.** The item page carries the original box; it is the only external link out of the page.
5. **Non-commercial.** No affiliate links, no tracking parameters.
6. **Draft hygiene.** A non-draft note may not contain `TEMP:`.

## Backlinks

The page lists the site's own writing that links to it ("이 페이지를 언급한 글"), found by scanning the bodies of published posts, explainers, weekly notes, signals and item notes for links to the page's path or to the item's own website. Nothing is inferred from similarity.
