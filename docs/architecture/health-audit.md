# Codebase Health Audit

Audited: 2026-09-10. Measured against the committed state at `0ae6d1e`.

Purpose: establish what is actually good, what is actually broken, and what modern Astro practice this site does and does not follow. Written to support a decision about where to invest, not to justify a rewrite.

## Verdict First

The site does not need a rewrite. It needs three specific fixes and a way to stop regressions.

What is genuinely good, and worth protecting from any redesign:

- **Zero JavaScript chunks shipped.** 160 static pages, 176KB of `_astro`, nearly all of it CSS. This is the Islands ideal actually achieved, not just claimed. Any change that ships a framework runtime is a regression.
- **Typed content collections** with Zod schemas, including cross-field refinements.
- **A 27-script validator suite** covering SEO, routes, links, CSP, accessibility, performance budget, product boundaries, and content. This is unusual for a personal site and is the strongest engineering artifact in the repo.
- **Deliberate security posture**: strict CSP, a fail-closed Redis client, slug validation before key construction, rate limiting, and a written risk register.

## Findings

### H1 — The design system is declared but not used

| Measure | Count |
|---|---|
| CSS custom properties defined | 64 |
| `var(--token)` uses in components | 70 |
| Hardcoded `rgb()` / `rgba()` / hex in components | **542** |

Roughly eight hardcoded colors for every token reference. The tokens exist; almost nothing consumes them.

### H2 — Theming is selector overrides, not token swaps (root cause of H1)

**The light theme redefines zero design tokens.** Tokens are declared once with dark-biased values, and light mode is produced by ~130 hand-written `body.light-theme .some-class { ... }` rules, 11 of them using `!important`.

The consequence is structural: every new component must hand-write its own light-mode overrides. Three components added on 2026-09-10 each paid that tax. The cost grows linearly with the component count and is entirely avoidable.

A second mechanism runs in parallel — 96 Tailwind `dark:` variants keyed on `html.dark`, while scoped CSS keys on `body.light-theme`. Two theming systems, same toggle, opposite polarity. `CategoryBadge` uses one and its own container uses the other.

There are also two separate `:root` blocks in `global.css`.

### H3 — The image pipeline is bypassed entirely

`public/images` is 22MB: 74 raw PNG/JPG against 15 webp/avif. `astro:assets` (`<Image>`, `<Picture>`, `getImage`) is **not used anywhere**. Everything is referenced as a `public/` path, which skips format conversion, resizing, and `srcset` generation completely.

This is the largest measurable performance liability, and the fix needs no dependency — `sharp` is already installed and the pipeline is first-party.

### H4 — Nothing enforces the validators

No CI. No `.github/workflows`. No linter, no formatter, no `engines` field, no `.nvmrc`.

The 27 validators only run when someone remembers to run them. This is the highest-leverage gap in the repo: the quality machinery already exists and simply is not wired to anything. Today's session found a draft leak that had been live for some time — CI running the existing suite would have caught it the day it appeared.

Two ad-hoc test files exist (`test/blog-routing.test.mjs`, `test/view-counter.test.mjs`) with no runner configured; they are executed by hand or not at all.

### H5 — Component and page layering is inconsistent

- `src/pages/[lang]/index.astro` is 1,024 lines — a page holding data assembly, markup, and ~600 lines of CSS.
- `src/i18n/ui.ts` is 1,119 lines in a single flat object of ~290 keys per language, with no namespacing beyond a dotted string convention.
- 15 components use scoped `<style>`, 20 use Tailwind utilities, 4 use both. Neither approach is wrong; having no rule about which to use is.
- `global.css` (837) and `academic-review.css` (621) hold 1,458 lines of global CSS, much of it selector overrides that exist only because of H2.

## Current Stack

| Layer | Choice | Assessment |
|---|---|---|
| Framework | Astro 5.16 | Correct. Still the default for content-first sites in 2026. |
| Rendering | Static + one serverless route | Correct and unusually disciplined. |
| Content | Content Collections + MDX + Zod | Correct, and already using Content Layer `loader:`. |
| Styling | Tailwind + scoped CSS + global overrides | **The weak layer.** See H1/H2. |
| Search | Pagefind | Correct. Static, no backend, no vendor. |
| Comments | Giscus | Correct. Identity without an auth system. |
| Data | Upstash Redis via REST | Correct for two small write paths. |
| Images | Raw `public/` | **Wrong.** See H3. |
| Deploy | Vercel adapter | Correct. |
| CI / lint / format | None | **Absent.** See H4. |

### Modern Astro capabilities not yet used

- **`astro:assets`** — the H3 fix. First-party, no dependency.
- **View Transitions (`ClientRouter`)** — cross-page persistence and animated navigation. Ships a small runtime; adopt only if the zero-JS property is consciously traded.
- **Server Islands (`server:defer`)** — render a component per-request inside a static page. Directly applicable to the view counter, which currently fetches client-side.
- **Astro Actions** — typed server functions with validation. Would replace the hand-rolled `/api/feedback` JSON handling.
- **`priority` on `<Image>`** (Astro 5.10+) — sets `loading`/`decoding`/`fetchpriority` correctly for above-the-fold images.

## Candidate Tooling

Ranked by value against this site's actual constraints. Deliberately biased toward first-party and zero-dependency options, per `AGENTS.md`.

**Adopt:**

1. **`astro:assets`** — first-party, `sharp` already installed, fixes H3. No new dependency.
2. **GitHub Actions** — fixes H4. No dependency, highest leverage in this list.
3. **Prettier + ESLint with `eslint-plugin-astro`** — dev dependencies only. The tradeoff is a one-time large formatting diff, which should land as its own isolated commit so it never obscures a real change.

**Consider, with a stated tradeoff:**

4. **Server Islands** for the view counter — removes a client fetch, keeps the page static. Requires the route to become server-rendered.
5. **View Transitions** — genuinely improves navigation feel, but ships a runtime. Only worth it as a deliberate decision, not a default.

**Relevant but not for this site:**

6. **[OpenKB](https://github.com/VectifyAI/OpenKB)** (VectifyAI, Apache-2.0) — compiles raw documents into an interlinked wiki using LLM summarization over PageIndex retrieval. This is a strong reference for the **Discover** pipeline in [`../decisions/discover-direction.md`](../decisions/discover-direction.md), specifically its classify-and-crosslink stage. It is not something to embed in the blog.

Star counts are omitted where they could not be verified from a primary source.

## Recommended Order

Each step is independently shippable and verifiable.

1. **CI first.** Wire the existing 27 validators plus a build into GitHub Actions. Nothing else is safe to change until regressions are caught automatically.
2. **Tokens second.** Define light and dark values on the same token names, then delete the override rules they replace. Convert components incrementally; both mechanisms can coexist during migration.
3. **Images third.** Move content images under `src/` and adopt `<Image>`. Content MDX references `/images/...` paths, so this needs a migration pass and link verification.
4. **Lint/format fourth**, as an isolated commit.
5. **Astro 5 features last**, individually, each with a stated tradeoff.

## What This Audit Does Not Recommend

- A framework migration. Astro is the right choice and the site uses it well.
- A CSS framework swap. The problem is the absence of a token contract, not Tailwind.
- Adding client-side AI features to the blog. They would break the zero-JS property in H-good, and the engineering evidence this site can offer is stronger in its build system, validation, and security work than in embedded demos.
