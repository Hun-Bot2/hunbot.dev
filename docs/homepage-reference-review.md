# Homepage Reference Review

Branch: `new-design`

## Reference Sites Reviewed

- Product Hunt: <https://www.producthunt.com/>
- Hugging Face Papers: <https://huggingface.co/papers>
- Sidebar: <https://sidebar.io/>
- DEV Community: <https://dev.to/>
- PyTorch Korea Discuss Latest: <https://discuss.pytorch.kr/latest>
- Smashing Magazine: <https://www.smashingmagazine.com/>

Live inspection was attempted for all references. Some pages are heavily client-rendered, so the review uses the visible page structure when available and the stable information architecture patterns described in the task prompt when a live page exposed limited static text.

## Observed Layout And Content Patterns

- Product Hunt emphasizes a current set of curated launches before deeper browsing. The useful pattern is a compact "open this first" area, not a marketing hero.
- Hugging Face Papers prioritizes time-based research discovery and concise paper metadata. The useful pattern is showing why a technical item matters without turning the homepage into a full paper index.
- Sidebar uses a small editorial selection model. The useful pattern is a restrained list of links with human judgment.
- DEV Community separates broad feeds into relevance, latest, top, and tags. The useful pattern is keeping developer discovery navigable without making every item compete equally.
- PyTorch Korea Discuss Latest is dense and activity-oriented. The useful pattern is technical information density for people who already know what they are looking for.
- Smashing Magazine blends editorial content, topic positioning, newsletter/service expansion, and deeper content. The useful pattern is a media homepage that can grow without becoming a SaaS landing page.

## What We Borrow Conceptually

- Put curated Library picks before the chronological blog feed.
- Show sections as navigational entry points with counts and status.
- Keep technical metadata visible but compact.
- Separate short editorial briefs from normal long-form posts.
- Leave room for future video notes and report workflows without adding signup or payment features.

## What We Do Not Copy

- No copied visual design, brand language, layout, assets, ranking UI, voting UI, newsletter form, or community mechanics.
- No external scripts or SaaS widgets.
- No dynamic feed ingestion or account features.
- No Product Hunt-style launch voting, DEV-style community posting, or forum-like activity feed.

## Homepage Section Order

1. Latest Blog Posts
2. Curation
3. Library
4. Latest Briefs, only when brief posts exist

This order keeps the personal blog visible immediately while still making the Library direction visible near the top. The page should read as a simple personal technical blog first, not as a generic resource directory or a roadmap document.

## Data Selection Rules

- Library picks use only approved resources and papers with `review.humanReviewed === true`.
- Homepage pick cards show compact titles only; detailed summaries stay on the target content.
- Section counts come from approved resources, approved papers, and static deck metadata.
- Briefs are selected conservatively from existing blog posts tagged or categorized as `brief`, `briefs`, `library-brief`, `library-briefs`, or `editorial-brief`.
- Latest blog posts remain language-filtered by content ID prefix.
- Draft, pending, rejected, private, and AI-draft-only public content must not appear.

## Global CSS Changes

- The root homepage wrapper no longer inherits the narrow article width.
- Added small surface tokens for homepage panels, borders, muted text, and max width.
- Blog prose, code blocks, article typography, header, and footer styles are not rewritten.

## Mobile And Responsive Behavior

- The homepage uses a wide desktop container and collapses to single-column mobile sections.
- Library cards and post cards keep fixed structure on mobile instead of relying on horizontal scrolling.
- Buttons and cards keep visible focus states through existing global focus rules and homepage-specific overrides.

## Why Latest Posts Stay Near The Top

The owner's writing is still the primary trust asset. Latest posts appear first, while Library picks and section cards are compact enough to support discovery without making the first homepage feel too long.

## Manual Verification Checklist

- `/ko/` loads.
- `/en/` loads.
- `/jp/` loads.
- Latest blog posts appear first.
- Curation and Library sections are compact and do not carry long explanatory text.
- Latest blog posts still appear and link to existing post URLs.
- Library cards do not link to missing section routes; empty sections are disabled.
- Dark mode has comfortable contrast.
- Light mode remains readable.
- Mobile layout is single-column and does not horizontally scroll.
- Blog article typography and code block styling are unchanged.
- Search links still point to the language-aware search page.
- Build passes.

## Future PRs

- Library-specific homepage personalization.
- Real editorial brief content after human review.
- YouTube feed integration or static video companion cards.
- Dynamic latest feeds.
- AI paper recommendation surfaces.
- Account or saved-topic features in a separate product layer.
- Newsletter signup backend.
- Comments.
- Paid/pro service features.
- Hosted search or service-domain separation.
