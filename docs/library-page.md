# Library Hub Page

## Purpose

The Library hub is the first public entry point for the human-reviewed Library data model. It introduces the curated sections and shows a small set of approved public resources, active topics, and approved paper cards.

This PR intentionally adds only the hub page. It does not add detailed section pages, ingestion, private candidate storage, comments, authentication, payments, newsletters, or a database.

## Supported Sections

The hub summarizes these planned Library sections:

- Design
- Vibe Coding
- Developer Docs
- AI Papers
- Useful Feeds
- Decks / Presentations

Detailed section pages are deferred. Cards on the hub do not link to non-existent section routes.

## Route Convention

The current site uses explicit language routes for all supported languages:

- `/ko/library/`
- `/jp/library/`
- `/en/library/`

Even though Astro i18n is configured with Korean as the default locale, the existing source and navigation use `/ko/...` links for Korean pages. The Library hub follows that established convention.

## Resource Selection

The page reads from `src/content/resources/` and displays only entries where:

- `status === "approved"`
- `review.humanReviewed === true`

Featured resources are preferred when available. The current hub shows only a small sample set instead of trying to become a full listing page.

## Paper Selection

The page reads from `src/content/papers/` and displays paper cards only where:

- `status === "approved"`
- `review.humanReviewed === true`

Cards show concise metadata such as venue, year, and priority only when available. The hub uses the localized TLDR summary and never stores or renders full paper text.

## Topic Selection

The page reads from `src/content/topics/` and displays only topics where:

- `status === "active"`

Topics are shown as lightweight cards for future filtering and recommendation workflows.

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

This lets the existing search foundation index the hub without adding client-side JavaScript to the page.

## Why Detail Pages Are Deferred

This PR validates the user-facing shape of the Library without expanding the routing surface. Section pages need separate decisions about filtering, pagination, topic pages, paper sorting, and Pagefind facets, so they should be handled in focused future PRs.

## Future PRs

Future work may add:

- Language-aware Design Library pages
- Vibe Coding section pages
- Developer Docs section pages
- AI Papers listing and topic pages
- Useful Feeds pages
- Library-specific Pagefind filters
- Private candidate storage
- Review/promote CLI
- Automated ingestion from approved sources
- Local LLM draft summary generation
- Newsletter and YouTube companion resource pages
