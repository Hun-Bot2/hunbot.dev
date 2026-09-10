# Public Image Guidelines

Public images live under `public/images/` and are served as static files. Keep this workflow simple unless a later image pipeline plan explicitly changes it.

This guidance supports the static-first product direction in [`docs/service-plans/001-product-service-direction.md`](./service-plans/001-product-service-direction.md). It applies to blog images, Library illustrations, deck assets, and future media companion images that are intentionally published.

## Recommended Sizes

- Hero images: 1200-1600px wide, ideally under 500 KB.
- Social preview images: 1200x630px.
- Inline screenshots: resize to the largest useful display width, usually 900-1400px.
- Small diagrams and icons: prefer SVG when the artwork is simple and text remains readable.

## Format Guidance

- Use WebP or JPEG for photographic screenshots and large visual scenes.
- Use PNG only when transparency, exact UI pixels, or lossless detail matter.
- Use SVG for simple diagrams, placeholder slides, logos, and vector illustrations.
- Avoid committing large original exports when a smaller publication asset is enough.

## Naming

- Use lowercase, hyphenated names where practical.
- Group images by post, project, or feature folder.
- Keep private drafts and source files outside `public/` until they are ready to publish.

## Inventory

Run:

```sh
npm run images:inventory
```

The command reports large public images by path and size. It does not rewrite or optimize assets. Review the output before deciding whether any image optimization should be a separate content/media PR.

## What Not To Do

- Do not mirror third-party assets unless license and permission are clear.
- Do not commit private screenshots or internal data.
- Do not replace public images in bulk without reviewing affected posts.
- Do not move images into `src/assets` without a deliberate Astro image-pipeline migration.
