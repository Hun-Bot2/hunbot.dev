# 003: Editorial Identity And Information Architecture

Status: Implemented.

## Goal

Make the site's purpose obvious without changing the content system: a multilingual personal tech blog evolving into an AI-native knowledge hub for builders.

This plan should improve the public structure and copy around the existing routes, not rewrite MDX posts.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not edit reviewed or unreviewed `.mdx` content in this plan.
- Do not create a CMS, database, newsletter, payment flow, auth, or upload flow.
- Do not change the framework, deployment target, package manager, or route convention.
- Do not add a broad visual redesign.
- Do not add new Library data or real resource datasets.

## Existing Context

- Routes are language-prefixed: `/ko`, `/jp`, and `/en`.
- Header navigation already includes home, blog, categories, tags, search, about, and Library.
- `src/i18n/ui.ts` holds public UI strings and has grown large.
- The Library hub and section pages exist.
- The site owner's current direction is AI product engineering, build logs, paper reviews, technical notes, and curated resources.
- The broader service direction also includes Vibe Coding, Modern Developer Docs, Useful Feeds, Decks, and future YouTube/media companion resources.

## Product Decisions

- Public UI should sound like a product and writing space, not an internal policy document.
- Public UI should communicate the full knowledge curation direction, not only Design.
- Korean can remain the primary editorial language, but English and Japanese UI should not feel like afterthoughts.
- The home page should answer:
  - What is this site?
  - What can readers find here?
  - Where should a first-time reader go next?
- The about page should explain the owner's direction and topic focus without becoming a resume dump.

## Implementation Sequence

1. **Audit current navigation and first-screen copy**
   - Review home, about, blog index, Library, search, tags, and categories.
   - Note where labels overlap or feel unclear.
   - Confirm all nav links are language-aware.

2. **Define site positioning strings**
   - Add concise localized strings for the site's purpose.
   - Keep them short enough for hero, meta description, and navigation contexts.
   - Avoid "policy" words such as review principle, public data, approved data, governance, or internal workflow unless the page is documentation.

3. **Clarify home page sections**
   - Keep the first screen useful, not a marketing landing page.
   - Show latest posts, Library entry points, and search path if appropriate.
   - Avoid large decorative sections that push real content down.

4. **Clarify about page focus**
   - Make the owner profile consistent with current direction.
   - Keep education, projects, and focus areas scannable.
   - Do not add new personal claims or external links without owner review.

5. **Update documentation**
   - Add a short note to `docs/architecture-review.md` or a new docs file only if route/purpose conventions change.

## Validation

Run:

```sh
npm run routes:validate
npm run search:validate
npm run build
```

Manual checks:

- `/ko/`, `/jp/`, `/en/`
- `/ko/about/`, `/jp/about/`, `/en/about/`
- `/ko/library/`, `/jp/library/`, `/en/library/`
- Header navigation from each language.
- Mobile header navigation.

Confirm:

- No non-existent route links were introduced.
- Korean, Japanese, and English pages communicate the same purpose.
- Public copy does not expose internal workflow language.

## Rollback Notes

This plan should touch only UI strings, route copy, and maybe small layout markup. Revert those files if the direction feels wrong.

## Open Questions

- Should the site tagline mention "AI Product Engineer" or "AI-native builder" first?
- Should "Vibe Coding" remain a top-level public label, or should it be explained with more practical wording?
- Should home prioritize latest posts or topic/project entry points?

## Recommended Commit

`content: clarify site purpose and navigation copy`
