# 001: Multilingual Library Section Listing Pages

Status: Implemented.

## Goal

Add the first detailed Library section listing pages using the existing PR04 content schemas and PR05 Library hub data.

Primary routes:

- `/ko/library/design/`
- `/ko/library/vibe-coding/`
- `/ko/library/dev-docs/`
- `/ko/library/ai-papers/`
- `/ko/library/useful-feeds/`
- `/ko/library/decks/`
- same route shape for `/en/` and `/jp/`

## Product Intent

The Library hub currently explains the human-reviewed resource system and previews sample items. The next step is to let readers browse each section without adding ingestion, private storage, or automation.

This should feel like a curated reading/research surface, not a marketplace, feed reader, or CMS.

## Non-goals

- Do not add AI paper ingestion.
- Do not add feed ingestion.
- Do not add private candidate storage.
- Do not add a review/promote CLI.
- Do not add comments.
- Do not add authentication.
- Do not add a database.
- Do not add user upload.
- Do not add payment or newsletter features.
- Do not add automatic LLM summarization.
- Do not add external document viewers.
- Do not change blog routing behavior.

## Existing Context

- Library data schemas exist in `src/content.config.ts`.
- Public resource data lives in `src/content/resources/`.
- Public paper data lives in `src/content/papers/`.
- Public topic data lives in `src/content/topics/`.
- Deck metadata lives in `src/data/decks.ts`.
- Library filtering helpers live in `src/utils/library.ts`.
- The Library hub page is `src/pages/[lang]/library.astro`.
- Current language route convention is prefixed language routes: `/ko`, `/jp`, `/en`.

## Data Rules

Resources:

- Show only `status === "approved"`.
- Show only `review.humanReviewed === true`.
- Use localized summary for current language, fallback to Korean.
- Show license/public policy metadata, but do not imply asset reuse unless metadata allows it.

Papers:

- Show only `status === "approved"`.
- Show only `review.humanReviewed === true`.
- Use localized TLDR for current language, fallback to Korean.
- Show venue, year, difficulty, priority, and topics when available.

Topics:

- Show only `status === "active"`.
- Use localized labels/descriptions, fallback to Korean.

Decks:

- Use local deck metadata only.
- Do not expose arbitrary URLs.
- Link to posts or future detail pages only if a route exists.

## UI Direction

- Reuse the Library page visual language.
- Cards should support dark and light theme.
- Use comfortable contrast against the blog background.
- Avoid heavy grey-only blocks.
- Use restrained orange/amber accents, because the blog already uses orange as the primary accent.
- Do not add large images or new UI libraries.
- Keep pages static and server-rendered.

## Proposed Implementation

1. Add a route file for section pages.
   - Preferred: `src/pages/[lang]/library/[section].astro`
   - Generate static paths from a fixed allowlist.

2. Add a section registry.
   - Could live inside the route file if small.
   - Move to `src/utils/library.ts` only if reused by hub and section pages.

3. Update the Library hub cards.
   - Link only to routes that now exist.
   - Keep disabled state only for intentionally deferred sections.

4. Render section-specific listings.
   - `design`, `vibe-coding`, `dev-docs`, `useful-feeds`: resource cards filtered by `resource.data.section`.
   - `ai-papers`: paper cards.
   - `decks`: metadata summary cards from `src/data/decks.ts`.

5. Add localized page metadata.
   - Use existing `BaseHead`.
   - Keep canonical and language routing consistent.
   - Add Pagefind metadata/filter tags.

6. Add empty states.
   - If a section has no approved items, show a clear human-reviewed empty state.
   - Do not create fake public entries just to fill the page.

## Validation

Run:

```sh
npm run build
```

If validation scripts exist, also run:

```sh
npm run library:validate
```

Manual checks:

- `/ko/library/`
- `/en/library/`
- `/jp/library/`
- `/ko/library/design/`
- `/en/library/design/`
- `/jp/library/design/`
- `/ko/library/ai-papers/`
- `/en/library/ai-papers/`
- `/jp/library/ai-papers/`

Confirm:

- No draft, pending, or rejected resources appear.
- No unreviewed resources or papers appear.
- Empty sections do not look broken.
- New links from the hub do not point to non-existent routes.
- Pagefind indexes the new pages.
- Light and dark themes remain readable.

## Rollback Notes

This PR should be easy to revert by removing:

- `src/pages/[lang]/library/[section].astro`
- any section registry changes added for this PR
- hub links to the new section routes
- any docs updates tied only to section pages

It should not require content migration.

## Open Questions

- Should `/library/decks/` show only deck metadata, or should it link to posts that embed decks?
- Should topics be shown on section pages immediately, or deferred until topic pages exist?
- Should resource cards display `lastCheckedAt` in the first version?
- Should external links open in a new tab consistently across all Library pages?

## Recommended Commit

`feat: add multilingual library section pages`
