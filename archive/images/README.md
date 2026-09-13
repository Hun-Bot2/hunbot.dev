# Archived Images

Assets moved out of `public/` because nothing references them, but which retain
historical or reference value. They are **not published** — `public/` is the only
directory Astro copies to the site, so nothing here is served or counted against
the image budget in `scripts/validate-performance-budget.mjs`.

Kept because they document how something evolved:

| File | Superseded by | Why kept |
|---|---|---|
| `local-llm-architecture-en(v1).png` | `LOCAL_LLM/local-llm-architecture-en(v2).png` | Earlier local-LLM architecture; the v2 diagram is what posts use now. |
| `blog-arch.png` | `BLOG/blog-arch-v2.png` | First blog architecture diagram. |
| `ZORO/ver2.png`, `ver3.png`, `ver4.png` | — | Design iterations of the Zoro UI. `ver1.png` is still referenced by a post; these later revisions are not. |

To publish one again, move it back under `public/images/` and reference it from a
post. To discard one permanently, delete it — the reason it was kept is recorded
above, so that decision can be made deliberately.

Assets that were genuinely obsolete (unused Astro starter placeholder art) were
deleted rather than archived.
