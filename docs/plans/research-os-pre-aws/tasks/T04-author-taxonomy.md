# T04 — Author Domains And Starting Topics

| | |
|---|---|
| **Class** | RECOMMENDED — does not block AWS |
| **Model** | Sonnet |
| **Effort** | **low** |
| **Why this level** | Content authoring against a schema that already exists and a starting set already specified in an ADR. No design |
| **Depends on** | T03 |
| **Owns** | `src/content/topics/` |

## Goal

Author the four domain files and the starting topic set, and promote `ai-agents` into the `agents` domain with an alias.

## Why This Is Required

`src/content/topics/` contains exactly one file. [`discover-direction.md`](../../../decisions/discover-direction.md) specifies four domains and roughly nine topics each.

**This does not block AWS.** The lifecycle *mechanism* (T03) is what gets frozen; the topic *content* is a content change by design and can be edited at any time. It is sequenced here because it exercises T03's validator against real data, which is the cheapest way to find out the schema is wrong.

## Source Of Truth

[`discover-direction.md`](../../../decisions/discover-direction.md) — §Taxonomy → *Starting set*. Use that list verbatim. It is explicitly described as a starting point expected to be wrong in places; do not improve it here.

## Minimal Required Reading

1. `shared-context.md`
2. This packet
3. `docs/decisions/discover-direction.md` — the *Starting set* and *Lifecycle* paragraphs
4. `src/content/topics/ai-agents.md` — the file format
5. T03's handoff — the final field shapes

## Decisions Already Fixed — Do Not Revisit

- The four domains: `agents`, `ml-systems`, `language-multimodal`, `human-centered`.
- The child topics listed under each in the ADR.
- `ai-agents.md` is promoted to the `agents` domain and **keeps `ai-agents` as an alias**.
- Topic files use JSON frontmatter, matching the existing file.
- `label.ko` and `description.ko` are required; `en` and `jp` are optional.

## Decisions You May Make

- `order` values within each parent.
- `positiveKeywords` / `negativeKeywords` content — these are classifier hints and should be genuinely useful, not placeholder.
- Korean label and description wording.

## Decisions You Must NOT Change

- The domain and topic ID list. Adding, renaming, or "improving" it is a separate content decision.
- The schema. If a topic cannot be expressed, that is a **finding for the handoff**, not a licence to edit `src/content.config.ts` — which T07 owns at this point.
- `reviewPolicy` defaults.

## Expected Edits

| File | Change |
|---|---|
| `src/content/topics/*.md` | ~4 domain files + ~36 topic files |
| `src/content/topics/ai-agents.md` | Add `parent: "agents"`, keep the ID, add the alias per T03's mechanism |

No code changes. No `src/content.config.ts`.

## Implementation Steps

1. Read T03's handoff for the exact field shapes.
2. Create the four domain files with `parent: null`.
3. Create the child topic files with `parent` set to their domain.
4. Promote `ai-agents.md`. **Verify the alias mechanism actually resolves** — do not assume.
5. Write real keywords. A topic whose `positiveKeywords` are placeholders is the same defect the blog's `tag1`/`tag2` problem represents, and this plan should not create new instances of it.
6. Run the validators after every ~10 files rather than at the end; a cycle or bad parent is far easier to locate that way.

## Validators To Run

```bash
npm run taxonomy:validate
npm run content:validate
npm run build
npm run links:validate
```

## Failure Cases

- **Placeholder keywords or descriptions.** Creates exactly the metadata debt this plan exists to prevent.
- **Inventing topics not in the ADR list.** Out of scope.
- **Losing the `ai-agents` alias.** Any existing reference would break — the specific failure `aliases` exists to prevent.
- **A cycle from a typo in `parent`.** The validator catches it; run it often.

## Rollback / Migration Concerns

New content files; rollback is deletion. The one migration-sensitive edit is `ai-agents.md` — the alias must be present in the **same commit** as the parent change, or a build between the two commits would lose the reference.

## Definition Of Done

- [ ] Four domain files with `parent: null`
- [ ] Child topics per the ADR list, each with a resolving `parent`
- [ ] `ai-agents.md` promoted, alias present and verified to resolve
- [ ] No placeholder text in any label, description, or keyword list
- [ ] All listed validators pass

## Handoff

Report: file count created; the domain→children mapping as authored; confirmation the `ai-agents` alias resolves; and any topic the schema could not express — that is a T07 or T03 finding, not something to fix here.
