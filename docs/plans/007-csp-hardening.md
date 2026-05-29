# 007: CSP Hardening And Script Inventory

## Goal

Tighten Content Security Policy incrementally by inventorying inline scripts, moving one low-risk behavior at a time, and preserving existing UI behavior.

This remains separate because CSP touches security headers, theme bootstrap, analytics, comments, view counters, and interactive components.

## Non-goals

- Do not remove `unsafe-inline` or `unsafe-eval` in one broad change.
- Do not weaken existing Vercel security headers.
- Do not break theme switching, mobile navigation, language picker, table of contents, analytics, comments, or view counter.
- Do not add a new frontend framework.
- Do not change deployment architecture.

## Existing Context

- Security headers live in `vercel.json`.
- Inline or component-level scripts exist in `BaseHead.astro`, `Header.astro`, `TableOfContents.astro`, and selected pages/components.
- Theme logic is duplicated between `BaseHead.astro` and `public/scripts/themeManager.js`.
- Theme persistence cleanup is tracked separately in `docs/plans/005-maintainability-refactors.md` and should land before major CSP tightening if possible.

## Implementation Sequence

1. **Script inventory**
   - Document every inline script and component script that appears in rendered pages.
   - Record purpose, file, affected routes, and whether it must run before paint.
   - Mark high-risk behavior such as theme bootstrap separately from lower-risk deferred behavior.

2. **Choose first extraction target**
   - Start with one low-risk script that does not affect first paint.
   - Preferred first target: a route/component interaction script that can become a public module script without changing generated HTML semantics.
   - Do not start with the theme bootstrap unless theme persistence has already been consolidated.

3. **Move one script**
   - Move the chosen script to `public/scripts/` or a bundled Astro component script according to current project conventions.
   - Keep behavior identical.
   - Avoid global variables unless the existing script already requires them.
   - Add defensive DOM checks so missing elements do not throw.

4. **CSP adjustment**
   - After one script is moved and smoke-tested, tighten only the directive affected by that script.
   - Keep temporary allowances documented.
   - Do not remove all inline allowances until every required inline script has a migration path.

5. **Repeat in later PRs**
   - Treat each CSP tightening step as its own reviewable PR.
   - Keep a running checklist of migrated scripts and remaining allowances.

## Validation

Run:

```sh
npm run build
```

Manual smoke test:

- Theme initial load and toggle.
- Header desktop and mobile navigation.
- Language picker.
- Table of contents trigger and scroll behavior.
- Search page.
- Blog post view counter.
- Giscus comments if configured.
- Analytics scripts do not produce console errors.

Browser checks:

- Open DevTools console.
- Confirm no CSP violations for normal navigation.
- Confirm no missing-script runtime errors.

## Rollback Notes

- Each script extraction should be one commit.
- Revert the script extraction and matching `vercel.json` change together.
- If behavior breaks, restore the previous CSP first, then investigate script loading.

## Open Questions

- Should the inventory live in `docs/security-risk-register.md` or a dedicated CSP doc?
- Should CSP use hashes/nonces for the paint-critical theme bootstrap, or should the bootstrap stay as the last allowed inline script?
- Should theme persistence consolidation from plan 005 be required before any CSP header change?

## Recommended Commit Sequence

1. `docs: inventory inline scripts for csp hardening`
2. `refactor: move first low-risk inline script`
3. `security: tighten csp after script extraction`
