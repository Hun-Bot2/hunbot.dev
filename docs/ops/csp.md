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
| `src/components/Header.astro` | Skip-link click handler (moves focus to `#main-content`) | All pages with header | No | Small inline script; candidate for extraction alongside `header-menu.js` |
| `src/components/FloatingLanguagePicker.astro` | Floating language chip toggle | Localized pages | No | Candidate for next extraction |
| `src/components/TableOfContents.astro` | Table of contents: heading collection, current-section highlight, toggle panel below 1100px | Blog posts, reviews | No | Larger extraction; test the scroll-based current-section highlight and the mobile panel |
| `src/components/ViewCounter.astro` | Fetch and post page views | Blog posts | No | Could become a public module after slug data binding is designed |
| `src/pages/[lang]/search.astro` | Pagefind UI initialization and language filter | Search pages | No | Candidate for extraction after Pagefind config is stabilized |
| `src/pages/[lang]/research/decks.astro` | Slide-deck preview viewer (prev/next/counter) for the highlighted project deck | `/{lang}/research/decks/` | No | Moved from `library/[section].astro`'s decks branch (docs/decisions/site-structure.md#2); same script, new file |
| `src/pages/index.astro` | Root redirect | Root fallback page | Yes | Keep until converted to static redirect config |
| `src/components/GiscusComments.astro` | Inline loader that injects the Giscus client with the site's current theme and forwards theme toggles to the iframe | Blog posts | No | Third-party script; keep CSP domain explicit |
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
2. `src/pages/[lang]/search.astro`
3. `ViewCounter.astro`
4. `TableOfContents.astro`
5. The skip-link handler in `Header.astro`

Do not remove `unsafe-inline` until the theme bootstrap, analytics bootstrap, route scripts, and root redirect scripts have a replacement strategy.

_Inventory re-checked after the Atelier redesign (2026-10-03): the home page and `LanguagePicker.astro` no longer ship inline scripts, and the redesign added no new inline scripts or third-party domains._
