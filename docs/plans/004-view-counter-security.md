# 004: View Counter Security

## Goal

Harden the page-view API so Redis keys remain safe and high-volume writes are limited without changing the public view-counter behavior for normal readers.

This plan groups related security work:

- Validate view slugs and Redis key construction.
- Add lightweight abuse protection after slug safety is confirmed.
- Improve IP parsing without logging sensitive request details.

## Non-goals

- Do not replace Upstash Redis.
- Do not add authentication.
- Do not add a database.
- Do not expose or log Redis credentials.
- Do not change the visible `ViewCounter` UI unless required by API response compatibility.

## Existing Context

- The API route is `src/pages/api/views.ts`.
- View helper functions exist in `src/utils/view-counter.ts`.
- Current helpers already define a maximum slug length and language-prefixed slug pattern.
- Current duplicate suppression uses a one-hour history key per client and slug.
- Localhost POST requests currently skip increment behavior.

## Implementation Sequence

1. **Audit existing slug validation**
   - Confirm `isValidViewSlug` accepts all current generated blog post IDs used by `ViewCounter`.
   - Confirm it rejects missing, oversized, path traversal, absolute URLs, query strings, fragments, and control characters.
   - Keep language-prefixed slugs as the accepted shape.

2. **Centralize key construction**
   - Ensure all Redis keys are created only through helper functions.
   - Keep key prefixes explicit: pageviews, history, and any new rate-limit bucket.
   - Encode or hash client-derived values before inserting them into keys.
   - Do not include raw IPs in logs or response bodies.

3. **Safer client identity parsing**
   - Prefer the first valid IP-like value from `x-forwarded-for`.
   - Fall back to a stable safe placeholder only when no usable value exists.
   - Trim whitespace and cap the value before key construction.
   - Do not trust arbitrary comma-separated content beyond the first candidate.

4. **Lightweight abuse protection**
   - Add a short-window rate-limit bucket per client before incrementing.
   - Keep the existing duplicate suppression per slug.
   - Return `429` only for clearly excessive POST volume.
   - Keep GET requests available for normal page loads.
   - Preserve localhost skip behavior.

5. **Response compatibility**
   - Continue returning `{ views }` for normal success.
   - Continue returning `{ views, duplicated: true }` for duplicate views.
   - For localhost skip, continue returning `{ views, skipped: true }`.
   - Error responses should not reveal Redis key names, tokens, or raw client identifiers.

## Validation

Run local API checks with representative requests:

- GET missing slug: `400`
- GET invalid slug: `400`
- GET valid slug: `200`
- POST localhost valid slug: `200` with `skipped: true`
- POST duplicate valid slug: `200` with `duplicated: true`
- POST oversized slug: `400`
- POST repeated high-volume requests: eventually `429`

Also run:

```sh
npm run build
```

## Rollback Notes

- Rate-limit logic should be isolated so it can be reverted without removing slug validation.
- Slug validation and key builders should roll back together only if they break valid production slugs.
- Do not roll back by weakening Redis credential handling or logging more request data.

## Open Questions

- What exact short-window limit should production use for POST requests?
- Should rate-limit buckets use raw client ID with encoding or a hash?
- Should `429` include a `Retry-After` header?

## Recommended Commit Sequence

1. `test: cover view counter slug validation`
2. `fix: harden view counter client keys`
3. `feat: add view counter rate limiting`
