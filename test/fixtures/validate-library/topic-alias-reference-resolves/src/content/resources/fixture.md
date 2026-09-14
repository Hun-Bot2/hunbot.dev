---
{
  "id": "fixture-resource",
  "title": "Fixture Resource",
  "url": "https://example.com",
  "section": "ai-papers",
  "category": "fixture",
  "type": "reference",
  "tags": [],
  "language": "en",
  "status": "draft",
  "summary": {},
  "license": { "publicPolicy": "unknown" },
  "source": { "kind": "manual", "firstSeenAt": "2026-01-01", "lastCheckedAt": "2026-01-01" },
  "review": { "status": "draft", "humanReviewed": false },
  "relatedTopics": ["ai-agents"]
}
---

Fixture: `relatedTopics` names only the alias "ai-agents", not the topic's
current id "agents". This must PASS — a topic reference that resolves
through a uniquely-owned alias is exactly what alias-aware resolution
(scripts/lib/topic-resolution.mjs) protects. This is the live case in the
real repo: src/content/papers/sample-paper-card.md and
src/content/resources/sample-vibe-coding-resource.md both still reference
"ai-agents" after src/content/topics/ai-agents.md was renamed to agents.md.
