# Library Data Model

This document defines the data foundation for the Library section. The repository now has public schemas, small sample entries, validation, a Library hub, and first-pass section listing pages. It does not add ingestion jobs, private candidate storage, search UI automation, or publishing workflows.

The broader service direction is documented in [`docs/decisions/discover-direction.md`](../decisions/discover-direction.md). This data model should support that full direction: Design, Vibe Coding, Developer Docs, AI Papers, Useful Feeds, Decks, and future media companion resources.

Future Library schema, route, ingestion, or publishing workflow changes should be planned against the build order in [`docs/decisions/discover-direction.md`](../decisions/discover-direction.md) before implementation.

## Purpose

The Library will organize human-reviewed resources, paper cards, and topics for design references, vibe coding, developer documentation, AI papers, useful feeds, community links, YouTube companion notes, and future presentation references.

The current implementation uses Astro content collections with Markdown files under:

- `src/content/resources/`
- `src/content/papers/`
- `src/content/topics/`

Each file uses JSON frontmatter so the lightweight Node validator can parse metadata without adding dependencies.

The public collections are not a private candidate store. They should contain small, reviewed metadata records and original summaries, not raw source material.

## Public Data Vs Private Candidates

Public approved data belongs in this repository. Collected candidates, rough notes, unreviewed links, scraped metadata, and private scoring notes should stay outside `src/content`.

The future workflow should be:

1. Collect candidates privately.
2. Review source, license, usefulness, and safety.
3. Write original summaries.
4. Mark review metadata.
5. Promote only approved, human-reviewed metadata into `src/content`.

## Human Review Rule

Approved public content must be human reviewed:

- `status: "approved"`
- `review.status: "approved"`
- `review.humanReviewed: true`
- `review.reviewedAt` set when practical
- `review.reviewer` set when practical

AI-generated drafts may help writing, but they cannot bypass review. If `review.aiDraftUsed` is true on a paper, `review.humanReviewed` must still be true before publication.

## Resource Schema

Resources represent curated external links.

Required core fields:

- `id`: slug-safe identifier.
- `title`: display title.
- `url`: valid `http` or `https` URL.
- `section`: one of `design`, `vibe-coding`, `dev-docs`, `ai-papers`, `useful-feeds`, `library`.
- `category`: short slug-like category.
- `type`: one of `reference`, `tool`, `docs`, `article`, `community`, `feed`, `design-system`, `component-library`, `paper`, `repo`, `video`.
- `tags`: short slug-like strings.
- `language`: `ko`, `en`, `jp`, `multi`, or `unknown`.
- `summary.ko`: required for approved resources.
- `license`: required license and public-use metadata.
- `source`: manual collection/check metadata.
- `review`: publication review metadata.

Optional relationship fields:

- `relatedTopics`
- `relatedDecks`

`relatedDecks` is intentionally loose in this PR because PR03 keeps deck metadata in a separate registry.

## Paper Schema

Papers represent concise AI paper cards, not copied paper text.

**Superseded 2026-09-14** by
[`docs/decisions/research-item-identity.md`](../decisions/research-item-identity.md)
(T01), applied by
[T09](../plans/research-os-pre-aws/tasks/T09-paper-schema-migration.md). The
single legacy `decision` field (`accepted` / `oral` / `spotlight` / `poster` /
`preprint` / `workshop` / `rejected` / `unknown`) conflated four independent
facts — acceptance status, honor, presentation format, and provenance — and
could not express "accepted **and** oral". It is replaced by the fields
below. See that ADR's §C2 for the full reasoning and the derived value lists.

Required core fields:

- `id`: slug-safe identifier. The **projection** identity — URL-bearing,
  human-chosen, never reused.
