# Creative Direction: Static Core, Interactive Modules

Status: Direction proposed. No implementation approved.

Reviewed: 2026-09-10

This record defines what `hun-bot.dev` should become as a personal creative space over a multi-year horizon, and the boundaries that let experimentation happen without degrading the blog. It is not an implementation plan and approves no work.

It sits alongside [Discover: Product Direction](./discover-direction.md), which it depends on, and [Product Separation Boundaries](./product-boundaries.md), which it does not modify.

## Problem

The site has been optimized for static-first architecture, near-zero client JavaScript, performance budgets, CI validators, and content reliability. Those are correct and stay.

The risk is that the result is technically excellent and creatively generic. This is a personal blog, not a commercial content product, and the current architecture gives it no way to express taste, curiosity, or personality.

The competing risk is the usual failure of personal sites that try to fix this: a decorative layer of effects that costs runtime, fights the reading experience, ages in eighteen months, and cannot absorb new content.

This record exists to choose a direction that avoids both.

## Position

The site is **an instrument for one person's thinking that shows its own workings.**

[Discover](./discover-direction.md) names the loop the site is actually about: Collect → Filter → Select → Study Deeply → Write. That loop is currently rendered as reverse-chronological lists, which is the one format that destroys it. A reader cannot see that a Discover item became a paper review, which became a devlog, which changed what gets studied next.

Making that loop visible and navigable is the creative project. Everything else is either in service of it or is decoration.

The consequence that matters most: **visual identity should be derived from content, computed at build time.** A site whose appearance is a function of its data gets better every time a post is written. A site whose identity is a hero animation gets staler. This is also the only sustainable answer to "feel increasingly alive over time" — aliveness through derivation, not through accumulating features.

The reference class is explorable and personal-instrument sites — Bartosz Ciechanowski, Nicky Case, Distill, Amelia Wattenberger, Andy Matuschak, Maggie Appleton — not studio creative-development sites.

## What This Is Not

Explicitly rejected as direction, not merely deprioritized:

