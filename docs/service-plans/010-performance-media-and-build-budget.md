# 010: Performance, Media, And Build Budget

Status: Implemented.

## Goal

Keep the blog fast as content, images, Library data, and search output grow.

This plan should introduce measured performance work, not broad asset rewrites.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not bulk-compress or replace public images without owner review.
- Do not move all images into `src/assets`.
- Do not add an image CDN, CMS, or external optimization service.
- Do not rewrite MDX image usage without checking affected posts.
- Do not add a heavy performance test framework.

## Existing Context

- Public images live under `public/images`.
- `docs/public-images.md` defines image guidelines.
- `npm run images:inventory` reports large public images.
- Pagefind adds static index output after build.
- Inline and public scripts exist for theme, header, TOC, views, search, and other interactions.
- Performance risk register flags image size, global CSS/JS, fonts, KaTeX, and build-time collection scans.
- Future media companion notes and deck assets can increase static output size if they are not planned deliberately.

## Product Decisions

- Measure before optimizing.
- Optimize selected assets in small owner-approved groups.
- Keep original/private source files out of public paths unless intentionally published.
- Prefer static output and build-time validation over runtime transformation.
- Do not add large video, transcript, PDF, or deck assets to public paths without review.

## Implementation Sequence

1. **Establish a baseline**
   - Run build and record generated page count.
   - Run image inventory and record large assets.
   - Record Pagefind indexed page count and word count.
   - Note build time roughly, without overfitting to local machine variance.

2. **Choose a first media group**
   - Pick one project or post folder with oversized images.
   - Review images manually before replacing.
   - Keep filenames stable only if replacements are drop-in safe.

3. **Optimize selected images**
   - Resize screenshots to useful display dimensions.
   - Prefer WebP/JPEG for screenshots unless lossless detail is needed.
   - Preserve SVG for diagrams.
   - Do not degrade readability of code, UI, or paper figures.

4. **Review global assets**
   - Check whether font packages are actually used.
   - Check whether KaTeX CSS must load on every page.
   - Keep changes separate from image optimization if risk is high.

5. **Review client scripts**
   - Confirm dormant public scripts are not loaded globally.
   - Keep interactive scripts route-scoped.
   - Coordinate with CSP plan when moving inline scripts.

6. **Add guardrails**
   - Improve inventory docs or script output only if it helps future review.
   - Avoid failing builds on image size until thresholds are agreed.

## Validation

Run:

```sh
npm run images:inventory
npm run build
```

Manual checks:

- Posts affected by optimized images.
- Mobile image readability.
- Search output still builds.
- Visual comparison for edited assets.

Confirm:

- No private screenshots or source assets were introduced.
- No broken image paths.
- No route output regression.

## Rollback Notes

Image optimization should be committed by asset group. Revert the affected public files if quality regresses.

## Open Questions

- Should the image inventory produce JSON for historical comparison?
- Should selected hero images get explicit width/height metadata?
- Should KaTeX CSS be loaded only on math pages?

## Recommended Commit Sequence

1. `chore: record performance baseline`
2. `perf: optimize selected public images`
3. `perf: reduce global asset loading`
