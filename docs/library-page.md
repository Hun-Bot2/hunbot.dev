# Library Hub Page

## Purpose

The Library hub is the first public entry point for the human-reviewed Library data model. It introduces the curated sections and shows a small set of approved public resources, active topics, and approved paper cards.

The current implementation also adds first-pass section listing pages. It does not add ingestion, private candidate storage, comments, authentication, payments, newsletters, or a database.

## Supported Sections

The hub and section pages cover:

- Design
- Vibe Coding
- Developer Docs
- AI Papers
- Useful Feeds
- Decks / Presentations

Cards on the hub link only to the generated section routes listed below.

## Route Convention

The current site uses explicit language routes for all supported languages:

- `/ko/library/`
- `/jp/library/`
- `/en/library/`
- `/ko/library/{design,vibe-coding,dev-docs,ai-papers,useful-feeds,decks}/`
- `/jp/library/{design,vibe-coding,dev-docs,ai-papers,useful-feeds,decks}/`
- `/en/library/{design,vibe-coding,dev-docs,ai-papers,useful-feeds,decks}/`

Even though Astro i18n is configured with Korean as the default locale, the existing source and navigation use `/ko/...` links for Korean pages. The Library hub follows that established convention.

## Resource Selection

The page reads from `src/content/resources/` and displays only entries where:

- `status === "approved"`
- `review.humanReviewed === true`

Featured resources are preferred on the hub. Section pages list approved resources for their section, but still keep the display lightweight.

## Paper Selection

The page reads from `src/content/papers/` and displays paper cards only where:

- `status === "approved"`
- `review.humanReviewed === true`

Cards show concise metadata such as venue, year, and priority only when available. The hub uses the localized TLDR summary and never stores or renders full paper text.

## Topic Selection

The page reads from `src/content/topics/` and displays only topics where:

- `status === "active"`

Topics are shown as lightweight cards for future filtering and recommendation workflows.

## Deck Selection

The `/library/decks/` page reads from the local deck registry in `src/data/decks.ts`. It does not accept arbitrary URLs from content and does not use external document viewers.

## Localization Fallback

Localized text resolves in this order:

1. Current language (`ko`, `jp`, or `en`)
2. Korean
3. English
4. Japanese
5. Empty string

Korean is the primary editorial fallback because approved public Library data requires Korean review text.

## Human Review Rule

Public Library content must be human-reviewed before publication. AI drafts may be used as private drafting aids, but public entries must not be published unless the relevant review metadata confirms human review.

The hub only renders approved public data from the repository. It does not read private candidate notes or generated drafts.

## Pagefind

The Library hub is server-rendered as static HTML and includes Pagefind metadata:

- `language`
- `section=library`

Section pages also add `library-section` as a Pagefind filter. This lets the existing search foundation index the Library without adding client-side JavaScript to these pages.

## Validation

Run:

```sh
npm run library-page:validate
```

The validator checks source wiring, generated section routes after build output exists, Pagefind metadata, and the approved/human-reviewed filtering rules.

## Future PRs

Future work may add:

- Library-specific Pagefind filters
- Private candidate storage
- Review/promote CLI
- Automated ingestion from approved sources
- Local LLM draft summary generation
- Newsletter and YouTube companion resource pages
