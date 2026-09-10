# CSP Script Inventory

This inventory supports incremental CSP hardening. The site still needs some inline scripts, so `script-src 'unsafe-inline'` remains for now. `unsafe-eval` has been removed from the Vercel CSP after moving the first low-risk interaction script out of an Astro component.

Product direction reference: [`docs/decisions/discover-direction.md`](../decisions/discover-direction.md). Future Library, media companion, or productization work should not add third-party scripts or document viewers without updating this inventory and the CSP plan.

Third-party service reference: [`docs/third-party-services.md`](./third-party-services.md).

## Current Scripts

| File | Purpose | Routes | Paint Critical | Status |
| --- | --- | --- | --- | --- |
| `src/components/BaseHead.astro` | JSON-LD website/person metadata | All pages | No | Inline structured data, safe to keep until JSON-LD helper exists |
| `src/components/BaseHead.astro` | Google Analytics bootstrap | All pages | No | Inline third-party bootstrap still requires `unsafe-inline` |
| `src/components/BaseHead.astro` | Theme bootstrap and toggle binding | All pages | Yes | Keep inline until a hash/nonce or pre-paint alternative is designed |
| `src/components/Header.astro` + `public/scripts/header-menu.js` | Mobile menu toggle and outside-click close | All pages with header | No | Migrated to public module script |
| `src/components/FloatingLanguagePicker.astro` | Floating language menu toggle | Localized pages | No | Candidate for next extraction |
| `src/components/LanguagePicker.astro` | Inline language menu toggle | Pages using this component | No | Candidate for next extraction |
| `src/components/TableOfContents.astro` | Draggable table of contents and heading links | Blog posts | No | Larger extraction; test drag, resize, and localStorage behavior |
| `src/components/ViewCounter.astro` | Fetch and post page views | Blog posts | No | Could become a public module after slug data binding is designed |
| `src/pages/[lang]/search.astro` | Pagefind UI initialization and language filter | Search pages | No | Candidate for extraction after Pagefind config is stabilized |
| `src/pages/[lang]/about.astro` | About page timeline/filter interactions | About page | No | Candidate for route-specific public module |
| `src/pages/[lang]/index.astro` | Home page interaction script | Home page | No | Candidate for route-specific public module |
| `src/pages/about.astro`, `src/pages/index.astro` | Root redirects | Root fallback pages | Yes | Keep until converted to static redirect config |
| `src/components/GiscusComments.astro` | External comments script | Blog posts | No | Third-party script; keep CSP domain explicit |
| `src/pages/[lang]/blog/index.astro` + `public/scripts/blog-filters.js` | Blog listing category/year/series filters | Blog listing | No | External module script; no CSP change needed |
| `src/layouts/BlogPost.astro` + `public/scripts/feedback-box.js` | Anonymous feedback submission | Blog posts | No | External module script; same-origin fetch covered by `connect-src 'self'` |
| `src/layouts/BlogPost.astro` + `public/scripts/language-suggest.js` | Translation suggestion banner | Blog posts | No | External module script; no redirect, no CSP change needed |

## CSP State

Current Vercel CSP keeps:

- `script-src 'unsafe-inline'` because multiple inline scripts remain.
- Explicit script domains for GoatCounter, Giscus, and Google Tag Manager.
- `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'` as low-risk hardening.

Current Vercel CSP removes:

- `script-src 'unsafe-eval'`

## Next Extraction Candidates

1. `FloatingLanguagePicker.astro`
2. `LanguagePicker.astro`
3. `src/pages/[lang]/search.astro`
4. `ViewCounter.astro`
5. `TableOfContents.astro`

Do not remove `unsafe-inline` until the theme bootstrap, analytics bootstrap, route scripts, and root redirect scripts have a replacement strategy.
