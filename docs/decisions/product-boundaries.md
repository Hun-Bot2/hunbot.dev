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

## Anonymous Feedback Carve-Out

Added: 2026-09-10.

`POST /api/feedback` accepts short anonymous notes about a post. This is a narrow exception to the "no database-backed features" guardrail, permitted only under these conditions.

Permitted:

- A write-only endpoint. There is no `GET` handler and no web route that reads submissions.
- Storage of the message text, the post identifier, and a timestamp, with a 90-day expiry.
- Rate limiting keyed on a short-lived, separate client-id key.
- Reading submissions locally through `scripts/read-feedback.mjs`.

Prohibited, and what keeps this from becoming a different product:

- Rendering a submission anywhere public. The moment feedback is displayed, this becomes anonymous public commenting and needs its own plan — moderation queue, HTML sanitizer, and captcha.
- Storing a raw IP address alongside a message.
- Any admin page, login, or authenticated route for reading submissions.
- Any reply, thread, or notification mechanism.

Public discussion stays on Giscus, where a GitHub identity supplies accountability. The anonymous channel exists so readers without a GitHub account can still reach the author — not to replace it.

The reader-indistinguishability test in the previous section still holds: nothing is served back differently per reader, and no submission affects what any page renders.

`scripts/validate-product-boundaries.mjs` enforces the write-only property and the approved API route list.

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
- publicly rendered anonymous comments (private feedback is carved out above)

## Validation

Run:

```sh
npm run product:validate
```

The validator checks for common product-creep routes, unexpected API routes, and payment/auth/newsletter dependencies.
