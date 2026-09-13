# Site Hardening: Decisions, 2026-09-10

A record of what was decided in one working session, why, and what the evidence was. Written as a decision log rather than a changelog: the reasoning is the part worth keeping, and it is the part that is hard to reconstruct later.

Related: [`../architecture/health-audit.md`](../architecture/health-audit.md), [`../architecture/design-tokens-and-images.md`](../architecture/design-tokens-and-images.md), [`../ops/ui-ux-plan.md`](../ops/ui-ux-plan.md), [`discover-direction.md`](./discover-direction.md).

---

## 1. Discover is a filter, not a coverage play

**Problem.** Too much happens in AI to follow. Existing options — aggregators, editorial AI blogs — optimize for coverage, leaving the reader to triage.

**Decision.** Build a personalized filter. It never claims an item is objectively important; it claims the item is *potentially relevant to the topics the reader selected*.

**Why this framing.** It is honest, and it is the only version that is sustainable solo. The editorial burden becomes "is this real, and who would care?" rather than "is this among the year's most important papers."

**Consequence.** Discover lives at `/{lang}/discover/` inside the existing site, not as a separate product. It reuses the Astro build, i18n, Pagefind and content collections, and adds no infrastructure.

## 2. The taxonomy is data, not code

**Problem.** A first draft fixed four domains with expandable topics beneath them. That still hard-codes a structure — it only moves the enum up a level.

**Decision.** No domain, topic, or facet value appears in a Zod enum, TypeScript union, route, or component. A topic file with `parent: null` *is* a domain. Filter controls, routes and per-domain feeds are all derived by walking the collection.

**The test that makes it real.** Any taxonomy edit must be a content change with no code change. If it requires touching a `.astro` or `.ts` file, the design is wrong.

**Tradeoff accepted.** Losing enum validation means losing compile-time safety, so a `taxonomy:validate` script replaces it: resolves every parent, rejects cycles, duplicate ids and aliases, and archived parents with active children.

**Deliberate exception.** `depth` stays a closed, ordered set of four. It is a scale used for range filtering; a fifth value changes what the other four mean.

## 3. Postgres is a candidate store, not a serving database

**Problem.** The proposed ingestion pipeline ended `PostgreSQL → Personalized Feed`, which makes Postgres a serving database and quietly undoes the static-first architecture.

**Decision.** The pipeline terminates at **human review**. Approved items are promoted into `src/content/` and the feed is generated at build time.

**Why.** A serving database means a running backend, hosting cost, migrations, backups and eventually auth — and it puts unreviewed AI drafts one query mistake away from being public. Keeping the database strictly private means the worst case of a pipeline bug is a bad draft in a queue, not a bad item on the site.

**Corollary — no cloud yet.** The bottleneck is human review, not compute. Sizing infrastructure for collection optimizes the stage that was never the constraint. Escalation is trigger-based: local → scheduled GitHub Actions → managed Postgres free tier. Summarizing ~50 items/week costs less than the smallest managed database instance.

## 4. Personalization without accounts

**Decision.** Reader interests live in URL query parameters, mirrored to `localStorage`. Content is server-rendered; a client script only shows and hides.

**The line.** *The site must not be able to tell two readers apart.* A preference the server never sees is a rendering detail. A preference the server stores is a user account with extra steps.

This satisfied the entire personalization requirement with zero backend, and is recorded as a carve-out in [`product-boundaries.md`](./product-boundaries.md).

## 5. English-primary for Discover, Korean-primary for the blog

**Decision.** Discover items are English-first with Korean for every item and manual Japanese. Blog posts stay Korean-primary and are unaffected.

**Why.** Nearly all sources are English, so drafting in English keeps the summary close to the source and avoids a translate-then-summarize round trip that loses precision.

**Design consequence.** Rather than give each surface its own fallback chain, every item declares a `canonicalLanguage` and one rule covers both: *requested → canonical → any available*. Two competing hard-coded chains would be a durable source of confusion.

**SEO consequence.** Do not emit `hreflang="ja"` for a page whose content is fallback English. Claiming a translation that does not exist is worse than having no alternate.

## 6. Drafts were publicly published

**Problem found.** `getAllPosts()` was the only code filtering `draft: true`, and **no route called it**. All 8 blog routes read the collection raw. 37 Korean drafts were publicly readable.

**What made it dangerous.** RSS and the sitemap *did* filter correctly. Drafts were therefore readable but unindexed — invisible to every feed and SEO check while visible to any reader.

**How it was found.** Not by looking. By counting: the blog index reported 87 posts and the source had 50 publishable ones. Screenshots showed nothing wrong.

**Method worth keeping.** Compare rendered totals against source totals. A mismatch is a filtering bug and never looks like one on screen.

**Fix.** All routes go through `getAllPosts()`, plus a validator that fails the build if any route reads the collection without a draft filter — verified by planting a bad file and confirming it fired.

## 7. Frontmatter validity is not frontmatter meaning

**Problem found.** 14 files shared a byte-identical template block — same title, same `pubDate`, `description: '설명 입력'`, `tags: ['tag1','tag2']`, `category: 'category'`. 13 published under one title.

**Why nothing caught it.** The Zod schema validates *shape*, not *meaning*: `['tag1','tag2']` is a valid array of strings. Worse, `CATEGORY_ALIASES` mapped `'category' → 'misc'`, actively legitimizing the placeholder.

