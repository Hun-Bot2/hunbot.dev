---
{
  "id": "fixture-paper",
  "itemId": "itm-4ycxjs9x6srnb60psbkzjv3g64",
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
  "source": {
    "kind": "manual",
    "externalIds": [{ "scheme": "doi", "value": "not-a-doi" }],
    "firstSeenAt": "2026-01-01",
    "lastCheckedAt": "2026-01-01"
  },
  "review": { "status": "draft", "humanReviewed": false }
}
---

Fixture: `source.externalIds` carries a `doi` entry whose value is not a
well-formed DOI. DOI's absence from the legacy fixed-column schema was the
specific defect this migration exists to fix; a malformed one slipping
through unnoticed would be almost as bad as an absent one.
