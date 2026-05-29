# 009: Design System And Accessibility Polish

Status: Implemented.

## Goal

Raise UI quality across the blog without changing the stack or adding a heavy component library.

The result should feel quiet, technical, readable, and consistent in both dark and light themes.

Product direction source of truth: [`./001-product-service-direction.md`](./001-product-service-direction.md).

## Non-goals

- Do not redesign the whole site in one PR.
- Do not add a UI component library.
- Do not add decorative landing-page sections that hide content.
- Do not use large images or generated visuals just to fill space.
- Do not change content routes.
- Do not edit MDX prose unless the owner requests it.

## Existing Context

- Tailwind is available.
- Global styles and page-specific styles exist.
- Library pages now have a shared `LibraryPageStyles.astro` and SVG icon component.
- Header, cards, buttons, blog lists, Library pages, search, and about page have grown independently.
- Current public UI should avoid internal policy wording.
- The UI system should support Library, papers, decks, search, and future media companion surfaces without becoming a marketing site.

## Product Decisions

- Content readability wins over decoration.
- Controls should use familiar icons only when they improve clarity.
- Button and card patterns should be consistent but not over-abstracted too early.
- Cards should stay at modest radius and spacing.
- Mobile text must not overflow or overlap.
- Visual polish should make technical judgment easier to scan, not over-emphasize one Library section.

## Implementation Sequence

1. **UI inventory**
   - List common card, badge, button, link, and heading patterns.
   - Identify duplicated styles that cause inconsistent spacing or contrast.
   - Identify low-quality icon usage or unclear action labels.

2. **Define small design primitives**
   - Add shared components only when duplication is real.
   - Possible primitives: action link, status badge, metadata pill, content card.
   - Keep the API simple and Astro-native.

3. **Accessibility pass**
   - Verify semantic headings.
   - Verify focus states for header, search, Library cards, language picker, TOC, and pagination.
   - Check icon-only controls have accessible labels.
   - Confirm links that open new tabs communicate that visually or through text/icon.

4. **Mobile pass**
   - Check home, blog index, blog post, Library hub, Library section, search, and about page.
   - Fix text wrapping and control spacing.
   - Avoid viewport-width font scaling.

5. **Light-theme pass**
   - Review contrast in cards, badges, buttons, and code blocks.
   - Keep colors comfortable against the current background.

6. **Documentation**
   - Add a short UI convention doc only if new primitives are added.

## Validation

Run:

```sh
npm run build
```

Manual checks:

- Keyboard navigation through header, search, Library pages, blog pagination, and post TOC.
- Mobile and desktop widths.
- Dark and light themes.
- `/ko`, `/jp`, and `/en` for representative pages.

Confirm:

- No text overlap.
- No broken route links.
- No large visual dependencies were added.
- Focus states are visible.

## Rollback Notes

Keep UI polish commits scoped by surface. If a shared primitive causes regressions, revert the primitive and affected call sites together.

## Open Questions

- Should shared UI primitives live under `src/components/ui/` or stay feature-scoped until repeated?
- Should icons remain local SVG components, or should a small icon library be added later?
- Should the blog keep both dark and light themes equally polished, or optimize dark first?

## Recommended Commit Sequence

1. `refactor: add shared ui primitives`
2. `style: polish library and blog cards`
3. `style: improve focus and mobile states`
