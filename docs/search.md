# Search

This site uses Pagefind for static full-text search.

## Why Pagefind

Pagefind indexes built HTML after Astro finishes and writes a static `/pagefind/` bundle into the deployable output. That keeps search compatible with the current static-first Astro and Vercel setup without adding a backend search service.

References:
- https://pagefind.app/docs/
- https://pagefind.app/docs/ui-usage/
- https://pagefind.app/docs/filtering/

## Build And Indexing

The production build runs:

```sh
npm run build
```

That command runs `astro build` first, then:

```sh
npm run search:index
```

`search:index` indexes both static outputs:

- `dist/client` for local `npm run preview`
- `.vercel/output/static` for the Vercel deploy artifact

This writes Pagefind bundles under both `dist/client/pagefind/` and `.vercel/output/static/pagefind/`.

`npm run dev` does not run Pagefind because Pagefind indexes generated HTML after a production build. To test search locally, run:

```sh
npm run build
npm run preview
```

## Search Routes

Search pages are language scoped:

- `/ko/search/`
- `/jp/search/`
- `/en/search/`

The header search icon links to the current language's search page.

## Searchable Content

Blog posts opt into indexing in `src/layouts/BlogPost.astro` with `data-pagefind-body` on the post title and main prose content. Future public content types, such as Library pages, should add their own `data-pagefind-body` regions when they are ready to appear in search.

## Excluding Repeated UI

Header, footer, and the search page shell use `data-pagefind-ignore`. Because the current index is limited to explicit `data-pagefind-body` regions, repeated navigation, chrome, comments, and search UI are not intended to be indexed.

## Multilingual Behavior

Each blog post adds Pagefind filters for:

- `language`
- `section`
- `category`
- `tag`

The search page initializes Pagefind UI and triggers the current `language` filter. This keeps `/ko/search/`, `/jp/search/`, and `/en/search/` focused on their own language content.

## Known Limitations

- Search is only available after a production build plus Pagefind indexing.
- This PR indexes blog post title and body content only.
- The current UI uses Pagefind's default result rendering with light styling overrides.
- Language filtering depends on the indexed `language` filter metadata.

## Future Work

- Library-specific filters.
- Design category filters.
- AI paper topic filters.
- Search result highlighting customization.
- Command palette integration.
- Hosted search evaluation only if static search becomes insufficient.