- A site-wide ambient background layer behind prose.
- A hero 3D object.
- Scroll hijacking, smooth-scroll takeover, or entrance animations.
- Cursor followers.
- Cards that expand spatially instead of navigating.
- Magnetism, deformation, or inertia applied as a global system.
- A separate `design-portfolio` section. See [Portfolio Decision](#portfolio-decision).

## Prerequisite: The Metadata Problem

Any visualization of relationships between posts is currently fiction.

Evidence, Korean collection, 2026-09-10:

- 19 posts still carry `tags: ['tag1', 'tag2']`.
- 12 posts carry `series: 'series 이름'`.
- Real tags are inconsistent in case and in language: `vlm` and `VLM`, `local llm` and `Local LLM`, `블로그` and `blog` all appear as distinct values.
- Finding F5 in [the blog UI audit](../ops/ui-ux-plan.md) records 19 series groups over 50 publishable posts, 13 of them singletons.

A force-directed graph over this data renders a plausible-looking hairball that is wrong, and it will look convincing enough that the error goes unnoticed for a year.

**No visualization work starts before the taxonomy is real.** This is not a sequencing preference; it is a correctness condition.

## Convergence With Discover

Discover already commits to a topic graph stored as content: one Markdown file per node in `src/content/topics/`, with `parent`, `order`, and `aliases`, validated by cross-checking the collection rather than by matching a fixed list.

That is already a graph data structure, and it is curated rather than inferred from string matching, which is exactly what the metadata problem above requires.

The decision that follows: **the knowledge-graph visualization is not funded as an art project. It is the navigation UI for a data model already committed to for other reasons.** This is what makes data visualization native to this blog rather than a demo bolted onto it, and it means the expensive prerequisite is paid for once and used twice.

## The Gimmick Test

Every interactive module must ship an authored static fallback that is the real content — a build-time SVG snapshot of a graph, a poster frame of a canvas, a rendered chart.

That requirement doubles as the test that separates identity from spectacle:

> **If it cannot degrade into something worth looking at, it was not carrying information.**

A topic graph degrades to a rendered SVG and stays useful. An interest timeline degrades to a chart and stays useful. A particle field degrades to a background color, which is a complete description of what it was.

This also resolves accessibility as a design property rather than an afterthought. A module with an authored fallback has already answered `prefers-reduced-motion`, missing WebGL, low-power devices, and screen readers, because the fallback is the answer to all four. The residual work is keyboard access into interactive navigation. If the topic graph has no keyboard path, it is not navigation, it is an image, and it ships as one.

## Architectural Boundaries

The existing rule — the core reading experience must not depend on client-side JavaScript — is correct and insufficient. It is a correctness rule. It constrains nothing about cost, accumulation, or maintenance. The failure mode for this kind of work is never one heavy page; it is ten cheap things that each seemed fine.

Five boundaries, in the idiom the repo already uses for validators:

1. **The static core is a CI contract.** Build, load with JavaScript disabled, assert that the article's heading count and word count match the source. The repo already fails builds on draft leakage via `scripts/validate-blog-content.mjs`; this is the same move applied to the reading experience.

2. **There is no "interactive layer." There are interactive modules.** A layer is unfalsifiable and grows silently. A module declares `{ id, weight, trigger, degradesTo }` and a validator enforces a per-route weight budget, alongside the existing `scripts/validate-performance-budget.mjs`. What can be named can be counted.

3. **Exactly one module may be global.** Everything else is scoped to a single route or a single post. This is the boundary that prevents drift, and it is the reason the ambient character below is worth having and a second one is not.

4. **Nothing loads on page load.** Intersection observer plus idle plus capability check. Never above the fold on an article route.

5. **Degradation is authored, not automatic.** See [The Gimmick Test](#the-gimmick-test).

### Amendment To "Static At The Core, Alive At The Edges"

The phrase is spatially misleading. Read literally, "the edges" means the margins around the prose, which is the worst available place to put motion.

The intended rule is: **static in the body, alive where the reader is not reading.** Three zones are open to interactive work:

- **Arrival** — before reading. Home, Discover, the room.
- **Exploration** — between readings. Archive modes, the topic graph, relations, what to read next.
- **Figures** — inside reading, but only where the reader chose to engage.

Prose is sacred, and so is the frame around it.

## The Interaction Language

Coherence comes from physics and initiative, not from a component inventory.

- **One spring configuration, one easing family, one duration scale**, defined as tokens alongside the existing design tokens. If a character, a card, and a graph node all decelerate identically, they read as inhabitants of one universe even though they share no code. This is what makes variation legible as style rather than as inconsistency.

- **The site never moves unless the reader moved first.** One exception, below.

That single rule eliminates, without further argument: autoplaying backgrounds, scroll hijacking, entrance animations, cursor followers, and attention loops.

### The Exception

One recurring character, footer-scoped, rare. A cat.

It is the only autonomous agent on the site, and the scarcity is the point. A single character becomes an identity mark. A menagerie of birds and cats becomes a theme park, which is the aesthetic this record rejects. It is also the highest ratio of personality to bytes available, and it survives a decade without maintenance.

It is the one module permitted under boundary 3.

## Variation Policy

Variation must be **lawful** — a function of content type, not of authorial mood.

- `paper-review` posts receiving a distinct figure treatment is a system.
- Post #47 receiving a custom cover because it was fun is debt.

One escape hatch: a post may opt into a named custom module. **Cap: five active at any time.** The cap forces curation and, more importantly, forces retirement, which is the thing personal sites never do.

## Where 3D Earns It

Three.js is justified when the third dimension carries information, or when the subject is itself spatial. By that test, two cases and no others:

1. **An embedding map of the site's own posts.** Project embeddings over the corpus and let a reader move through the semantic structure of several years of writing. This is the only identified case where 2D genuinely loses structure, and it is thematically honest for an AI blog. Constraint: build the 2D projection first and ship it. Promote to 3D only if 2D demonstrably loses structure.

2. **Posts about 3D that are their own live figure.** The `threejs-study` series already exists. A post about a camera rig should contain the camera rig. Self-demonstrating work needs no separate justification.

WebGPU is a study topic that produces posts, not site infrastructure. Revisit no earlier than 2027.

Embeddings remain private per [Product Separation Boundaries](./product-boundaries.md). Only a projected, published coordinate set may reach the static build.

## The Room

The ambient environment is rejected as a layer and accepted as a **place**: one route that is a destination rather than a backdrop.

Everything the ambient-world idea wants — procedural environment, seasonal and time-dependent state, generative visuals, the character, and eventually a spatial rendering of the topic graph — lives there and nowhere else. A visitor who arrives chose to, and the page owes them nothing but atmosphere.

This is what resolves the performance-versus-expression tension. The world is somewhere you go, not wallpaper behind everything.

Not approved for implementation. Recorded so the idea has a legitimate home and stops trying to become a background.

## Portfolio Decision

**No separate `design-portfolio` section.**

A portfolio section demands finished, framed, polished artifacts, which is the exact pressure this work is meant to escape, and a stale one is worse than none.

Replacement:

- **Experiments live inside posts.** The writing is the frame. Each experiment gets a date, a reason, and a story, and abandoning one costs nothing because the post stays true.
- **An `experiments` content collection**, so the index is a query rather than a maintained section. A `retired` flag lets dead work leave the index without deleting the post.

## Accepted And Rejected

| Idea | Decision | Reason |
|---|---|---|
| Topic graph as an archive navigation mode | Accepted | Falls out of the Discover taxonomy; real navigation value |
| Interest evolution over time | Accepted | Data nobody else has; uniqueness from ownership, not technique |
| Build-time generative covers from post metadata | Accepted | Zero runtime, deterministic, scales, works with JS off |
| In-article interactive figures | Accepted | Highest information value on a technical blog |
| One recurring footer character | Accepted | Identity mark; the single permitted global module |
| Keyboard-triggered easter eggs, self-revealing | Accepted | Cheap, rewards exploration, no cost to non-participants |
| Embedding map, 2D | Accepted, gated on taxonomy | Honest use of the corpus |
| Embedding map, 3D | Conditional | Only if 2D loses structure |
| Ambient environment | Relocated | Becomes the room, not a layer |
| "A world representing accumulated knowledge" | Rejected as stated | A metaphor with no mechanic; no reader task |
| Site-wide procedural background | Rejected | No information; competes with prose; per-page GPU cost |
| Spatial card expansion instead of navigation | Rejected | Breaks back button, deep links, scroll restoration, reader mode |
| Magnetism and deformation as a system | Rejected | Exhausting at scale; hostile to touch and keyboard |
| Bespoke per-pair article transitions | Rejected | Hand-authored per pair, never covers the archive |
| Separate design portfolio | Rejected | See above |

## Build Order

Ordered by dependency and payoff rather than by technology. No phase is approved; each needs its own decision.

### Phase 0 — Make the data real

Fix tags, series, and categories across all three languages. Stand up `src/content/topics/` with `parent`, `order`, and `aliases` per the Discover taxonomy. Required by Discover regardless of this record.

*Exit:* zero placeholder `tags`, `series`, or `category` values; every post resolves to at least one topic node; tag casing and language normalized.

### Phase 1 — Motion constants and the character

Motion tokens. One footer character. Deliberately first: it has no data dependency, it establishes identity immediately, and it proves the module, budget, and degradation architecture on something where failure is harmless.

*Exit:* motion tokens in use by at least one existing component; character shipped under boundaries 2–5; per-route weight budget enforced in CI.

### Phase 2 — Build-time generative covers

Deterministic SVG generated from post metadata at build time. No runtime cost.

*Exit:* every published post has a derived cover; adding a post requires no code change.

### Phase 3 — In-article explorables

One interactive figure inside one paper review. Exercises the budget and fallback system under real conditions.

*Exit:* one figure shipped with an authored static fallback; article route passes the JavaScript-disabled CI contract unchanged.

### Phase 4 — Topic graph as a navigation mode

A second way to navigate the archive, toggled from the list view. Requires Phase 0.

*Exit:* keyboard-navigable; degrades to a build-time SVG; reachable from `/{lang}/blog/`.

### Phase 5 — Embedding map, 2D

*Exit:* shipped, or explicitly abandoned with a post explaining why.

### Phase 6 — The room

Only if Phases 1–5 are still maintained one year after Phase 1 ships.

Generic CSS polish is not a phase. It produces no artifact and no identity, and it costs more than the character does.

## Practice

The rule that makes this sustainable rather than a redesign:

> **Every experiment must produce a post.** If it does not generate writing, it does not ship.

This ties the creative practice to the only thing already proven sustainable here — the writing — and prevents the orphan-demo graveyard that ends personal sites of this kind. A failed experiment still has value, because the post about why it failed is frequently the better artifact.

Cadence: one experiment per month is sufficient, and missing a month is not a failure. One annual ritual: redesign exactly one surface per year, completely. Not the site.

Worth studying for the practice specifically: Nadieh Bremer and Shirley Wu's *Data Sketches*, two people executing twelve personal data projects over a year with the process written down; and Lynn Fisher's decade of annual personal-site rebuilds. For restraint in interaction craft: Josh Comeau, Rauno Freiberg, Emil Kowalski. For experiment-as-single-page: Neal Agarwal's neal.fun.

## Success Signals

Meaningful:

- A reader uses the graph mode to reach a post they would not have found in the list.
- A post's interactive figure is cited or reused elsewhere.
- The site's appearance changes measurably after a month of writing, with no code committed.
- An experiment is retired without regret.
- Phases 1–3 are still maintained a year later.

Not meaningful:

- Number of interactive modules.
- Lighthouse scores on routes with no interactive modules.
- Whether the site resembles current creative-development work.

## Open Questions

- Does the topic graph replace the category pages, sit beside them, or eventually absorb the Library? Revisit after Phase 4 and alongside the same question in [discover-direction.md](./discover-direction.md).
- Where do projected embedding coordinates live — a generated content collection committed to the repo, or a build-time artifact? The first is inspectable and diffable; the second avoids committing derived data. Decide at Phase 5.
- Should generative covers be committed as files or generated on each build? Committing makes them reviewable and stable; generating keeps the repo small. Decide at Phase 2.
- Is one character correct, or does the site eventually support a second under a different rule? Do not revisit before Phase 6.
- Does the room become the Discover landing surface, or stay unrelated to it? Open.
