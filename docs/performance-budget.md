# Performance And Media Budget

This site should stay static-first and lightweight as blog posts, Library data, search output, and deck metadata grow.

The first rule is to measure before optimizing. This document does not require bulk image replacement.

## Current Guardrails

- Public images live in `public/images`.
- Public deck samples should stay tiny unless intentionally reviewed.
- PDFs and large binary files should not be added casually.
- Pagefind output should be watched as public content grows.
- Client scripts should stay route-scoped where possible.

## Commands

Run:

```sh
npm run images:inventory
npm run build
npm run perf:budget
```

`perf:budget` reports:

- total public file count and size
- public image count and size
- images above 500 KB
- public assets above 5 MB
- generated HTML file count when build output exists
- Pagefind output size when build output exists

The script fails only on private-looking file extensions in `public/`, such as `.env`, `.key`, `.pem`, `.p12`, and `.pfx`.

## Current Warning Thresholds

- Image warning: 500 KB
- Generic public asset warning: 5 MB
- Pagefind output warning: 8 MB

These are review prompts, not strict deployment blockers.

## Image Optimization Rules

- Optimize selected image groups only after visual review.
- Keep code screenshots readable.
- Prefer SVG for diagrams.
- Prefer WebP or JPEG for screenshots when lossless detail is not needed.
- Avoid changing filenames unless all MDX references are checked.

## Deferred

- Bulk compression of existing images.
- Moving all images into `src/assets`.
- Dynamic image optimization service.
- Image CDN.
- Pagefind scope reduction.
- Route-scoped KaTeX loading.
