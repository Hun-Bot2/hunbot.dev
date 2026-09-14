---
{
  "id": "fixture-paper",
  "itemId": "itm-z8jajy8b0wvwy25514xyhyp0yf",
  "title": "Fixture Paper",
  "url": "https://example.com",
  "venue": "iclr",
  "acceptanceStatus": "accepted",
  "honors": ["accepted"],
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

Fixture: `honors` conflates an acceptanceStatus value ("accepted") into the
honors array. The legacy `decision` enum entangled acceptance, honor,
presentation format, and provenance into one value; C2 splits them into
independently validated fields, and this must be rejected to prove the split
is enforced, not merely modeled.
