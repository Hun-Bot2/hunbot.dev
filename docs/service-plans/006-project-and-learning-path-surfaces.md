# 006: Project And Learning Path Surfaces

Status: Draft.

## Goal

Create static navigation surfaces that connect posts into meaningful project trails and learning paths.

The blog should help readers follow a story: from experiment notes, to build logs, to paper reviews, to resources, to decks.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not rewrite MDX posts in this plan.
- Do not invent content that has not been reviewed by the owner.
- Do not add comments, auth, database, newsletter, payments, or user accounts.
- Do not add recommendation algorithms or AI-generated path generation.
- Do not create empty placeholder pages that look finished.

## Existing Context

- Blog posts already support `category`, `series`, and `seriesOrder`.
- Tags and categories pages exist.
- Library topics exist and can support future grouping.
- Deck metadata can support presentation references.
- Some content is project-oriented, such as build logs and devlogs.
- Future media companion notes can become another entry point into the same paths after review.

## Product Decisions

- Learning paths should be editorial, not algorithmic.
- A path can start as structured metadata and static pages.
- Posts remain the canonical long-form content.
- Library resources and decks can support a path, but should not replace posts.
- YouTube companion artifacts can support paths later, but this plan should not add a media platform.

## Implementation Sequence

1. **Define path metadata**
   - Decide whether paths live in `src/data/learningPaths.ts` or a Content Collection.
   - Keep the first version small and hand-authored.
   - Include localized labels, descriptions, ordered post IDs, optional resource IDs, optional paper IDs, and optional deck IDs.

2. **Add validation**
   - Validate path IDs are slug-safe.
   - Validate referenced posts exist.
   - Validate referenced resources, papers, topics, and decks when possible.
   - Missing optional relationship types should fail only when the registry exists and the ID is wrong.

3. **Add path index page**
   - Routes should be language-aware, for example `/ko/paths/`.
   - Show only paths with enough public content.
   - Keep empty or draft paths hidden.

4. **Add path detail page**
   - Show ordered steps with post links.
   - Show supporting resources, papers, and decks.
   - Use localized fallback text.
   - Keep the page static.

5. **Connect existing surfaces**
   - Link relevant paths from the home page or Library only after routes exist.
   - Do not add broken forward links.

6. **Documentation**
   - Add docs explaining how to create a path and when not to publish one.

## Validation

Run:

```sh
npm run routes:validate
npm run content:validate
npm run build
```

Add a focused path validator if metadata is introduced.

Manual checks:

- `/ko/paths/`, `/jp/paths/`, `/en/paths/` if routes are added.
- One path detail route per language.
- Mobile layout.
- Light and dark theme.

Confirm:

- No draft or unreviewed posts are surfaced accidentally.
- Missing translated posts have clear fallback behavior or are omitted.
- Path ordering is stable.

## Rollback Notes

Remove path metadata, route files, validation script, and nav links added by this plan. Existing blog and Library content should not require rollback.

## Open Questions

- Should paths be called "Projects", "Learning Paths", "Trails", or a Korean-first label?
- Should a path require all three languages before publication?
- Should series navigation and path navigation share one helper?

## Recommended Commit

`feat: add static learning path surfaces`
