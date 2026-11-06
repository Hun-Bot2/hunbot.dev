# AI Research Digest

Status: **Accepted (design), 2026-11-06. Not implemented.** The private Research OS keeps the full record, covering the drafting pipeline, rights handling and the publishing script. This file is the public part: what the site stores, how it renders it, and what it promises readers.

## Two Kinds Of Writing

| | AI Research Digest | Human Editorial |
|---|---|---|
| What | A source-grounded Korean explainer of one paper or article. A model drafts it; the author verifies and approves it | Original posts: opinions, experiments, analysis, personal writing |
| Stored | `src/content/digests/<slug>.json` (structured JSON) | `src/content/blog/**` (MDX, unchanged) |
| Route | `/ko/library/digest/`, `/ko/library/digest/<slug>/` | unchanged |
| Label | "AI가 초안을 쓰고 YYYY-MM-DD에 사람이 검토했습니다", plus the source link and the model name | none |

**Why the Library.** [`site-structure.md`](./site-structure.md) defines Research as the author's own work ("what I studied") and the Library as references. A model-drafted explainer of someone else's work is a reference, so it does not carry the study-log claim.

## Rules

1. **Nothing is published without author approval**, and approval requires that every factual sentence was traced to a span of the source by code. The source text itself and the quotes are never published.
2. **Plain text only.**
   - A digest body is a list of claims (`fact` or `framing`), each one plain text.
   - Components render it through Astro text interpolation: no `set:html`, no `renderMarkdown`, no MDX.
   - The exporter rejects HTML, markdown link and image syntax, code fences and invisible control characters before a file is ever written.
3. **Japanese sources are commentary, not translation**, following each source's reuse terms.
4. **Indexing is opt-in per digest.**
   - The default is `robots: noindex`, and a noindex digest is left out of the sitemap and RSS.
   - The author promotes a digest to `index` explicitly. The thresholds come from measured review data, not from an assumption that the drafts are good.
5. **At most three digests a day.**
6. **Korean only.** Pages pass `availableLangs: ['ko']` to `BaseHead`, so no jp/en alternates are emitted.
7. **Withdrawal keeps the URL.** The page shows a withdrawal notice and is noindex.

## Schema (summary)

`id`, `itemId`, `status` (`published | withdrawn`), `title`, `dek`, `language: "ko"`, `source {name, url, publishedAt, reuse}`, `claims [{kind, text}]`, `related [{kind: resource|digest|paper, id}]`, `authorship {drafter: "bot", model, reviewedBy, reviewedAt}`, `checks {checkerVersion, facts, overrides}`, `robots`, `publishedAt`, `withdrawnAt`, `withdrawnReason`.

Forbidden field names from [`contracts/research-os/research-item.schema.json`](../../contracts/research-os/research-item.schema.json) (`forbiddenInPublicProjection`, `personalStateFieldNames`) apply to this collection too. A contract version bump will state that explicitly (OPEN).

## Publishing

- **The author's machine writes the file.** It commits only that path and pushes to `main`; Vercel's Git integration deploys it.
- **No Deploy Hook, no build-time fetch, no runtime function, no new secret.** CI builds with no credentials, as before ([`ci.yml`](../../.github/workflows/ci.yml)).
- **The MDX workflow is unchanged.**
- **Reruns are idempotent.** Each digest commit carries a `Digest-Sha:` trailer. If a commit succeeds and the push fails, rerunning pushes the same commit; it never creates a second one. The publisher refuses to push while any unrelated commit is unpushed, so publishing a digest can never push other work.

## Site Changes Required

| Change | File |
|---|---|
| `digests` collection (`glob`, `*.json`) | `src/content.config.ts` |
| `robots` prop, default `index, follow`, so existing pages do not change | `src/components/BaseHead.astro` (currently hard-coded, line 198) |
| `DigestBody`, `DigestBadge` | `src/components/digest/` |
| Index + entry routes, `ko` only | `src/pages/[lang]/library/digest/` |
| Sitemap excludes noindex digests | `src/pages/sitemap.xml.ts` |
| `validate-digests.mjs`, added to `content:validate` | `scripts/` |

## Tests

`validate-digests.mjs` checks:
- the schema;
- unique slugs;
- no collision with a `librarySections` slug;
- every `related[]` target exists;
- `withdrawn` ⇒ `noindex`;
- the digest components contain no `set:html` or `renderMarkdown`.

After the build:
- no `/jp|en/library/digest/` routes exist;
- noindex digests are absent from the sitemap and carry the `noindex` meta;
- a fixture claim containing `<b>` renders escaped;
- `links:validate` and `routes:validate` pass;
- existing pages still emit `index, follow`.

Before the first real digest, the author runs one deploy-failure check:
- an invalid digest must fail the build (preview, then once on `main`);
- production must keep serving the previous deployment;
- the result is recorded with its date.

Vercel Hobby limits (100 deployments/day, 32 builds/hour) are far above the three-digests-a-day cap.
