# 003: Content Validation And Library Governance

Status: Implemented.

## Goal

Prevent broken public content and unreviewed Library data from reaching the build by adding lightweight validation around blog frontmatter and Library publication rules.

This plan groups migration items that share the same publication-safety concern:

- Add content frontmatter validation.
- Add Library validation before any ingestion.
- Keep private candidates and AI drafts out of public content.

## Non-goals

- Do not add a database.
- Do not add private candidate storage.
- Do not add automated ingestion.
- Do not add automatic LLM summarization.
- Do not add a heavy test framework.
- Do not rewrite existing content collection schemas unless validation proves a schema gap.

## Existing Context

- Blog content lives under `src/content/blog/{ko,jp,en}/`.
- Blog files are Markdown or MDX and are loaded by the Astro content collection.
- Library content lives under `src/content/resources/`, `src/content/papers/`, and `src/content/topics/`.
- Library validation scripts already exist from previous PR work and should be reused before adding new scripts.
- `docs/library-data-model.md` documents human-review and license rules.

## Implementation Sequence

1. **Blog frontmatter validation**
   - Add a lightweight Node script such as `scripts/validate-blog-content.mjs`.
   - Scan `src/content/blog/**/*.{md,mdx}`.
   - Require frontmatter delimiters and the required blog schema fields: `title`, `description`, and `pubDate`.
   - Validate optional structural fields when present: `updatedDate`, `heroImage`, `tags`, `category`, `series`, and `seriesOrder`.
   - Fail on empty drafts or notes placed under `src/content/blog` without frontmatter.
   - Do not parse or rewrite MDX bodies.

2. **Unified content validation command**
   - Add a package script only if it does not duplicate an existing one.
   - Preferred command: `content:validate`.
   - `content:validate` should run blog content validation and existing Library validation.
   - Keep individual scripts callable for focused checks.

3. **Library validation hardening**
   - Reuse the existing Library validation script.
   - Confirm approved resources require `review.humanReviewed === true`.
   - Confirm approved papers require `review.humanReviewed === true`.
   - Confirm approved papers keep required Korean summary fields.
   - Confirm resources include license/publication metadata.
   - Confirm public content does not include forbidden raw fields such as `rawHtml`, `rawPdfText`, `fullPdfText`, or `largeCopiedText`.

4. **Documentation alignment**
   - Update `docs/library-data-model.md` only if validator behavior differs from the current documentation.
   - Add a short validation section to content workflow docs if a new `content:validate` command is introduced.

## Validation

Run:

```sh
npm run content:validate
npm run build
```

If `content:validate` is not added, run the individual validation scripts and document the exact commands in the final implementation notes.

Manual checks:

- Temporarily test the validator against a copied invalid sample outside tracked content, or use script fixtures if added.
- Confirm current valid content passes.
- Confirm validation failures print file paths and field names.

## Rollback Notes

- Remove new validation scripts and package script entries together.
- If Library validation is changed, revert validator changes separately from documentation.
- Do not modify content files as a rollback strategy; validators should adapt to the intended public schema.

## Open Questions

- Should validation run automatically inside `npm run build`, or stay as a separate command?
- Should draft content be allowed under `src/content/blog` if it has valid frontmatter, or should drafts stay outside public content?
- Should validator fixtures be added now, or wait until a test framework exists?

## Recommended Commit Sequence

1. `chore: add blog content validation`
2. `chore: unify public content validation`
3. `docs: document library validation workflow`