- `itemId`: the canonical **work** identity — `itm-` plus a 26-character
  lowercase Crockford-base32 ULID, opaque and minted once. The only join key
  to the private Research OS canonical item and to every note anchored to it.
  Never derived from title, URL, or any other mutable field. See
  [`research-item-identity.md#Canonical-Item-Identity`](../decisions/research-item-identity.md#canonical-item-identity).
- `title`: paper title.
- `url`: canonical paper or landing URL.
- `acceptanceStatus`: the work's status at the referenced venue —
  `accepted`, `rejected`, `preprint`, or `unknown` (default). Registry-backed
  (`src/data/paperVocabularies.ts`), cross-checked by
  `scripts/validate-library.mjs`, never a Zod enum.
- `honors`: array (max 4, default `[]`) of registry-backed honor ids, e.g.
  `oral`, `spotlight` — independent of `acceptanceStatus`, because "accepted
  and oral" was unrepresentable under the old single-enum `decision` field.
- `presentationFormat`: nullable (default `null`) registry-backed
  presentation-format id, e.g. `poster`.
- `provenance`: `VERIFIED` or `RADAR` (default `RADAR`). The one other closed
  Zod enum in this repository besides `depth` — it drives destructive TTL in
  the private Research OS and is never assignable by assertion.
  `scripts/validate-library.mjs` rejects `VERIFIED` unless the record is
  human-reviewed **and** `venue` resolves to a registry id.
- `topics`: topic IDs when applicable.
- `priority`: `high`, `medium`, or `low`.
- `difficulty`: `beginner`, `intermediate`, `advanced`, or `unknown`.
- `status`: `draft`, `pending`, `approved`, or `rejected`. **Publication
  review status — unrelated to `acceptanceStatus`, the venue's decision.**
- `summary`: concise original summary fields.
- `signals`: citation counts and code/project-page observations. `hasCode`
  and `hasProjectPage` are nullable (default `null` — "not yet checked" is
  never the same fact as "false"). The former `topicScore` / `sourceScore` /
  `usefulnessScore` / `freshnessScore` / `totalScore` composite fields are
  removed entirely: ranking inputs, not observations, and no single composite
  quality score is a source-of-truth field anywhere in the system.
- `source`: manual/source metadata and check dates. `source.externalIds` is a
  bounded list (max 12) of `{ scheme, value }` entries — replacing the fixed
  `openReviewId` / `semanticScholarId` / `arxivId` columns — with `scheme`
  cross-checked against `src/data/identifierSchemes.ts`. A `doi` entry's
  value must be a well-formed DOI.
- `review`: publication review metadata.

For approved papers, `summary.ko` must include:

- `tldr`
- `problem`
- `keyIdea`
- `whyItMatters`
- `limitations`
- `readThisIf`

Optional URLs:

- `paperUrl`
- `codeUrl`
- `projectUrl`

Optional relationship fields:

- `relatedResources`
- `relatedDecks`

## Topic Schema

Topics support filtering, paper recommendation, future YouTube planning, and future Library navigation.

Required core fields:

- `id`: slug-safe identifier.
- `label.ko`: Korean label.
- `description.ko`: Korean description.
- `positiveKeywords`: matching hints.
- `negativeKeywords`: exclusion hints.
- `venues`: relevant venues.
- `arxivCategories`: relevant arXiv categories.
- `seedPapers`: known seed paper IDs.
- `reviewPolicy.autoPublish`: defaults to false and should stay false.
- `reviewPolicy.requireHumanReview`: defaults to true and should stay true.
- `status`: `active`, `draft`, or `archived`.

## License And Attribution

Every resource must include license metadata:

- `code`
- `appliesTo`
- `attributionRequired`
- `canRepublishAssets`
- `publicPolicy`
- `note`

If the license or reuse policy is unclear, use:

```json
"publicPolicy": "link-and-summary-only"
```

Do not mirror third-party assets unless license and permission are clear. Prefer linking and summarizing over copying.

## Add A Resource

Create a Markdown file under `src/content/resources/` with JSON frontmatter:

```md
---
{
  "id": "my-resource",
  "title": "My Resource",
  "url": "https://example.com",
  "repoUrl": null,
  "section": "design",
  "category": "ui-reference",
  "type": "reference",
  "tags": ["design", "ui"],
  "language": "en",
  "featured": false,
  "qualityScore": 4,
  "freshness": "stable",
  "status": "approved",
  "summary": {
    "ko": "사람이 검수한 한국어 설명입니다."
  },
  "license": {
    "code": null,
    "appliesTo": null,
    "attributionRequired": false,
    "canRepublishAssets": false,
    "publicPolicy": "link-and-summary-only",
    "note": "Link and summarize only."
  },
  "source": {
    "kind": "manual",
    "firstSeenAt": "2026-05-22",
    "lastCheckedAt": "2026-05-22"
  },
  "review": {
    "status": "approved",
    "humanReviewed": true,
    "reviewedAt": "2026-05-22",
    "reviewer": "owner"
  },
  "relatedTopics": [],
  "relatedDecks": []
}
---

Short internal note only.
```

## Add A Paper Card

Create a Markdown file under `src/content/papers/`. Keep summaries concise and original:

```md
---
{
  "id": "my-paper-card",
  "title": "My Paper Title",
  "url": "https://example.com/paper",
  "paperUrl": "https://example.com/paper.pdf",
  "codeUrl": null,
  "projectUrl": null,
  "venue": "ICLR",
  "year": 2026,
  "decision": "preprint",
  "topics": ["ai-agents"],
  "priority": "medium",
  "difficulty": "intermediate",
  "status": "approved",
  "summary": {
    "ko": {
      "tldr": "짧은 검수 요약입니다.",
      "problem": "문제 정의입니다.",
      "keyIdea": "핵심 아이디어입니다.",
      "whyItMatters": "왜 중요한지 설명합니다.",
      "limitations": "한계입니다.",
      "readThisIf": "이런 경우 읽을 만합니다."
    }
  },
  "signals": {
    "citationCount": null,
    "influentialCitationCount": null,
    "hasCode": false,
    "hasProjectPage": false,
    "topicScore": null,
    "sourceScore": null,
    "usefulnessScore": null,
    "freshnessScore": null,
    "totalScore": null
  },
  "source": {
    "kind": "manual",
    "openReviewId": null,
    "semanticScholarId": null,
    "arxivId": null,
    "firstSeenAt": "2026-05-22",
    "lastCheckedAt": "2026-05-22"
  },
  "review": {
    "status": "approved",
    "humanReviewed": true,
    "aiDraftUsed": false,
    "reviewedAt": "2026-05-22",
    "reviewer": "owner"
  },
  "relatedResources": [],
  "relatedDecks": []
}
---

Short internal note only.
```

## Add A Topic

Create a Markdown file under `src/content/topics/`:

```md
---
{
  "id": "ai-agents",
  "label": {
    "ko": "AI 에이전트",
    "en": "AI Agents"
  },
  "description": {
    "ko": "도구 사용, 계획, reasoning을 포함하는 주제입니다."
  },
  "positiveKeywords": ["agent", "tool use", "planning"],
  "negativeKeywords": [],
  "venues": ["ICLR", "ICML", "NeurIPS"],
  "arxivCategories": ["cs.AI", "cs.LG"],
  "seedPapers": [],
  "reviewPolicy": {
    "autoPublish": false,
    "requireHumanReview": true
  },
  "status": "active"
}
---

Short internal note only.
```

## What Not To Store

Do not store these in public content:

- Raw HTML from third-party pages.
- Full paper text.
- Raw PDF text.
- Large copied abstracts.
- Private candidate notes.
- Unreviewed AI summaries.
- Mirrored images, fonts, datasets, or other assets without clear permission.
- Secrets, tokens, private URLs, or credentials.
- Anything shaped like the private Research OS's corpus record, personal
  state, or removed ranking inputs — see the next section.

**2026-09-15 (T10 — boundary validator hardening):**
[`docs/decisions/research-os-data-contract.md`](../decisions/research-os-data-contract.md)
defines a public/corpus/personal-state/operational boundary for the
(not-yet-built) private Research OS, machine-checkable against
[`contracts/research-os/research-item.schema.json`](../../contracts/research-os/research-item.schema.json)'s
`x-contract` block. `scripts/validate-library.mjs` now reads that block
rather than a hand-typed list, and rejects three additional shapes at any
nesting depth. INV-01/INV-02 are written against `resources` and `papers`;
the validator applies every name below to `topics` as well, deliberately —
a topic carrying `readingState` or `jobState` is the same mistake, and no
topic field collides with any of these names. `mergedInto` is the one name
that genuinely needs per-collection scoping, and it has it:

- **Corpus-only fields** (T01 + T02 — `x-contract.forbiddenInPublicProjection`):
  `fieldSources`, `conflicts`, `statusHistory`, `sameWorkAs`, `dedupKey`,
  `contentHash`, `ttlExempt`, `lifecycle`, `mintedAt`, anything in the `ai`
  or `derived` namespaces, `bibliographic`, `enrichment`, `operational`,
  `signalSheet`, `canonicalUrl`, `projectionId`, `identifierIndex`,
  `embedding`, `abstract`, `fullText` — plus `mergedInto`, but **only** on
  `papers`/`resources`. The `topics` collection carries its own, unrelated
  `mergedInto` (T03's taxonomy lifecycle,
  [`discover-direction.md`](../decisions/discover-direction.md#Taxonomy)) and
  must keep validating.
- **Personal-state / operational fields** (`x-contract.personalStateFieldNames`):
  `readingState`, `readingPriority`, `savedAt`, `unsavedAt`,
  `queuePosition`, `noteCount`, `lastNoteAt`, `lastOpenedAt`, `noteIds`,
  `reviewCandidate`, `ttl`, `expiresAt`, `deviceId`, `jobId`, `jobState`,
  `cursor`, `retryCount`, `idempotencyKey`, `dlqReason`. These belong only in
  the private Research OS's DynamoDB record, never in a public collection —
  the error message says so, distinctly from a corpus-shaped violation,
  because the remedy differs. `readingPriority` is deliberately not named
  `priority`: `papers.priority` is a legitimate, unrelated editorial field.
- **Removed ranking-input fields** (`x-contract.removedScoreFields`):
  `topicScore`, `sourceScore`, `usefulnessScore`, `freshnessScore`,
  `totalScore`. Also checked against `src/content.config.ts` directly — a
  reappearance in the schema is a regression even before any content uses it.

A public-collection record over 8192 bytes (measured against the current
largest real record, 2154 bytes) also fails validation — usually a sign that
corpus data has leaked into a summary field rather than a human having
written one.

The validator rejects fields named `rawHtml`, `rawPdfText`, `fullPdfText`,
`largeCopiedText`, and `copiedAbstract` (unchanged from the original five),
plus the extended lists above.

Nine of T02's fifteen invariants (INV-05 through INV-13, and INV-15) are
contract-file-shaped rather than content-shaped — checked by
`scripts/validate-research-contract.mjs`
(`npm run research-contract:validate`, part of `content:validate`) against
`contracts/research-os/research-item.schema.json` and
`src/utils/canonicalization.ts`, not against `src/content/`. INV-14 (no
public route or component may import `contracts/` or
`src/utils/canonicalization.ts`) lives in
`scripts/validate-product-boundaries.mjs` alongside this repository's other
boundary-shaped checks.

## Validation

Run:

```bash
npm run content:validate
```

For focused Library-only checks, run:

```bash
npm run library:validate
```

The Library validation script checks duplicate IDs, slug-safe IDs, approved review rules, required Korean summaries, forbidden raw/corpus/personal-state/removed-score fields (see "What Not To Store" above), a public-collection record size guard, resource license metadata, resource public policies, topic references, resource references, and safe optional deck IDs.

For the private Research OS contract file's own internal-coherence checks (independent of any content), run:

```bash
npm run research-contract:validate
```

`content:validate` also runs the blog frontmatter checker and deck metadata validator so public content issues can be caught before a full Astro build.

Astro build also validates the collection schemas:

```bash
npm run build:astro
```

## Future Plans

Not implemented in this PR:

- Design Library page.
- AI Papers page.
- Vibe Coding and Developer Docs section depth.
- Private candidate store.
- Review/promote CLI.
- Paper ingestion from OpenReview, arXiv, Semantic Scholar, or OpenAlex.
- Local LLM draft summary generation.
- YouTube/media companion resource linking.
- Newsletter material generated from reviewed public artifacts.
- Paid or pro Library features.
