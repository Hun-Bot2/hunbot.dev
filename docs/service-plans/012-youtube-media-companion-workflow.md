# 012: YouTube Media Companion Workflow

Status: Draft.

## Goal

Define a static-first workflow that connects future videos to blog companion notes, Library resource cards, paper cards, deck references, and later newsletter material.

This plan supports the service direction in [`./001-product-service-direction.md`](./001-product-service-direction.md). It does not implement video pages or automate publication by itself.

## Non-goals

- Do not add YouTube API integration.
- Do not add a newsletter provider or signup flow.
- Do not add a database, authentication, payments, user accounts, or upload flow.
- Do not add automated transcript ingestion.
- Do not publish AI-generated summaries without human review.
- Do not create empty video pages that look complete.

## Existing Context

- Blog posts are the canonical long-form content surface.
- Library resources, papers, topics, and decks already have public data models.
- Presentation embeds support local HTML decks, slide images, and PDF fallbacks.
- Search can index public static pages after build.
- The owner plans to publish practical technical videos roughly every 3-4 days.

## Product Decisions

- A video should create durable public knowledge, not only a one-off media post.
- The owner perspective matters more than exhaustive academic coverage.
- Companion notes should explain context, tradeoffs, implementation lessons, and references.
- Any Library cards produced from a video must still pass the same human-review rules.
- Newsletter material can be planned as an output, but newsletter implementation remains deferred.

## Implementation Sequence

1. **Define the media artifact model**
   - Decide whether companion metadata belongs in frontmatter, a small data file, or existing Library relationships.
   - Include optional fields for video URL, companion post ID, resource IDs, paper IDs, topic IDs, and deck IDs.
   - Keep the first model small and manually authored.

2. **Document the production checklist**
   - Idea or paper/tool/resource selection.
   - Draft notes.
   - Human review.
   - Blog companion post.
   - Library cards or paper cards.
   - Optional deck asset.
   - Search and SEO check after publication.

3. **Add validation only if metadata is introduced**
   - Validate referenced post IDs, resources, papers, topics, and decks.
   - Do not validate private draft folders.
   - Do not require every video to have every artifact.

4. **Add static surfaces only after metadata exists**
   - Consider a media companion index only when there are enough reviewed public entries.
   - Link from Library or posts only after routes exist.
   - Do not add placeholder routes.

5. **Update docs**
   - Document how a video companion note is reviewed and connected to Library entries.
   - Keep the public/private boundary explicit.

## Validation

If only docs change, run:

```sh
git diff --check
```

If metadata or routes are added later, run:

```sh
npm run content:validate
npm run library:validate
npm run search:validate
npm run build
```

Manual checks after routes exist:

- Companion note links.
- Library card references.
- Deck links.
- Search result quality.
- Korean, Japanese, and English route behavior.

## Rollback Notes

Revert the media metadata, route, validation, and docs changes together. Do not revert owner-reviewed MDX unless explicitly requested.

## Open Questions

- Should companion notes live as normal blog posts or a separate content collection later?
- Should every video require a Korean companion note before publication?
- Should video metadata include publication status, or should route presence be enough?
- Should transcript text ever be indexed, and if so, where should reviewed transcript text live?

## Recommended Commit Sequence

1. `docs: define media companion workflow`
2. `feat: add static media companion metadata`
3. `feat: surface video companion links`