**Decision.** Two layers. The site excludes placeholder and duplicate posts automatically; the validator reports them as warnings rather than failing the build. Layer one already protects the site, and a hard failure would block all work until the content is rewritten.

**Correction made during implementation.** An initial `<10 character description` heuristic also excluded legitimate posts with terse descriptions. Brevity is a style choice, not a defect; `draft: true` already exists for holding back a stub. The heuristic was removed and detection now matches exact template strings only.

**Scope held.** The gate hides the 14 files. It does not edit them — deciding what those posts should say is the author's call.

## 8. Suggest translations, never redirect by IP

**Decision.** A dismissible banner keyed on `navigator.language`, not geo-IP. No redirect.

**Why.** IP says where a reader is; browser language says what they read. A Korean speaker abroad wants Korean.

**Why it is also the only workable option here.** 37 posts are Korean-only, `academic-reviews` is Korean-only, and there is no `404.astro`. A redirect would send readers to pages that do not exist. A suggestion cannot.

## 9. Anonymous feedback is write-only by construction

**Problem.** Giscus requires a GitHub account, excluding some readers. Full anonymous public comments require a moderation queue, an HTML sanitizer, tighter rate limiting and a captcha — an ongoing operational duty.

**Decision.** Accept anonymous notes that are **never rendered publicly**, read only through a local script.

**Why that one property matters.** It removes the moderation queue, the sanitizer, the captcha and the XSS surface simultaneously. The cost of the feature collapses because the dangerous half was never needed.

**Enforcement, not intention.** `validate-product-boundaries.mjs` fails the build if a `GET` handler appears or a component renders feedback as markup.

## 10. Zero client-side JavaScript is architectural

**Measured.** 160 static pages ship **zero JS chunks**; 176KB of `_astro`, nearly all CSS.

**Decision.** Treat this as a constraint, not a happy accident. View Transitions, Server Islands and Actions stay unadopted unless a concrete requirement justifies the trade, and each exception must be written down.

**Applied.** Both the design-token and image proposals were checked against it. Tokens are CSS custom properties; `astro:assets` is build-time and emits plain `<img>`. Neither needs an exception.

## 11. Design tokens: promote what already works

**Measured.** 542 hardcoded colors against 70 token uses. `--surface-panel`, `--surface-border`, `--surface-muted-text` have **zero** consumers. But page-scoped `--review-*` (48 uses) and `--home-*` (17 uses) work fine.

**Diagnosis.** The light theme redefines **zero** tokens — it is ~130 hand-written selector overrides. A token that cannot change with the theme is useless for color, so every author writes literals plus an override block. 542 hardcoded colors is the predictable result, not carelessness.

**Decision.** Do not invent a system. Two authors independently reached for page-scoped semantic tokens; promote that working pattern to the global layer and make it theme-aware. Only the semantic tier changes between themes: same token names, different values, no selectors.

**Verification requirement.** "Preserves the visual design" must be checkable, not asserted. Screenshots of five routes in both themes, before and after each stage; any unexplained difference blocks the stage.

## 12. CI before anything else

**Problem.** 27 validator scripts, no CI, no linter, no formatter. They ran only when someone remembered.

**Decision.** Wire the existing suite into GitHub Actions before changing anything else. Node 24 to match the Vercel runtime, not the newer local version.

**Why this ranked first.** The quality machinery already existed and was simply not connected. The draft leak had been live for some time; CI running the existing checks would have caught it the day it appeared.

**Judgment call.** `links:validate` started report-only because failing on a pre-existing backlog would block every PR on old debt. It becomes enforced once the backlog reaches zero — fix the debt first, then close the gate behind it.

## 13. Unreferenced assets are triaged, not bulk-deleted

**Problem.** 17 images in `public/` were referenced nowhere yet shipped to every visitor — 5.28 MB of dead weight.

**Decision.** Classify each rather than delete in bulk. Obsolete third-party boilerplate is deleted; the author's own superseded work is moved to `archive/images/`, out of `public/` so it stops being published while staying in the repository; anything ambiguous is left alone.

**Why not just delete.** Two of the "orphans" were not orphans. `CHAT/chatting-media-en.png` is the English counterpart of a published Korean asset whose English post does not exist yet — a pending translation, not dead weight. `nanawithme.jpeg` had been added hours earlier by in-flight work. A bulk delete justified by "nothing references it" would have destroyed both.

**Result.** 132 KB deleted, 1.85 MB archived, 8 files left untouched. **1.98 MB removed from the published site**, reported separately from the 5.58 MB compression saving because archiving relocates bytes rather than reclaiming them.

**Guard.** The 600 KB per-file cap stays enforced, verified by planting an oversized file and confirming it fires. Unresolved cases stay in a named `PENDING_REMOVAL` list with the rationale inline, so a pending decision produces a warning rather than a blocked build.

---

## Recurring principles

1. **Count before looking.** The two most serious defects were found by comparing totals, not by inspection.
2. **Make the guarantee enforceable.** Every fix shipped with a validator that fails if it regresses. A fix without a guard is a fix with a countdown.
3. **Remove the dangerous half rather than defend it.** Anonymous feedback became cheap by never being rendered.
4. **Name the load-bearing decision.** In each proposal, one decision carries the rest; the others follow from it.
5. **Do not silently weaken a rule to make something pass.** When the description heuristic excluded real posts, the rule was corrected deliberately and recorded — not quietly relaxed.
