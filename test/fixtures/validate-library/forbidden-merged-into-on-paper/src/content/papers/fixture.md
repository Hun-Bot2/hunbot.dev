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
  "source": { "kind": "manual", "externalIds": [], "firstSeenAt": "2026-01-01", "lastCheckedAt": "2026-01-01" },
  "review": { "status": "draft", "humanReviewed": false },
  "mergedInto": "itm-2fey2rn07bnrhfa39rk24hmfsk"
}
---

Fixture: `mergedInto` on a PAPER — forbidden, INV-01's scope note. This is
the field that must NOT be added to the global forbidden-field set (that
would break the topics collection's own, unrelated `mergedInto` from T03) —
this fixture proves it is still caught on papers/resources via the
papers/resources-only check.
