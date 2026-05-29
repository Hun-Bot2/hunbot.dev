# 005: Search And Cross-Content Discovery

Status: Draft.

## Goal

Make search useful across blog posts, Library pages, papers, topics, and decks while preserving static Pagefind indexing.

Search should help readers answer: "Where did he write about this?", "Which resources relate to this?", and "Are there papers or decks for this topic?"

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not add hosted search.
- Do not add a database search service.
- Do not add runtime search APIs.
- Do not add AI search, embeddings, vector databases, or RAG in this plan.
- Do not index private notes, candidate data, hidden drafts, or unreviewed generated text.

## Existing Context

- Pagefind is installed and indexed after `astro build`.
- Search routes exist at `/ko/search/`, `/jp/search/`, and `/en/search/`.
- Blog posts add Pagefind filters for language, section, category, and tag.
- Library pages add Pagefind metadata and filters.
- Search currently focuses on the current language route.
- Future media companion notes should become searchable only after they are reviewed public content.

## Product Decisions

- Keep language-scoped search by default.
- Make filters understandable in Korean, Japanese, and English.
- Prefer static metadata filters over client-heavy custom search logic.
- Keep result content plain text, not raw HTML.
- Keep search broad across the knowledge hub while preserving language-scoped defaults.

## Implementation Sequence

1. **Inventory current indexed fields**
   - Confirm which pages include `data-pagefind-body`.
   - Confirm filters for blog and Library output.
   - Document the result count and Pagefind output size after build.

2. **Improve search page copy and layout**
   - Keep the language-specific behavior clear.
   - Add simple guidance for what can be searched.
   - Avoid long explanatory text inside the app UI.

3. **Add Library-aware filters**
   - Section filter: blog, library, paper, resource, deck where supported by generated metadata.
   - Language filter remains locked to the current route unless a future cross-language search mode is added.
   - Category/tag/topic filters should be added only when the indexed metadata is reliable.

4. **Improve result destinations**
   - Verify result URLs are localized and canonical.
   - Confirm Library section pages appear with useful titles.
   - Confirm deck pages or deck metadata are not indexed as broken standalone assets.

5. **Validation**
   - Extend `scripts/validate-search.mjs` for any new required metadata.
   - Do not add a heavy browser test framework for this plan.

6. **Documentation**
   - Update `docs/search.md` with filters, limitations, and expected build commands.

## Validation

Run:

```sh
npm run search:validate
npm run build
```

Manual checks after `npm run preview`:

- `/ko/search/`
- `/jp/search/`
- `/en/search/`
- Query a known blog term.
- Query a known Library term.
- Query a term that should not cross language boundaries.

Confirm:

- Search results link to localized routes.
- Library pages are searchable only when they have public body content.
- Repeated navigation UI is not indexed.
- No private candidate or draft content appears.

## Rollback Notes

Revert search page, validation, and metadata changes. Pagefind dependency and baseline indexing should remain unless this plan explicitly breaks it.

## Open Questions

- Should there be an optional "all languages" search mode?
- Should search results visually group by Blog, Library, Paper, and Deck?
- Should Pagefind default UI be replaced with the component UI later?

## Recommended Commit

`feat: improve multilingual search discovery`
