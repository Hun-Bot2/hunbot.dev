---
{
  "id": "fixture-paper",
  "title": "Fixture Paper",
  "url": "https://example.com",
  "venue": "iclr",
  "acceptanceStatus": "accepted",
  "honors": [],
  "presentationFormat": null,
  "provenance": "RADAR",
  "topics": ["fixture-topic"],
  "priority": "low",
  "difficulty": "unknown",
  "status": "draft",
  "summary": {},
  "signals": {},
  "source": { "kind": "manual", "externalIds": [], "firstSeenAt": "2026-01-01", "lastCheckedAt": "2026-01-01" },
  "review": { "status": "draft", "humanReviewed": false }
}
---

Fixture: `itemId` is missing entirely. The canonical work identity
(docs/decisions/research-item-identity.md#Canonical-Item-Identity) is the
only join key between this public projection, the private Research OS item,
and every note anchored to it — it must never be silently absent.
