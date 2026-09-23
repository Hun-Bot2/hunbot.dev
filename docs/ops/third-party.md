# Third-Party Service Inventory

Reviewed: 2026-05-29 · Deployment environments added 2026-09-23

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

## Vercel Deployment Environments

Recorded 2026-09-23.

Vercel builds a **Preview** deployment for every push to every branch, and a **Production**
deployment only for the production branch (`main`). Confirmed against the GitHub deployments
API: the five branch commits of 2026-09-15 and `cac8c4a` each produced `environment: Preview`,
while only the `main` merges produced `Production`. There is no `git` block in `vercel.json`,
so this is Vercel's default and nothing in this repository opts out of it.

**Preview deployments are not public.** A request to a preview URL returns `302` to
`vercel.com/sso-api` together with `x-robots-tag: noindex`, so Deployment Protection
(Vercel Authentication) is on: only account members can open one, and search engines
cannot index it. This is a dashboard setting, not a property of the repository — if it is
ever turned off, every branch push becomes a public URL.

**A preview runs the serverless routes too.** `src/pages/api/views.ts` and
`src/pages/api/feedback.ts` are `prerender = false`, so they exist in every deployment.
Whether a preview reaches production's Redis depends only on how the Upstash variables are
scoped in the Vercel project, and "All Environments" is the dashboard default. Nothing in a
request or response would reveal it, so `getDeploymentKeyNamespace()` in
`src/utils/view-counter.ts` prefixes every Redis key with `VERCEL_ENV` unless it is
`production`. Production keys are byte-identical to the historical ones, so nothing is
migrated; a test pins that, because changing it would orphan every stored view count in
Redis with no error and restart the live counter from zero.

The guard is in code rather than in environment-variable scoping because a dashboard
checkbox can be unticked later without leaving a trace in the repository.

**Pageview pollution cannot be undone.** `pageviews:` is a plain `INCR`; nothing records
which increment came from where. If a preview ever shared the keyspace, the counts are
approximate from then on and there is no correction to apply — which is the reason to
namespace, not to audit.

### The project is not on the account the local CLI logs into

`vercel whoami` returns `hunbot`, and `vercel teams ls` shows that account holds exactly one
scope, `hun-bots-projects` (hobby), containing exactly one project, `v0-jetema-v0`. This
site is not in it. Its deployments resolve under `hun-bots-projects-1a5ac9f8` — a different
scope, as both the preview hostname and the PR check URLs show. Vercel appends a hash when a
slug collides, so two accounts are both named "Hun-Bot's projects".

`vercel link` therefore fails with *Project not found* for every project name, and no
`--project` value can fix it. Use the dashboard for this project, or log the CLI in as the
other identity first. Recorded because the error message points at the project name, which
is the wrong place to look.

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
