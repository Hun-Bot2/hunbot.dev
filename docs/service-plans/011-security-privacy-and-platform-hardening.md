# 011: Security, Privacy, And Platform Hardening

Status: Draft.

## Goal

Continue hardening the static-first Astro/Vercel site without changing its architecture.

This plan should reduce risk around CSP, third-party scripts, comments, analytics, view counts, and environment handling.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not remove comments or analytics unless the owner chooses that product direction.
- Do not add a new auth system, database, backend, or secret-management platform.
- Do not weaken CSP, frame, referrer, or permissions policies.
- Do not print, read, or document `.env` values.
- Do not make broad security changes without manual smoke tests.

## Existing Context

- `vercel.json` defines security headers.
- `docs/csp-script-inventory.md` lists inline scripts and extraction candidates.
- `src/pages/api/views.ts` is the only dynamic API route.
- `SEC-004`, `SEC-005`, `SEC-006`, `SEC-007`, `SEC-011`, and `SEC-012` remain planned, in progress, or needing review.
- Header menu script extraction already happened.
- Future dynamic stack candidates such as Turso, Turnstile, R2, Cloudflare Workers, or D1 are deferred and require a separate architecture plan.

## Product Decisions

- Harden incrementally.
- Treat each CSP reduction as a separate reviewable change.
- Keep third-party services explicit and documented.
- Fail closed when view counter credentials are missing, without exposing secrets.
- Public UI should degrade cleanly when comments, analytics, or view counts are unavailable.
- Productization features such as accounts, payments, saved resources, and review queues are out of scope for this personal blog phase.

## Implementation Sequence

1. **View counter fail-closed behavior**
   - Improve missing credential handling in `src/pages/api/views.ts`.
   - Avoid constructing clients with missing config.
   - Return controlled non-secret errors.
   - Keep local development behavior clear.

2. **Comments configuration validation**
   - Validate public Giscus config before rendering the external script.
   - Render a disabled or hidden state if required config is missing.
   - Do not print public config values in error logs unless they are already visible and non-sensitive.

3. **Third-party inventory**
   - Document analytics, comments, fonts, KaTeX, and any other external domains.
   - Check whether each service is still wanted.
   - Keep CSP domains aligned with actual usage.

4. **CSP extraction step 2**
   - Pick one low-risk inline script from the inventory.
   - Move it to a public module or Astro-safe pattern.
   - Run build and manual smoke tests.
   - Do not remove `unsafe-inline` until every required inline script has a replacement strategy.

5. **Privacy review for Library pages**
   - Confirm analytics and indexing are intentional on Library and future path pages.
   - Add metadata controls only if needed.

6. **Validation**
   - Extend `views:validate` or `csp:validate` when source rules change.
   - Keep validation lightweight and source-focused.

## Validation

Run relevant checks:

```sh
npm run views:validate
npm run csp:validate
npm run routes:validate
npm run build
```

Manual smoke tests:

- Theme toggle.
- Header menu.
- Floating language picker.
- Table of contents on a post.
- View counter on a post.
- Comments enabled/disabled behavior.
- Search page.

Confirm:

- No secrets are printed.
- CSP is not weakened.
- External links and frames remain controlled.
- Serverless API behavior is deterministic when credentials are missing.

## Rollback Notes

Security changes should be split into small commits. If CSP breaks a page, restore the previous CSP first, then investigate script loading.

## Open Questions

- Which inline script should be extracted after the header menu?
- Should analytics be disabled on any future private-feeling Library surfaces?
- Should comments remain enabled on all blog posts or only selected categories?

## Recommended Commit Sequence

1. `fix: fail closed for missing view counter config`
2. `fix: validate comments configuration`
3. `docs: update third-party service inventory`
4. `security: extract another inline script`
