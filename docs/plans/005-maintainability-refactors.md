# 005: Maintainability Refactors

## Goal

Reduce duplicated logic and fragile configuration in small, reversible steps without changing public routes or content behavior.

This plan groups lower-risk maintainability work:

- Extract shared blog collection helpers.
- Replace broad category normalization.
- Resolve math plugin duplication.
- Consolidate theme persistence.

## Non-goals

- Do not redesign blog pages.
- Do not change URL routing.
- Do not rename categories or content files in this plan.
- Do not change the default dark/light visual design.
- Do not add dependencies.

## Existing Context

- `src/utils/blog.ts` contains collection helpers, category normalization, slug helpers, and reading-time utilities.
- `normalizeCategory()` currently uses broad substring matching.
- `astro.config.mjs` registers `remark-math` and `rehype-katex` in both MDX and top-level markdown config.
- Theme persistence currently uses `sessionStorage` in `BaseHead.astro` and `public/scripts/themeManager.js`.

## Implementation Sequence

1. **Blog collection helpers**
   - Add reusable helpers for language filtering, date sorting, category extraction, and series sorting.
   - Keep helpers in `src/utils/blog.ts` unless the file becomes too broad; only then split into a new utility module.
   - Update one or two routes first, then compare route counts and ordering.
   - Do not migrate every route in a single risky refactor.

2. **Category normalization**
   - Replace substring matching with explicit aliases.
   - Keep unknown categories unchanged or map to `misc` only when the UI explicitly expects a grouped category.
   - Add known aliases from current content before changing UI behavior.
   - Avoid matching short substrings such as `ai` inside unrelated words.

3. **Math plugin deduplication**
   - Build once with both MDX and Markdown math examples identified.
   - Remove one duplicate registration only if both `.mdx` and `.md` math still render.
   - Keep `remarkLocalizedBlogLinks` registered for both MDX and Markdown unless verified unnecessary.
   - If math rendering changes, restore both registrations.

4. **Theme persistence**
   - Choose one storage policy: `localStorage`.
   - Use one storage key: `neural-blog-theme`.
   - Keep system-theme fallback for first visit.
   - Ensure both `BaseHead.astro` bootstrap logic and `themeManager.js` read/write the same source.
   - Preserve `dark-theme` / `light-theme` body classes and `html.dark` class behavior.

## Validation

Run:

```sh
npm run build
```

Manual checks:

- Blog index ordering for `/ko/blog/`, `/jp/blog/`, `/en/blog/`.
- Category pages still list expected posts.
- Series previous/next links still work.
- Math posts render inline and display math.
- Theme toggle persists across reload and browser restart.
- System-theme fallback still works when no stored preference exists.

## Rollback Notes

- Refactor route helper usage in small commits so individual routes can be reverted.
- Category normalization should be reversible by restoring the old function.
- Math config rollback is restoring both plugin registration paths.
- Theme persistence rollback is restoring the previous `sessionStorage` calls in both theme scripts.

## Open Questions

- Should unknown categories display as their raw label or collapse into `misc`?
- Should `localStorage` migration read old `sessionStorage` once and copy it?
- Should theme persistence be implemented before or after CSP script inventory?

## Recommended Commit Sequence

1. `refactor: add shared blog collection helpers`
2. `fix: replace broad category normalization`
3. `chore: deduplicate math plugin config`
4. `refactor: consolidate theme persistence`
