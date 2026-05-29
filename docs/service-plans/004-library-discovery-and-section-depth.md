# 004: Library Discovery And Section Depth

Status: Draft.

## Goal

Turn the current Library section pages from simple listings into useful static discovery surfaces for resources, papers, topics, and decks.

The Library should feel curated and practical while staying backendless.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not add ingestion from OpenReview, arXiv, Semantic Scholar, OpenAlex, RSS, GitHub, or feeds.
- Do not add private candidate storage.
- Do not add review/promote CLI.
- Do not add authentication, database, upload flow, comments, payments, or newsletter features.
- Do not add large datasets.
- Do not render raw third-party HTML or full paper text.

## Existing Context

- Library content schemas exist for resources, papers, and topics.
- `src/utils/library.ts` owns filtering and localized fallback helpers.
- Routes exist for `/[lang]/library/` and `/[lang]/library/[section]/`.
- Deck metadata lives in `src/data/decks.ts`.
- Pagefind indexes Library hub and section pages.
- Current section pages list approved sample items, but filtering and relationships are minimal.
- The Library scope is intentionally broad: Design, Vibe Coding, Developer Docs, AI Papers, Useful Feeds, Decks, and future media companion resources.

## Product Decisions

- Section pages should stay static and fast.
- Empty sections should look intentional.
- Resource cards should prioritize usefulness over metadata density.
- Paper cards should be readable by builders who may not want the full academic context yet.
- Vibe Coding and Developer Docs sections should feel practical and tool-oriented, not like generic bookmark lists.
- Useful Feeds should remain curated and reviewed until a later ingestion plan exists.
- Decks should link only to registered local assets.

## Implementation Sequence

1. **Define section page display rules**
   - For resource sections, group by category or type when more than a small number of items exists.
   - For AI papers, show topics, difficulty, priority, venue/year, and a concise TLDR.
   - For decks, show type, PDF availability, HTML availability, and source availability without making PPTX primary.

2. **Add static filter controls if content volume warrants it**
   - Prefer server-rendered category groups first.
   - Add client-side filtering only if it materially improves usability.
   - If JavaScript is added, keep it as a small route-scoped public script.

3. **Show related topics and relationships**
   - Resources may show `relatedTopics` when present.
   - Papers should show topic labels when topic IDs resolve.
   - Related decks may show only if the deck ID exists.
   - Missing optional relationships should not break the page.

4. **Improve card hierarchy**
   - Title, summary, key metadata, then action.
   - Avoid crowded badges.
   - Keep external links clearly marked.

5. **Add validation for source wiring**
   - Extend `library-page:validate` only if the helper logic changes.
   - Keep relationship validation light unless it is low-risk.

6. **Update docs**
   - Update `docs/library-page.md` to match any new filters, grouping, or relationship display.

## Validation

Run:

```sh
npm run library:validate
npm run library-page:validate
npm run search:validate
npm run build
```

Manual checks:

- `/ko/library/design/`
- `/ko/library/ai-papers/`
- `/ko/library/decks/`
- Same paths for `/jp/` and `/en/`.
- Light and dark themes.
- Mobile width.

Confirm:

- Draft, pending, rejected, and unreviewed entries do not appear.
- Empty sections do not look broken.
- External links use `rel="noopener noreferrer"`.
- No route links point to pages that do not exist.

## Rollback Notes

Revert the section route, utility helper, and documentation changes. Content schemas should not need rollback unless this plan intentionally changes them.

## Open Questions

- Should topics be clickable before topic detail pages exist?
- Should Library sections expose `lastCheckedAt`, or keep that metadata hidden?
- Should resource cards show license policy publicly, or is that too noisy?

## Recommended Commit

`feat: improve library section discovery`
