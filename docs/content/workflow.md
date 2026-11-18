# Content Review Workflow

For actual drafting and preview, start with the [blog writing guide](writing/README.md).

This repository is the public, reviewed publishing surface for `hun-bot.dev`.

The owner can draft, translate, and experiment locally, but public content should enter `src/content` only when it is ready to build and be reviewed.

## Public Content Locations

Reviewed public content belongs in:

- `src/content/blog/ko/`
- `src/content/blog/jp/`
- `src/content/blog/en/`
- `src/content/resources/`
- `src/content/papers/`
- `src/content/topics/`
- `src/data/decks.ts`
- `src/data/learningPaths.ts`

These files are indexed, routed, built, or linked from public pages.

## Private Drafts And AI Outputs

Keep these outside public content folders until reviewed:

- raw notes
- scraped source text
- raw PDF text
- AI translation drafts
- AI summary drafts
- private candidate resource lists
- unpublished video planning notes
- confidential client or internal project material

Do not store private candidates under `src/content` just because the file is not linked yet. Astro and Pagefind can still build or index public content folders.

## MDX Review Flow

Recommended flow for blog posts:

1. Draft or translate outside public content folders, or keep the work unstaged.
2. Review frontmatter: `title`, `description`, `pubDate`, optional `updatedDate`, `heroImage`, `tags`, `category`, `series`, and `seriesOrder`.
3. Review body text for accuracy, tone, links, images, and sensitive content.
4. Move or keep the reviewed file under `src/content/blog/{ko,jp,en}/`.
5. Run validation and build commands.
6. Commit MDX separately from UI/framework changes when possible.

The current owner workflow intentionally keeps MDX review separate. Framework, route, schema, and UI commits should not accidentally include `.mdx` files.

## Frontmatter Quality Gate

A post with `draft: false` (or no `draft` field) still will not publish if its frontmatter still looks like an unedited template. `getAllPosts()` in `src/utils/blog.ts` excludes a post when any of the following hold:

- `description` is one of the known placeholder strings (`설명 입력`, `Enter description`, `説明を入力`),
- `tags` contains `tag1`, `tag2`, or `tag`
- `category` is exactly `category`
- `series` is exactly `series 이름` or `series name`
- another post shares the same language, `title`, and `pubDate` (always a copy-paste mistake — every copy is excluded, not just the extras)

This is not a build failure: `scripts/validate-blog-content.mjs` prints a warning listing every excluded file and the reason, so the backlog stays visible without blocking work on unrelated content. Fix the real values (or set `draft: true` until you do) to get a post published.

## Translation Review

AI-assisted translation is allowed as a draft aid, but published translations must be human reviewed.

Before committing translated MDX:

- check technical terminology
- verify code snippets and command examples
- confirm links point to the correct localized or canonical route
- remove accidental translator notes or prompt artifacts
- confirm frontmatter category and tags match the site convention

## Library Review

Approved Library records require explicit review metadata:

- `status: "approved"`
- `review.status: "approved"`
- `review.humanReviewed: true`

AI-generated summaries cannot be public unless reviewed. Public Library records should contain original summaries and metadata, not copied source pages, raw HTML, full paper text, or large copied abstracts.

## Video Companion Review

Future YouTube companion work should produce reviewed public artifacts only after review:

- blog companion note
- Library resource cards
- paper cards
- related deck metadata
- related learning path updates

Raw scripts, rough notes, candidate links, and generated summaries should stay private until promoted intentionally.

## Commit Grouping

Recommended commit grouping:

- UI/routes/helpers/docs changes in one commit.
- Library metadata changes in one commit.
- Korean MDX review changes in one commit.
- English translation review changes in one commit.
- Japanese translation review changes in one commit.

This keeps review smaller and makes rollback safer.

## Commands

Run these before committing content:

```sh
npm run content:inventory
npm run content:validate
npm run routes:validate
npm run build
```

Use `git diff --cached --name-only` before committing to confirm the staged files match the intended review scope.

## No Hooks Yet

This repository does not install pre-commit hooks. The workflow remains manual because the owner frequently reviews MDX in batches and may keep local drafts unstaged.

## Known Limitations

- Blog MDX does not have a formal `draft: true` field yet.
- Translation review dates are not represented in frontmatter yet.
- The inventory script is read-only and does not judge writing quality.
- The public repository is not a private candidate store.

## Local drafts without frontmatter

Use Node 24 (`nvm use`) and `npm run dev`, then open `/__drafts/`.
The list includes `draft: true` posts and `.md`/`.mdx` files without frontmatter
under `src/content/blog/{ko,jp,en}/`. Preview URLs use the content ID, for example
`/__drafts/ko/study/astra/`. The preview updates when the file is saved.

Metadata-free files get a filename title and are treated as drafts in memory;
source files are never rewritten. The placeholder date is not a publication date.
Existing frontmatter remains strictly validated, so partially filled frontmatter
still needs its required fields. MDX bodies must have valid MDX syntax to render.

Preview routes exist only in `astro dev`. Production collection loading excludes
files without a frontmatter opening delimiter before registering their MDX imports;
normal draft filtering and publishing validation remain unchanged. To publish,
complete `title`, `description`, and `pubDate`, review the content and remove
`draft: true`. `npm run blog:validate` reports metadata-free drafts separately and validates any declared frontmatter.
