# Product Separation Boundaries

Reviewed: 2026-05-29

`hun-bot.dev` should stay a personal trust asset: static-first, multilingual, low-cost, and useful without login or payment.

Future paid, team, or private workflow features need a separate product decision before implementation.

## What Stays Public And Free

- Blog posts.
- Public Library hub and section pages.
- Approved Library resources.
- Approved paper cards.
- Active topics.
- Backendless deck metadata and reviewed deck assets.
- Public learning paths.
- Search over public static pages.
- The Discover feed, its taxonomy, and its per-domain RSS feeds.

## What Must Stay Private

- Candidate resource lists.
- Raw notes and rough video scripts.
- Raw PDF text or copied paper text.
- Embeddings and vector indexes.
- Unreviewed LLM outputs.
- Private scoring notes.
- Lead lists, customer details, workshop notes, or commercial proposals.
- Any future Pro or Team data.

## Demand Signals To Track Manually

Use manual signals before adding product infrastructure:

- repeated reader questions
- direct consulting or workshop requests
- content performance patterns
- recurring search topics
- repeated requests for paper/tool summaries
- sponsorship or report interest

Do not add extra analytics vendors, newsletter tools, lead forms, or CRM integrations only to validate this plan.

## Future Separation Options

If a paid or team-oriented product becomes justified, decide whether it belongs in:

- a separate domain
- a subdomain
- a clearly separated route group
- a separate repository or service

Before implementation, write a narrow architecture decision covering:

- public/private data boundary
- account and authentication model
- billing or sponsorship model
- data retention and deletion policy
- support burden
- deployment/runtime cost
- legal and privacy implications

## Local Preferences Carve-Out

Added: 2026-09-10, for [`discover-direction.md`](./discover-direction.md).

Reader-selected topic filters are permitted, under strict conditions. This is a narrow exception to the "saved resources" guardrail below, not a softening of it.

Permitted:

- Filter state in URL query parameters.
- The last-used selection mirrored to `localStorage`.
- Server-rendered content that a client script only shows or hides.

Still prohibited, unchanged:

- Any account, login, or user record.
- Any server-side storage of a reader's selection.
- Any transmission of reader preferences off the device.
- Any content visible only to some readers.

The distinguishing test: **the site must not be able to tell two readers apart.** A preference the server never sees is a rendering detail. A preference the server stores is a user account with extra steps, and needs the separate product decision described below.

## Current Blog Guardrails

Do not add these to the personal blog without explicit approval:

- pricing pages
- checkout or subscription flows
- gated content
- authentication
- user accounts
- saved resources on a server (local filter preferences are carved out above)
- private review queues
- newsletter signup providers
- payment SDKs
- CRM or lead capture scripts
- database-backed Library features

## Validation

Run:

```sh
npm run product:validate
```

The validator checks for common product-creep routes, unexpected API routes, and payment/auth/newsletter dependencies.
