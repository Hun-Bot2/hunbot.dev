# Dependency Map

Reviewed: 2026-05-12

## Package Manager

- Package manager: `npm`
- Lockfile: `package-lock.json` lockfile version 3
- Scripts:
  - `npm run dev`: `astro dev`
  - `npm run build`: `astro build`
  - `npm run preview`: `astro preview`
  - `npm run astro`: `astro`
- Test command: not currently defined
- Lint command: not currently defined
- Typecheck command: not currently defined

`npm ls --depth=0` completed successfully and showed the installed top-level dependencies matching `package.json`.

## Runtime Dependencies

The repository currently places all top-level packages under `dependencies`; there is no separate `devDependencies` section.

| Package | Role | Notes |
| --- | --- | --- |
| `astro` | Site framework | Core runtime/build dependency. |
| `@astrojs/vercel` | Vercel adapter | Enables serverless deployment and API route support. |
| `@astrojs/mdx` | MDX integration | Required for `.mdx` blog content. |
| `@astrojs/rss` | RSS generation | Used by `src/pages/rss.xml.js`. |
| `@astrojs/sitemap` | Sitemap integration | Enabled in `astro.config.mjs`; coexists with custom sitemap route. |
| `@astrojs/tailwind` | Tailwind integration | Enabled in `astro.config.mjs`. |
| `@upstash/redis` | View counter persistence | Used only by `src/pages/api/views.ts`. |
| `sharp` | Image tooling | Used by Astro/image pipeline and build tooling. |
| `remark-math` | Markdown math parsing | Registered in both MDX integration and top-level markdown config. |
| `rehype-katex` | Math rendering | Registered in both MDX integration and top-level markdown config. |
| `unist-util-visit` | Remark plugin traversal | Used by `src/utils/remark-localized-blog-links.mjs`. |
| `@fontsource/noto-sans-jp` | Local font package | No direct import found in source during review. Verify before removing. |
| `@fontsource/noto-sans-kr` | Local font package | No direct import found in source during review. Verify before removing. |

## Dev Dependencies

Not currently defined.

Maintainer note: splitting build-only packages into `devDependencies` is optional for this project, but adding a test runner, linting, or typecheck later should use `devDependencies` unless runtime deployment needs the package.

## Astro Integrations

Configured in `astro.config.mjs`:

- `@astrojs/mdx`
- `@astrojs/sitemap`
- `@astrojs/tailwind`
- `@astrojs/vercel/serverless`

Markdown and MDX both register:

- `remarkLocalizedBlogLinks`
- `remark-math`
- `rehype-katex`

Risk: math and localized-link plugins are configured in both MDX and top-level markdown config. This may be deliberate for `.md` and `.mdx` coverage, but it should be tested before changing because double registration can create duplicated processing or subtle rendering differences.

## External Services And Public Resources

| Service/resource | Used by | Purpose | Risk notes |
| --- | --- | --- | --- |
| Vercel | `astro.config.mjs`, `vercel.json` | Hosting, serverless API, security headers | Header changes can break scripts, comments, analytics, or fonts. |
| Redis-compatible serverless persistence | `src/pages/api/views.ts` | Page-view counts and duplicate suppression | Needs slug validation, stronger abuse protection, and careful key construction. |
| Giscus | `GiscusComments.astro`, `consts.ts`, CSP | GitHub Discussions comments | External script and public config. Verify allowed repo/category before enabling. |
| GoatCounter | `BaseHead.astro`, CSP | Analytics | External script and connect domain. |
| Google Analytics | `BaseHead.astro`, CSP | Analytics | External script and connect domains. |
| Google Fonts | `BaseHead.astro`, CSS | Web fonts | Adds external requests to every page. |
| jsDelivr KaTeX CSS | `BaseHead.astro`, CSP | Math styles | Loaded site-wide even pages without math. |
| Three.js font asset | `public/scripts/neuralNetwork.js` | 3D text labels if visualization is used | Script assumes global `THREE`; no top-level `three` package is installed. |

## Dependency Risk Notes

- No automated dependency audit is part of the normal command set.
- No test/lint/typecheck scripts exist to catch dependency upgrade regressions.
- CSP currently permits inline and eval-style scripts, which lowers the immediate breakage risk of dependencies but weakens security posture.
- The lockfile is currently modified in the worktree before this review; verify package changes separately before committing dependency-related work.
- The public 3D scripts assume a global Three.js object, but no local dependency or source import was found. Treat that feature as fragile until its loading path is verified.

## Possible Removal Candidates

These are not removal instructions. Audit usage and run a build before deleting anything.

- `@fontsource/noto-sans-jp` and `@fontsource/noto-sans-kr`: source currently uses Google Fonts and CSS font-family names, but no direct package import was found.
- Unused UI components such as `BlogCard.astro`, `LanguagePicker.astro`, `HeaderLink.astro`, or `Bio.astro` may be legacy. Confirm with full route and content usage before removing.
- `src/styles/controls.css` may be unused. Confirm import paths before removal.
- Public 3D scripts may be legacy or dormant. Verify whether any route loads them before changing.

## Possible Upgrade Risks

- Astro major/minor upgrades can change content collection behavior, i18n route generation, MDX rendering, and adapter output.
- `@astrojs/vercel` upgrades can affect serverless function output and environment handling.
- `@astrojs/mdx`, `remark-math`, and `rehype-katex` upgrades can change heading IDs, math HTML, or MDX compilation.
- `@astrojs/sitemap` upgrades can alter generated sitemap names and conflict with the custom `sitemap.xml.ts` route.
- `@upstash/redis` upgrades can change request behavior or error shapes in the view API.
- Tailwind integration upgrades can affect generated utility classes, especially dynamic class names in category pages.

## Dependencies Not To Add Casually

Avoid adding these without a task-specific decision:

- A new framework, full-stack runtime, or CMS.
- A database or backend platform beyond the current lightweight persistence needs.
- Client-side search libraries before a route and indexing plan exists.
- Heavy UI component systems for one-off blog controls.
- Image/CDN libraries unless the public asset and content image strategy is redesigned.
- Scraping, crawling, or ingestion packages for the Library feature before licensing and review workflow are defined.
