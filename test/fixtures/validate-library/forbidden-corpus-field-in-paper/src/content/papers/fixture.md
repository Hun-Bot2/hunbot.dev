---
{
  "id": "fixture-paper",
  "itemId": "itm-2fey2rn07bnrhfa39rk24hmfsj",
  "title": "Fixture Paper",
  "url": "https://example.com",
  "topics": ["fixture-topic"],
  "priority": "low",
  "difficulty": "unknown",
  "status": "draft",
  "summary": {},
  "signals": {},
  "source": {
    "kind": "manual",
    "externalIds": [],
    "firstSeenAt": "2026-01-01",
    "lastCheckedAt": "2026-01-01",
    "fieldSources": { "title": { "source": "arxiv", "fetchedAt": "2026-01-01" } }
  },
  "review": { "status": "draft", "humanReviewed": false }
}
---

Fixture: `fieldSources` (T01, corpus-only — INV-01) nested under `source`,
not top-level, to prove the recursive walker still catches a corpus-shaped
name at depth, not just at the document root.
