# Media Companion Workflow

This document defines the static workflow for future YouTube and media companion work. It does not add video pages, YouTube API integration, transcript ingestion, newsletter signup, accounts, payments, or a database.

The goal is to turn each video idea into durable, reviewed knowledge that can connect to blog posts, Library resources, paper cards, topics, and decks.

## Static Metadata

Public companion metadata lives in `src/data/mediaCompanions.ts`.

The file starts empty on purpose. It should contain only manually reviewed public metadata, not private candidate notes or rough production planning.

Each future entry can include:

- `id`: slug-safe media companion ID.
- `status`: `idea`, `draft`, `review`, `published`, or `archived`.
- `title` and `description`: localized text, with Korean required.
- `language`: `ko`, `jp`, `en`, or `multi`.
- `videoUrl`: optional YouTube URL.
- `companionPostId`: optional blog content ID.
- `resourceIds`, `paperIds`, `topicIds`, `deckIds`: relationships to existing public data.
- `artifacts`: status for blog post, Library cards, paper cards, deck, transcript, and newsletter draft.
- `review`: human-review and AI-draft flags.

## Production Checklist

1. Pick an idea, paper, tool, resource, build log, or design reference.
2. Draft private notes outside public content.
3. Decide the primary public artifact: blog note, Library cards, paper card, deck, or video.
4. Write concise original summaries.
5. Review source accuracy, license, attribution, and publication safety.
6. Publish the blog companion post if needed.
7. Add or update Library/paper/topic/deck relationships.
8. Add media companion metadata only when the public relationships are intentional.
9. Run validation and build.

## Human Review Rule

Published media companion entries must be human reviewed.

AI-generated drafts are allowed only as drafts. If `review.aiDraftUsed` is true, `review.humanReviewed` must also be true before metadata can be published.

Do not store raw transcript text, raw HTML, full copied source text, or large third-party excerpts in this public metadata file.

## Validation

Run:

```sh
npm run media:validate
npm run content:validate
npm run build
```

The validator checks:

- unique slug-safe IDs
- supported statuses and languages
- required Korean title and description
- YouTube-only `videoUrl` values
- known blog/resource/paper/topic/deck references
- published entries require a published blog artifact and human review
- AI drafts cannot bypass human review
- forbidden raw transcript or copied-text fields are not present

## Deferred

- YouTube API integration.
- Automated transcript ingestion.
- Video listing pages.
- Newsletter provider or signup flow.
- Private candidate database.
- Review/promote CLI.
- Accounts, payments, comments, or saved resources.

## Future PRs

- Add the first real reviewed media companion entry after a video/post exists.
- Add links from blog posts to related Library cards and decks.
- Consider a media companion index only after several public entries exist.
- Consider reviewed transcript excerpts for Pagefind only after a storage and review policy is written.
