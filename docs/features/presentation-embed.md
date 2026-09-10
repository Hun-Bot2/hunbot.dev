# PresentationEmbed

`PresentationEmbed` is a backendless component for showing presentation materials inside blog posts and future Library pages. It keeps the site static-first: deck assets are committed under `public/`, metadata is committed under `src/data/decks.ts`, and rendering happens in Astro plus a small browser script for slide-image navigation.

Deck support is part of the broader product direction in [`docs/service-plans/001-product-service-direction.md`](./service-plans/001-product-service-direction.md). It should support paper reviews, experiment notes, technical explanations, build logs, and future YouTube companion notes without turning the blog into a document server.

## Why PPTX Is Not Embedded

PPTX files committed to this repository can be served as static files, but browsers do not reliably render PPTX files as slide decks. An iframe such as `<iframe src="/decks/example/example.pptx"></iframe>` usually becomes a download, a blank frame, or a browser-specific fallback.

For that reason, PPTX is treated as an optional source download only. The primary viewing options are local HTML decks, PDF fallback links, or pre-rendered slide images.

## Backendless Scope

This feature does not add a document server, database, authentication, upload flow, serverless conversion endpoint, browser-side PPTX parser, PDF.js, Office viewer, Google Slides viewer, OneDrive embed, or external SaaS document viewer. Any conversion from PPTX to PDF, HTML, or images must happen outside this PR before assets are committed.

## HTML Decks

Trusted local HTML decks live under `public/decks-html/` and are embedded with a sandboxed iframe. The component validates that `htmlUrl` starts with `/decks-html/`, is a local path, and does not use `http:`, `https:`, `javascript:`, `data:`, `blob:`, protocol-relative URLs, query strings, fragments, backslashes, or path traversal.

The iframe sandbox currently uses:

```html
sandbox="allow-scripts"
```

This allows local Slidev, Reveal.js, or hand-written HTML decks to run presentation JavaScript while avoiding forms, popups, top navigation, and same-origin access by default. If a future deck truly needs `allow-same-origin`, review that deck separately and document the reason before relaxing the sandbox.

## PDF Fallbacks

PDF is the recommended fallback for most decks because it is static, easy to inspect, and broadly supported by browsers. `PresentationEmbed` does not inline PDF through PDF.js. It shows an `Open PDF` action when `pdfUrl` is configured.

## PPTX Source Downloads

PPTX downloads are optional and must not be the primary viewing experience. A PPTX link is shown only when all three metadata fields are set:

```ts
pptxUrl: '/decks/example/example.pptx',
sourceAvailable: true,
sourceReviewed: true,
```

Before setting `sourceReviewed: true`, inspect the PPTX for hidden speaker notes, comments, author metadata, hidden slides, internal links, confidential content, and licensed images or fonts.

## Add A Local HTML Deck

1. Put the built HTML deck under `public/decks-html/my-deck/index.html`.
2. Put related HTML deck assets under the same folder or another local public path reviewed for publication.
3. Add metadata in `src/data/decks.ts`.

Keep presentation files grouped by deck ID under `public/decks/{deck-id}/`. If a deck has separate language versions, add a language folder such as `ko/` or `en/`:

```text
public/decks/my-deck/
  ko/my-deck-ko.pdf
  ko/my-deck-ko.pptx
  en/my-deck-en.pdf
  slides/
```

Use a file name that matches the deck folder, such as `my-deck.pdf`. If a deck has language-specific files, include the language suffix, such as `my-deck-ko.pdf` and `my-deck-ko.pptx`. Use `slides/` for pre-rendered slide images. HTML decks still use `public/decks-html/`.

```ts
{
	id: 'my-deck',
	title: 'My Deck',
	description: 'A local HTML presentation.',
	language: 'en',
	type: 'html',
	aspectRatio: '16:9',
	htmlUrl: '/decks-html/my-deck/index.html',
	pdfUrl: '/decks/my-deck/my-deck.pdf',
	pdfPageCount: null,
	pptxUrl: null,
	sourceAvailable: false,
	sourceReviewed: false,
	slides: [],
}
```

## Add A Slide-Image Deck

1. Pre-render slide images outside this repository workflow.
2. Commit the reviewed images under `public/decks/my-slide-deck/slides/`.
3. Add each slide path explicitly:

