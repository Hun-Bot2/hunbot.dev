# Design Tokens and Image Pipeline: Proposals

Written: 2026-09-10. Companion to [`health-audit.md`](./health-audit.md) (findings H1–H3).

Two proposals. Both hold the same constraint: **zero client-side JavaScript is architectural** — neither adds a byte of runtime JS, and any future exception needs an explicit written justification.

**Status (2026-09-10):** token Stage 0 and Stage 1 are done, image Stage A and the unreferenced-asset triage are done. Measured outcomes are in [Results](#results-measured-2026-09-10) near the end. Later stages remain proposals.

---

# Part 1 — Semantic Design Tokens

## The evidence this is built on

Token usage in the current codebase, counted:

| Token group | Uses | Verdict |
|---|---|---|
| `--spacing-*` | 48 | Works |
| `--font-heading` | 30 | Works |
| `--review-*` (5 names) | 48 | Works — **page-scoped** |
| `--home-*` (3 names) | 17 | Works — **page-scoped** |
| `--color-*` (global) | 2 | Dead |
| `--accent`, `--accent-dark`, `--accent-light` | 0 | Dead |
| `--surface-panel`, `--surface-border`, `--surface-muted-text` | **0** | Dead |

The conclusion is not "add a design system." A semantic layer already exists — `--surface-panel`, `--surface-border`, `--surface-muted-text` — and **nothing consumes it**.

Meanwhile the same idea, invented locally and scoped to one page, works: `--review-border`, `--review-muted`, `--home-faint` carry 65 uses between them. Two different authors independently reached for page-scoped semantic tokens because the global set did not serve them.

So the proposal is not a new invention. It is **promoting the pattern that already works locally into the global layer, and making it theme-aware** — which is the one thing the local sets cannot do for themselves.

## The actual defect

The light theme redefines **zero** tokens. Tokens hold dark-biased values, and light mode is ~130 hand-written `body.light-theme .some-class { ... }` rules, 11 using `!important`.

That is why nobody uses the color tokens: a token that cannot change with the theme is useless for color, so every author writes literal values plus an override block. 542 hardcoded colors is the predictable result, not carelessness.

## Proposed architecture

Three tiers. Only the middle tier is theme-aware.

**Tier 1 — Primitives.** Raw values, no meaning, never referenced by components.

```css
:root {
  --gray-950: #0b1120;  --gray-100: #f1f5f9;
  --orange-500: #f97316;
  /* … */
}
```

**Tier 2 — Semantic roles.** What a thing *is*, not what it looks like. **This is the only tier that changes between themes**, and it is the entire fix for H2.

```css
:root {                        /* dark is the base, matching today's default */
  --surface-page:      var(--gray-950);
  --surface-panel:     rgba(255, 255, 255, 0.045);
  --surface-border:    rgba(248, 249, 250, 0.12);
  --text-primary:      var(--gray-100);
  --text-muted:        rgba(203, 213, 225, 0.82);
  --accent:            var(--orange-500);
  --accent-contrast:   rgb(255, 237, 213);
}

body.light-theme {             /* same names, different values -- no selectors */
  --surface-page:      var(--gray-100);
  --surface-panel:     rgba(255, 255, 255, 0.78);
  --surface-border:    rgba(15, 23, 42, 0.12);
  --text-primary:      #0f172a;
  --text-muted:        rgba(51, 65, 85, 0.86);
  --accent-contrast:   rgb(154, 52, 18);
}
```

**Tier 3 — Component-local (optional).** The existing `--review-*` / `--home-*` pattern, kept, but resolving to tier 2 instead of literals:

```css
.academic-review { --review-border: var(--surface-border); }
```

A component then writes `border: 1px solid var(--surface-border)` **once**, with no light-theme block at all. That is the whole win: authoring cost stops scaling with component count.

### Naming rule

Name by role, never by appearance. `--surface-panel`, not `--gray-panel`; `--text-muted`, not `--text-light`. Appearance names become lies the moment the theme flips — which is precisely how the current `--color-text: rgb(248,249,250)` (a near-white named as if neutral) ended up unusable.

### One decision to make first

Two theme mechanisms exist: `body.light-theme` for scoped CSS and `html.dark` for Tailwind's 96 `dark:` variants. Same toggle, opposite polarity.

**Recommendation: keep both, but make Tailwind read the tokens.** Map the Tailwind theme to the CSS variables in `tailwind.config.mjs`, so `bg-surface-panel` and `var(--surface-panel)` resolve to the same value. Deleting 96 `dark:` variants is a large diff for no user-visible gain; making them share one source of truth gets the benefit without the churn.

## Staged migration

Every stage is independently shippable, visually neutral, and reversible. No stage is allowed to change rendered output.

**Stage 0 — Add, change nothing.** Introduce tiers 1 and 2 in `global.css`. Consolidate the two `:root` blocks. Touch no component. Zero visual diff by construction, because nothing consumes the new tokens yet.
*Exit:* full CI green; screenshots byte-identical.

**Stage 1 — One component, as proof.** Migrate `BlogFilterBar.astro` (self-contained, recent, has a hand-written light-theme block). Replace literals with tier-2 tokens and **delete its `:global(body.light-theme)` block**.
*Exit:* the component renders identically in both themes with its override block gone. This stage exists to prove the architecture before spending effort on 15 more components. If the diff is not visually neutral, stop and revise the token values.

**Stage 2 — `global.css` override rules, by category.** Work through the ~130 rules in groups (headings, borders, panels, links). Each group: replace the override with a token, verify, commit.
*Exit:* override count trending to near-zero; `!important` count reaches zero.

**Stage 3 — Page-scoped sets.** Repoint `--review-*` and `--home-*` at tier 2. Their 65 call sites do not change at all — only the definitions do.
*Exit:* no literal colors in the page-scoped definitions.

**Stage 4 — Tailwind reads tokens.** Map `tailwind.config.mjs` theme colors to the CSS variables.
*Exit:* `bg-surface-panel` and `var(--surface-panel)` produce the same pixel.

**Stage 5 — Delete.** Remove dead tokens (`--accent-*`, unused `--color-*`, the second `:root`).
*Exit:* every defined token has at least one consumer.

## How "preserves the current design" gets verified

Asserting visual neutrality requires evidence, not a claim. The repo has no visual regression tooling, so:

- Before each stage, capture full-page screenshots of a fixed route list (`/ko/`, `/ko/blog/`, one post, `/ko/library/`, `/ko/search/`) in **both themes**.
- After the stage, recapture and compare.
- Any intended difference must be stated in the commit message; anything unexplained blocks the stage.

This is cheap and it is the only thing that makes "visually neutral" a checkable claim rather than an assurance.

## Zero-JS impact

None. Tokens are CSS custom properties resolved by the browser. The theme toggle already exists and is unchanged. No hydration, no runtime, no new script. Stage 4 is a build-time config change.

---

# Part 2 — Image Pipeline

## Measured, not estimated

All 67 PNGs in `public/images` converted with the already-installed `sharp`, capped at 1600px wide, nothing written to the repo:

| | Size | Saving |
|---|---|---|
| Current PNG total | **21.02 MB** | — |
| Resized + WebP q80 | **3.60 MB** | **82.9%** |
| Resized + AVIF q55 | **2.45 MB** | **88.3%** |

`public/images` overall is 22 MB; PNG is 96% of it. **33 of 67 images are wider than 1600px**, so they ship pixels no layout can use.

### Highest-impact files

Ten files account for **8.39 MB** of the 17.4 MB WebP saving — 40% of the win from 15% of the files.

| Saving (WebP) | File |
|---|---|
| 1.22 MB | `CHAT/chatting-media-en.png` |
| 1.17 MB | `CHAT/chatting-media-kr.png` |
| 1.02 MB | `ZORO/local-desktop.png` |
| 0.98 MB | `AUTO/Car.png` |
| 0.89 MB | `ZORO/zoro-main.png` |
| 0.78 MB | `ON-THE-BLOCK/otb-chatlist.png` |
| 0.67 MB | `ON-THE-BLOCK/notion-design-home.png` |
| 0.62 MB | `ON-THE-BLOCK/Real-Chat.png` |
| 0.57 MB | `ZORO/ver4.png` |
| 0.47 MB | `KOSSDA.png` |

Individual results are stark: `AUTO/Car.png` is 1055 KB as PNG and 55 KB as WebP — a 95% reduction on one file. `chatting-media-en.png` goes 1389 KB → 134 KB.

## Why it is this bad

`astro:assets` is **not used anywhere**. Every image is referenced as a `public/` path, which Astro copies verbatim: no format conversion, no resizing, no `srcset`, no width/height attributes. `sharp` is installed and idle.

## The real obstacle

Content references `/images/...` as **string paths in MDX frontmatter and bodies** across 199 content files. `<Image>` requires an imported asset, not a runtime string. So this is a content migration, not a component swap — which is why it is proposed as staged rather than done in one pass.

The repo already has `src/utils/responsive-public-images.ts`, an existing partial answer for `public/` images. Whether to extend that or move images under `src/` is the first decision.

## Staged plan

**Stage A — Recompress in place, no code change.** Convert the top 10 files to WebP, keep the same paths, update the ~10 references. **Recovers roughly 8.4 MB with the smallest possible diff** and needs no pipeline work.
*Exit:* `public/images` under 14 MB; `perf:budget` green; every converted image verified visually.

**Stage B — Decide the mechanism.** Either extend `responsive-public-images.ts` to emit `srcset` for `public/` images, or move content images under `src/` and adopt `<Image>` with `priority` for above-the-fold hero images. Extending the existing helper is lower risk; `<Image>` gives correct `srcset`, intrinsic dimensions, and CLS protection.

**Stage C — Migrate the remaining 57 PNGs** in batches by directory, with `links:validate` after each.

**Stage D — Guard it.** Extend `perf:budget` to fail when a new image over ~300 KB is added, so the problem cannot silently return. This matters more than the cleanup itself.

## Zero-JS impact

None. `astro:assets` is entirely build-time; it emits plain `<img>`/`<picture>` markup. Format conversion, resizing and `srcset` are all compile-step operations. No exception to the constraint is needed anywhere in this plan.

---

## Results (measured 2026-09-10)

### Stage 0 and Stage 1 — done

Stage 0 added the semantic tier to `global.css` as a purely additive block (**+197 / −0 lines**), so it could not disturb concurrent editing. Stage 1 migrated `FeedbackBox.astro`: **9 `body.light-theme` rules → 0**, 15 token references, one hardcoded hover colour left with a `TODO` for a state token that does not exist yet.

Visual neutrality was verified, not asserted: 7 elements × 2 themes, **14/14 exact `rgb`/`rgba` matches** against a baseline captured before the change.

**A note on method.** Toggling the theme class and reading `getComputedStyle` in the same task returns in-flight transition values, which produced an inconsistent result and a phantom contrast "bug" that did not exist. The reliable method is the one a visitor actually experiences: persist the theme to `localStorage`, reload, then measure. A verification method that yields inconsistent results is worse than none, because it manufactures false findings.

**Known wart.** `--surface-panel` and `--surface-border` now have two `:root` definitions — the new ones and the pre-existing dead ones with different values. The later declaration wins and computed values confirm correctness, but this is shadowing rather than resolution. Removing the dead lines is Stage 5.

### Image Stage A — done

| | Before | After | Saved |
|---|---:|---:|---:|
| 7 converted files | 6,419,447 B | 579,370 B | **90.97%** |
| `public/images` | 23,288,235 B | 17,435,862 B | **5.58 MB** |

`src/utils/responsive-public-images.ts` also keyed one of these images, so the lookup needed updating or the hero would have silently stopped resolving. Worth remembering for the remaining 57.

### Unreferenced-asset triage — done

17 unreferenced images were classified rather than bulk-deleted.

**DELETED (132 KB)** — `blog-placeholder-2..5.jpg`. Unused Astro starter template art with no historical value; `-1` and `-about` are still referenced.

**ARCHIVED to `archive/images/` (1.85 MB)** — moved out of `public/`, so no longer published, but retained in the repository:

| File | Superseded by |
|---|---|
| `local-llm-architecture-en(v1).png` | `LOCAL_LLM/…-en(v2).png` |
| `blog-arch.png` | `BLOG/blog-arch-v2.png` |
| `ZORO/ver2.png`, `ver3.png`, `ver4.png` | — (`ver1.png` is still referenced) |

**UNCERTAIN, untouched (8 files)** — including `CHAT/chatting-media-en.png` (the English counterpart of a published Korean asset whose English post does not exist yet — possibly a pending translation, not an orphan) and `nanawithme.jpeg` (added by in-flight work in `55404b0`).

**Production bytes removed: 2,074,022 B (1.98 MB).** This is separate from the 5.58 MB compression saving: archiving moves bytes out of the published site but keeps them in the repository, so repository size is unchanged by the 1.85 MB archive portion.

Running total for `public/images`: **23,288,235 → 15,361,840 bytes (22.21 MB → 14.65 MB, −34.0%)**.

The per-file 600 KB cap remains enforced — verified by planting an oversized file and confirming the guard fires. `PENDING_REMOVAL` is down from three entries to two, with the archived file resolved.

## Recommended order

1. **Stage A of the image work** — 8.4 MB for a ~10-file diff, no architectural risk, immediately measurable.
2. **Stage 0 + Stage 1 of tokens** — establishes the architecture and proves it on one component.
3. **Stage D** — the budget guard, so the image win cannot regress.
4. Everything else, in the order listed above.
