# 013: Service Monetization And Separation

Status: Draft.

## Goal

Keep `hun-bot.dev` focused as a personal trust asset while documenting how a future paid or team-oriented service could be separated later.

This plan supports [`./001-product-service-direction.md`](./001-product-service-direction.md). It should prevent accidental product creep inside the personal blog.

## Non-goals

- Do not add payments.
- Do not add subscriptions.
- Do not add a newsletter product.
- Do not add authentication, user accounts, teams, or saved resources.
- Do not add a database or private review queue.
- Do not add pricing pages or sales pages to the personal blog.
- Do not move the site to a full-stack framework.

## Existing Context

- The current site is static-first and low-cost.
- Public approved content lives in Git and Content Collections.
- Private candidates, raw notes, and unreviewed AI output should stay outside public content paths.
- Library work is still early and should prove editorial value before productizing.
- YouTube and public writing are intended to build trust and acquisition.

## Product Decisions

- The personal blog should stay useful without login or payment.
- Free Library content should remain the default public surface.
- Monetization should be validated through audience needs before adding infrastructure.
- If a Pro or Team product appears later, it should probably be a separate service or clearly separated route/product layer.
- YouTube is primarily a trust and acquisition channel, not the first revenue source.

## Possible Future Revenue Paths

- free public Library
- newsletter
- paid reports
- sponsorship
- B2B research or workshops
- future Pro or Team Library service

These are direction markers, not implementation approvals.

## Implementation Sequence

1. **Define public/free boundaries**
   - Decide what must remain public on the personal blog.
   - Keep core blog posts, reviewed Library cards, and public decks accessible.
   - Avoid adding gated UI until there is a separate product plan.

2. **Track demand signals manually**
   - Use content performance, direct feedback, consulting requests, and repeated reader questions.
   - Do not add analytics vendors only for this plan.
   - Do not store private lead data in the repository.

3. **Design the separation model**
   - Decide whether future commercial features live in another domain, subdomain, or clearly separate route group.
   - Identify what data stays public in Git and what would require private storage.
   - Review legal, privacy, and support implications before implementation.

4. **Plan infrastructure only after demand is clear**
   - Possible future options include Turso, Upstash, Turnstile, R2, Cloudflare Workers, or D1.
   - Do not add these to the current blog until a narrow plan exists.
   - Keep heavy AI work local when possible.

5. **Update docs before implementation**
   - Add a future architecture decision record before adding payments, accounts, saved topics, or review queues.
   - Keep `docs/service-plans/001-product-service-direction.md` current.

## Validation

If only docs change, run:

```sh
git diff --check
```

If future implementation changes are approved, validation must include:

- route checks for public/private boundaries
- secret handling review
- privacy review
- build verification
- manual smoke tests for paid or account flows

## Rollback Notes

Commercial features should never be bundled into unrelated blog improvements. Roll back by feature boundary: payment, account, gated content, or separate service integration.

## Open Questions

- Should a future paid product be hosted outside `hun-bot.dev`?
- Which public Library content must remain free even if a paid product exists?
- What minimum demand signal justifies adding accounts or payments?
- Should B2B reports remain manual before any self-serve product exists?

## Recommended Commit Sequence

1. `docs: define product separation boundaries`
2. `docs: add monetization decision record`
3. `feat: add product surface only after approval`