```ts
{
	id: 'my-slide-deck',
	title: 'My Slide Deck',
	description: 'A presentation rendered from static slide images.',
	language: 'en',
	type: 'slides',
	aspectRatio: '16:9',
	htmlUrl: null,
	pdfUrl: '/decks/my-slide-deck/my-slide-deck.pdf',
	pdfPageCount: null,
	pptxUrl: null,
	sourceAvailable: false,
	sourceReviewed: false,
	slides: [
		'/decks/my-slide-deck/slides/001.svg',
		'/decks/my-slide-deck/slides/002.svg',
		'/decks/my-slide-deck/slides/003.svg',
	],
}
```

The inline viewer supports previous and next buttons, current slide count, left and right arrow keys while the viewer is focused, basic touch swipe navigation, and fullscreen when the browser supports it. It preloads only the current, previous, and next slide.

## Add A PDF-Only Deck

Use PDF-only metadata when no HTML deck or slide images are available:

```ts
{
	id: 'my-pdf-deck',
	title: 'My PDF Deck',
	description: 'A PDF-only presentation fallback.',
	language: 'en',
	type: 'pdf',
	aspectRatio: '16:9',
	htmlUrl: null,
	pdfUrl: '/decks/my-pdf-deck/my-pdf-deck.pdf',
	pdfPageCount: 24,
	pptxUrl: null,
	sourceAvailable: false,
	sourceReviewed: false,
	slides: [],
}
```

The component renders a fallback card with an `Open PDF` action. `pdfPageCount` is optional for plain fallback cards, but it can be used by custom Library views that provide PDF page controls through browser-supported `#page=` URL fragments.

## Expose PPTX Safely

Only expose PPTX as a secondary source download:

```ts
{
	id: 'my-source-deck',
	title: 'My Source Deck',
	description: 'A presentation with a reviewed PPTX source file.',
	language: 'en',
	type: 'pdf',
	aspectRatio: '16:9',
	htmlUrl: null,
	pdfUrl: '/decks/my-source-deck/my-source-deck.pdf',
	pdfPageCount: 24,
	pptxUrl: '/decks/my-source-deck/my-source-deck.pptx',
	sourceAvailable: true,
	sourceReviewed: true,
	slides: [],
}
```

If either `sourceAvailable` or `sourceReviewed` is false, the PPTX link is not shown.

## Embed In Astro Or MDX

Import the component and pass only a registered deck ID:

```astro
---
import PresentationEmbed from '@/components/decks/PresentationEmbed.astro';
---

<PresentationEmbed deckId="sample-deck" />
```

MDX usage is the same. Do not pass raw deck URLs from MDX.

## Mobile Behavior

On mobile portrait screens, iframe and slide-image decks are hidden behind this hint:

> This presentation is best viewed in landscape mode.

If a PDF exists, the mobile portrait view still shows `Open PDF`. On mobile landscape, the deck area expands toward the viewport width while keeping controls usable.

## Security Policy

- Deck metadata is local and reviewed in `src/data/decks.ts`.
- Asset URLs must be local public paths.
- HTML decks must use the `/decks-html/` prefix.
- PDF, PPTX, and slide-image paths must use the `/decks/` prefix.
- Remote URLs, `javascript:`, `data:`, `blob:`, protocol-relative URLs, query strings, fragments, backslashes, and path traversal are rejected.
- Raw HTML from metadata is never rendered.
- `dangerouslySetInnerHTML` is not used.
- New-tab links use `rel="noopener noreferrer"`.
- PPTX links are gated by `sourceAvailable === true && sourceReviewed === true`.

## Validation

Run:

```bash
npm run deck:validate
```

The script checks deck ID safety, unique IDs, allowed types, supported aspect ratios, local URL policy, unsafe URL rejection, slide path policy, sample slide file existence, sample slide counts, and PPTX download gating.

## Known Limitations

- No automatic PPTX conversion exists.
- No inline PDF renderer is included.
- HTML deck compatibility depends on the restrictive iframe sandbox.
- Slide-image decks require pre-rendered images.
- Large deck assets should be reviewed before committing to the repository.

## Future Plans

- Local PPTX to PDF or image conversion before publication.
- Optional Office viewer proof of concept with a separate document server.
- Optional object storage for large assets.
- Optional PDF.js support.
- Optional Library deck collection.
- Optional Pagefind indexing of deck transcript text.
- Optional media companion workflow that links videos, posts, Library cards, papers, and reviewed deck assets.
