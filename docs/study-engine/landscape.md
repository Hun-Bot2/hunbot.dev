# Landscape

What people at the frontier build and sell, and how my other projects fit. Researched 2026-11-10. **[P]** = checked against a primary source (company blog, docs, paper, GitHub). **[S]** = news, aggregators or vendor marketing only.

## Where the frontier is

1. **Money is in agents.** Claude Code passed a $2.5B run-rate in February 2026 [P]; Cursor passed $1B annualized revenue in November 2025 [P]. Pricing moved from seats to subscriptions with usage windows plus usage-billed runs.
2. **Small task-specific models are a production pattern — usually 1–4B, not 0.3B.** NVIDIA's position paper argues agents mostly run repetitive narrow tasks that small models handle, calling large models only when needed [P, arXiv 2506.02153]. Google positions Gemma 3 270M for extraction, routing, text-to-structure and "fleets of small task-specific models", not chat [P].
3. **Teacher → data → SFT (→ RL with an LLM judge) → OpenAI-compatible endpoint** is a standard, sold as a service. Knowunity (a Berlin study app) moved quiz generation from a frontier API to a ~3B-active model trained on ~50k teacher examples for about $250 of compute; quizzes passing all quality criteria rose from 39% to 65% and cost dropped to about a third [vendor blog only, distil labs]. The gains came from an explicit rubric and eval set.
4. **On-device adapters are platform features**: Apple's Foundation Models framework (~3B on device, LoRA adapter toolkit) [P]; Gemma 3 270M fine-tuned in Colab and run in the browser [P]; Liquid AI LFM2 "Nanos" such as a 350M JSON extractor and a 350M EN↔JA translator [P, quality claims are the vendor's].
5. **Study features are free table stakes**: NotebookLM flashcards and quizzes (Sept 2025) [S], ChatGPT Study Mode (July 2025) [P], Gemini Guided Learning (Aug 2025) [P], Claude learning modes [S]. Gizmo (notes → quizzes and flashcards) raised a $22M Series A in April 2026 [S].

Evidence for 0.6B models on *generation* is thin: I found no rigorous public 0.6B-vs-frontier comparison. On *classification*, a Qwen3-0.6B student matched its teacher on two tasks [vendor blog].

## Already commoditized

- "Upload notes, get flashcards/quizzes."
- Socratic tutoring chat.
- Thin LLM-wrapper Anki add-ons (most have under ~1,000 users [S]) and basic Anki MCP servers — at least five exist on AnkiConnect; `timKnds/anki-mcp` targets "study materials → decks" [P, GitHub].
- Generic fine-tuning tooling (Unsloth, hosted SFT).

Anki stewardship moved to AnkiHub in February 2026 [P, Anki forum].

## Open niches relevant to Study Engine

1. **Card quality evaluation rather than generation** — a public rubric and eval set for good cards; the big apps do not expose theirs. Study Engine already produces the labels (`review` defects, suspended cards).
2. **Review-history loop** — no commodity tool uses Anki lapses to split or regenerate failing cards. This is the part that makes it an agent (Phase 6).
3. **Korean CS/AI notes with a small local model** — SmolLM3 does not cover Korean; NotebookLM is generic.
4. **A public, honest distillation write-up** at the few-hundred-example, sub-1B scale — rare.

## Productization patterns for solo developers

- Local-first + bring-your-own-key + optional paid hosted tier (Obsidian Copilot: open source, own key or Ollama; paid tiers with hosted agents) [P for the repo, S for prices].
- Open-source core as distribution, monetized by hosting or acquisition (Unsloth; OpenPipe, acquired by CoreWeave in Sept 2025 [P]).
- MCP server as a distribution channel — cheap to build and copy; revenue evidence is weak [S].
- One small model per task — pays off only at volume and with a good eval set.

## Fit with my projects

| Project | Pattern it matches | Assessment |
| --- | --- | --- |
| **Study Engine** | Niches 1, 2, 4 | Main project. Small model for classification and evidence selection, not free generation |
| **Fraud-Review** (Chrome extension for search-result quality) | Narrow classification, high volume, browsing data should stay on device; Gemma 270M in the browser is exactly this setup | The best fit for a sub-1B model — likely a better first small-model project than Study Engine |
| **LOCAL_LLM** (blog translation) + Autocage workstation | Narrow translation models (LFM2 EN↔JA 350M); the workstation GPU is my training machine | Second distillation candidate; train locally rather than in the cloud |
| **Orven** (ChatGPT → MCP → Cloudflare Worker → local) | Already on MCP; spec 2026-07-28 changed to stateless | Reuse for the Study Engine MCP server |
| **ALGO_BOT / Similarity Map** | Embedding similarity, weakness analysis | Could feed weak topics into the review-history loop |
| StatusArc, JP_APP, On-The-Block | Conversation practice and chatbots are commoditized | Not related to this direction |

## Unverified

Distil labs results and model names (vendor blog only); Cursor's later revenue and acquisition reports; Replit and Manus revenue; Codex plan details; Gizmo's user count; Obsidian Copilot prices; Claude learning-mode details from press only.
