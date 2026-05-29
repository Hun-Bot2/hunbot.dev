# 006: UX And Performance Growth

Status: Implemented.

## Goal

Improve reader browsing and page weight as the blog grows, while preserving existing localized routes and static-first deployment.

This plan groups UX and performance work:

- Add localized blog pagination.
- Add public image size guidelines and a scoped image inventory.

## Non-goals

- Do not change individual post URLs.
- Do not remove existing posts from the first page without pagination routes in place.
- Do not optimize or rewrite large image assets without explicit review.
- Do not move public images into `src/assets`.
- Do not add an image CDN or CMS.

## Existing Context

- Localized blog index route is `src/pages/[lang]/blog/index.astro`.
- Blog posts are language-prefixed under `src/content/blog/{ko,jp,en}/`.
- Public images are served directly from `public/images/`.
- The current public asset workflow is simple and static-first.

## Implementation Sequence

1. **Pagination route design**
   - Keep `/ko/blog/`, `/jp/blog/`, and `/en/blog/` as page 1.
   - Add page-number routes under `/ko/blog/page/2/`, `/jp/blog/page/2/`, and `/en/blog/page/2/`.
   - Use a fixed page size of 12 posts.
   - Sort by `pubDate` descending, matching the current blog index.
   - Do not create `/page/1/` unless a later SEO plan explicitly wants canonical duplicates.

2. **Pagination UI**
   - Add previous/next controls and current page status.
   - Disable unavailable controls without rendering broken links.
   - Keep controls language-aware.
   - Keep the first-page URL canonical as `/[lang]/blog/`.

3. **Image guidelines**
   - Add documentation for recommended image dimensions, file sizes, and naming.
   - Prefer source images under `public/images/...` only when publication intent is clear.
   - Recommend keeping hero/social images inspectable and not over-compressed.
   - Document when PNG is acceptable and when WebP/JPEG/SVG is better.

4. **Image inventory**
   - Add a lightweight inventory command or documented shell checklist.
   - Report large files by path and size.
   - Do not rewrite image files in the same PR unless the user explicitly approves each asset group.

## Validation

Run:

```sh
npm run build
```

Manual checks:

- `/ko/blog/`, `/jp/blog/`, `/en/blog/`
- Last page for each language.
- Previous/next links on first, middle, and last pages.
- Sitemap output includes generated pagination pages if route generation is static.
- No duplicated `/page/1/` route appears.

For images:

- Run the inventory.
- Confirm no binary files are modified unless explicitly approved.

## Rollback Notes

- Remove the page-number route and pagination UI to restore all-post listing.
- Keep image guidelines docs even if pagination is reverted, unless they are inaccurate.
- Image optimization commits should be separate from pagination commits for easy rollback.

## Open Questions

- Should page size stay at 12 posts or align with the visual density of the current blog index?
- Should pagination pages be indexed or marked with canonical links to themselves?
- Should image inventory become an npm script or stay as a documented command?

## Recommended Commit Sequence

1. `feat: add localized blog pagination`
2. `docs: add public image size guidelines`
3. `chore: add image inventory checklist`
