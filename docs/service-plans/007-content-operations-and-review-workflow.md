# 007: Content Operations And Review Workflow

Status: Implemented.

## Goal

Make publishing safer and more repeatable while preserving the owner's manual review workflow for MDX translations and Library data.

This plan should reduce mistakes around frontmatter, route drift, translation status, and public/private boundaries without automating publication.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not commit or alter unreviewed `.mdx` files.
- Do not add automatic LLM summarization or translation.
- Do not add ingestion, private candidate storage, review/promote CLI, database, auth, or upload flows.
- Do not enforce a workflow that blocks the owner from drafting locally.
- Do not store private notes under public content directories.

## Existing Context

- `npm run content:validate` validates blog frontmatter, Library data, and decks.
- Blog content lives under `src/content/blog/{ko,jp,en}`.
- Library public data lives under `src/content/resources`, `src/content/papers`, and `src/content/topics`.
- Documentation states AI-generated translations and summaries must be human-reviewed before publication.
- The current working style keeps MDX review separate from framework/UI commits.
- Future videos should produce reviewed public artifacts only after companion notes, Library cards, paper cards, and deck references pass the same publication discipline.

## Product Decisions

- The owner remains the final human reviewer.
- Validators should catch structural mistakes, not judge writing quality.
- Draft/private candidate files should stay outside public content folders unless they are intentionally ready to build.
- Review status should be explicit in Library metadata; blog MDX should rely on file location, frontmatter, and owner commit discipline unless a draft flag is introduced later.
- Newsletter material and media notes can be planned as outputs, but they should not introduce unreviewed public text.

## Implementation Sequence

1. **Document the publishing workflow**
   - Add or update a docs page for MDX review flow.
   - Define where raw drafts, AI outputs, and reviewed MDX should live.
   - Explain recommended commit grouping for ko, jp, en content.
   - Explain how video companion notes and Library cards should be reviewed before publication.

2. **Tighten blog validation only where useful**
   - Keep required frontmatter validation.
   - Add warnings for suspicious empty bodies, duplicate titles, missing descriptions, or missing language variants only if low-risk.
   - Avoid rejecting legitimate draft work unless it is under public content and breaks build expectations.

3. **Add content inventory output**
   - Consider a script that prints counts by language, category, and empty-body warnings.
   - Keep it read-only.
   - Do not parse or rewrite MDX body text.

4. **Add pre-commit guidance, not hooks**
   - Document commands to run before committing content.
   - Do not install git hooks unless requested.

5. **Keep Library validation strict**
   - Approved Library resources and papers require review metadata.
   - Raw HTML, raw PDF text, and large copied text fields remain forbidden.

## Validation

Run:

```sh
npm run content:validate
npm run build
```

If a new inventory script is added:

```sh
npm run content:inventory
```

Confirm:

- Existing public content still builds.
- Warnings are actionable and not noisy.
- No private files or secret paths are printed.
- No MDX body rewrites occur.

## Rollback Notes

Revert docs and validation script changes. Do not revert owner-authored MDX review files.

## Open Questions

- Should blog MDX support an explicit `draft: true` field later?
- Should translated files record source post IDs or translation review dates?
- Should content inventory be machine-readable JSON or plain terminal output?

## Recommended Commit

`docs: define content review workflow`
