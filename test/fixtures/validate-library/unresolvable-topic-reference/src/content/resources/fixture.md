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
  "relatedTopics": ["genuinely-unknown-topic"]
}
---

Fixture: `relatedTopics` names a topic id that has never existed — not a
current id, not anyone's alias, not reachable through any mergedInto chain
(there are no topics in this fixture at all). This must FAIL. This is the
other half of alias-aware resolution: accepting an alias must not widen into
accepting anything, which is what this case guards against.
