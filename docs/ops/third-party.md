# Third-Party Service Inventory

Reviewed: 2026-05-29

This site should remain a static-first personal trust asset. Third-party services must stay explicit, minimal, and aligned with `vercel.json` CSP headers.

Do not add document viewers, upload services, auth providers, payment scripts, or tracking tools without a separate service-plan update.

## Active Services

| Service | Domains | Purpose | Loaded from | Notes |
| --- | --- | --- | --- | --- |
| GoatCounter | `gc.zgo.at`, `hunbot.goatcounter.com`, `*.goatcounter.com` | Lightweight analytics | `src/components/BaseHead.astro` | Public analytics only; keep CSP explicit. |
| Google Analytics | `www.googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com`, `*.googletagmanager.com` | Traffic analytics | `src/components/BaseHead.astro` | Inline bootstrap still requires CSP `unsafe-inline`. |
| Giscus | `giscus.app`, `api.github.com` | Blog comments | `src/components/GiscusComments.astro` | Renders only when required public config is present and valid-looking. |
| Google Fonts | `fonts.googleapis.com`, `fonts.gstatic.com` | Language-specific web fonts | `src/components/BaseHead.astro` | Loaded per language. |
| jsDelivr | `cdn.jsdelivr.net` | KaTeX stylesheet and fonts | `src/components/BaseHead.astro` | Route-scoped loading can be reviewed later. |

## Explicitly Not Approved

No document viewer domains are approved for the current phase.

Do not add:

- Microsoft Office Web Viewer
- Google Slides Viewer
- OneDrive embeds
- ONLYOFFICE or Collabora viewers
- third-party PDF/PPTX conversion services
- external upload widgets
- auth, payment, or newsletter scripts

## First-Party Endpoints

No third-party vendor was added for anonymous feedback. `POST /api/feedback` is first-party and same-origin, already covered by `connect-src 'self'`, and reuses the Upstash Redis instance behind the view counter.

Public discussion stays on Giscus, which requires a GitHub account. The anonymous channel is write-only and never rendered publicly; see the carve-out in [`../decisions/product-boundaries.md`](../decisions/product-boundaries.md).

## Review Rules

- Keep CSP domains matched to actual usage.
- Do not weaken `object-src 'none'`, `base-uri 'self'`, or `frame-ancestors 'none'`.
- Do not print secret values or environment contents.
- Keep comments, analytics, and view counts optional from the user experience.
- Update this file and `docs/csp-script-inventory.md` when adding or removing third-party scripts.

## Future Review

- Decide whether Google Analytics and GoatCounter should both remain active.
- Review whether KaTeX CSS should load only on math-heavy pages.
- Continue extracting inline scripts before removing CSP `unsafe-inline`.
