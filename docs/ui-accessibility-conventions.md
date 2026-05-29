# UI And Accessibility Conventions

The site should feel quiet, technical, readable, and consistent without adding a heavy UI framework.

## Shared Rules

- Keep cards at modest radius and spacing.
- Prefer readable contrast over decorative color.
- Use existing local SVG icon patterns before adding an icon dependency.
- Keep routes and content visible; do not replace useful content with marketing sections.
- Do not use UI copy for internal policy language.

## Focus And Keyboard

Every page using the shared header should expose:

- a visible skip link to `#main-content`
- one main landmark with `id="main-content"`
- visible `:focus-visible` outlines on links, buttons, inputs, selects, summaries, and textareas

Icon-only buttons must have an accessible label.

## Cards And Actions

- Use `LibraryPageStyles.astro` for Library and path card surfaces.
- Use clear action labels such as "Open resource", "Open post", or "Back to Library".
- External links that open a new tab must use `rel="noopener noreferrer"`.
- Do not make disabled-looking cards active links.

## Mobile

- Controls should wrap instead of shrinking text until unreadable.
- Avoid viewport-width font scaling.
- Keep button hit areas large enough for touch.
- Avoid horizontal overflow in cards, badges, and action rows.

## Validation

Run:

```sh
npm run ui:validate
npm run build
npm run ui:validate
```

The validator checks the shared skip link, key main landmarks, focus styles, and generated output when build artifacts exist.
