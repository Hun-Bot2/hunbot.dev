# Privacy, copyright, and leak checks

Status: policy plus checks run on 2026-11-10. When unsure, do not publish and do not send (fail closed).

## Assets

| Class | Examples | Where it may live |
| --- | --- | --- |
| Public | My own notes in the blog repo, synthetic fixtures | Repo, public build |
| Private | Lecture PDFs, slides, unauthorized class screenshots, API keys, engine DB, review defects, exports | **Outside the repo** (default) or Git-ignored folders |
| Unknown | Images of unclear origin, notes that copy lecture text | Treat as private |

Facts that shape the policy (D5): the repo is public, so every committed note is already public even if `draft: true`. Lecture material is not committed and must not be. The engine only reads MDX notes; it never reads lecture files.

## External LLM providers

- Notes in the repo are already public, so sending them to Gemini adds no new exposure. They are sent only after the preview (cli.md `generate`), and only if `anki.send` is not `false`.
- Lecture material and anything derived from it are never sent. If a note quotes lecture slides heavily, set `anki.send: false` or keep it out of the repo. There is no override flag.
- API keys live only in the local process environment (or CI secrets). The blog never calls an LLM from the browser.
- Model IDs come from config after checking the provider; never hard-coded.
- Logs keep time, opaque IDs, model, prompt version, tokens, latency and outcome. They never keep keys, full prompts or responses, raw HTTP headers, account IDs or absolute paths.
- Notes and model outputs are data, not instructions. The model gets no tools, filesystem or network access.

### Gemini data use (checked 2026-11-10)

The pricing and terms pages now redirect to `aistudio.google.com/docs/pricing` and `/docs/terms`. Read through a summarizing tool, so re-check the wording before relying on it:

- Unpaid tier: submitted content and responses are used to improve Google products; human reviewers may read them; the terms say not to submit sensitive, confidential or personal information.
- Paid tier: prompts and responses are not used for product improvement; logged for a limited time for abuse detection.
- An invite-only "Contributor" tier marks data use as "yes" even when paid.

Consequence: free tier only for notes that are public anyway. Account tier, billing link, model ID and quotas are verified in AI Studio before Phase 0 (not yet done).

## Anki and AnkiWeb

All cards go to Anki (D6). With AnkiWeb sync on, card text is copied to AnkiWeb, which is private to my account. Cards contain only my own note text, so sync stays on. A separate unsynced profile is needed only if school rules forbid keeping course content in a personal cloud.

## Leak paths (checked on a clean build of commit `719ee0b`, 2026-11-10)

| Path | Risk | Result |
| --- | --- | --- |
| Tracked files | Commit = public | PDFs/PPTX tracked: 12, all under `public/decks/**` (my own project decks; rights are my call). No tracked `.ipynb`, `.sqlite`, `.env` |
| Git history | Removal does not erase history | The 4 sensitive paths in `.gitignore` were never committed. History contains `public/assets/*.pdf` (6) and an older `ONTHEBLOCK_Privacy_Policy.pdf`, which appear to be earlier copies of the decks. No history rewrite done |
| `.gitignore` coverage | Private folders actually ignored | Ignores `/.local/study-engine/`, `/.study-engine/`, `.env`. No rule for `.private/` or all of `.local/` |
| `public/` | Shipped as-is | 10 PDFs in `.vercel/output/static` (the decks). Anything private placed in `public/` is published |
| Static HTML / JS | Draft or private text | A distinctive string from a draft post: 0 hits in `dist/` and `.vercel/output/` |
| Pagefind index | Compressed fragments contain page text | 242 fragments decompressed: draft string 0 hits, a published control string 1 hit (method works) |
| Sourcemaps | Source exposure | 0 `.map` files |
| Secrets | Keys in bundles | `REDIS`/`UPSTASH`/`GEMINI` appear only as variable names in a blog post, no values |
| CI artifacts | Uploaded build output | `ci.yml` uploads none |
| Preview deployments | Vercel PR previews | Not checked in the Vercel dashboard; mitigated by never committing private content |
| Unmerged branch `feat/study-archive-migration` | Adds many `public/images/STUDY/**` images | Origin not checked; confirm none are lecture captures before merging |

`robots.txt`, unlisted URLs and `noindex` are not privacy controls. Anything in the public build is public.

## Local state

`.study-engine/` (DB, caches, logs, previews, exports, review defects) and `.local/study-engine/` (private working notes) are Git-ignored, owner-only, outside cloud-synced folders. SQLite is not encrypted; WAL/SHM files follow the DB. Back up the DB with SQLite's backup API, not a file copy. Deleting or expiring data does not erase backups.

Before committing: `git status --short --untracked-files=all`, `git check-ignore -v <private paths>`, `git diff --cached --name-only`, then review `git diff --cached`. Never `git add -f` a directory.

## Leak regression test (Phase 1)

`scripts/validate-private-boundary.mjs`, run after `npm run build`:

1. Create a fresh `PRIVATE_STUDY_SENTINEL_<random16>` and write it to private locations (`.private/study/sentinel.md`, `.study-engine/sentinel.json`). Fail if `git check-ignore` does not ignore them.
2. `git grep -I PRIVATE_STUDY_SENTINEL_` → 0 hits in tracked files.
3. All text files in `dist/` and `.vercel/output/` → 0 hits.
4. Pagefind `*.pf_fragment` / `*.pf_index` gunzipped → 0 hits, and a published control string ≥ 1 hit.
5. 0 `*.map` files; no `GEMINI_API_KEY=` or key-shaped strings.
6. Remove the sentinel files.

Locally: step 1 before the build, steps 2–6 after. In CI there are no private files, so run 2–5 (the prefix must appear nowhere) and check that `.gitignore` covers `.private/`. Real lecture files never go to CI. This test only proves nothing leaks into public paths; disk encryption and backups are separate.
