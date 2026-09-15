---
{
  "id": "fixture-paper",
  "itemId": "itm-2fey2rn07bnrhfa39rk24hmfsj",
  "title": "Fixture Paper",
  "url": "https://example.com",
  "venue": "not-a-real-venue-xyz",
  "acceptanceStatus": "accepted",
  "honors": [],
  "presentationFormat": null,
  "provenance": "VERIFIED",
  "topics": ["fixture-topic"],
  "priority": "low",
  "difficulty": "unknown",
  "status": "draft",
  "summary": {},
  "signals": {},
  "source": { "kind": "manual", "externalIds": [], "firstSeenAt": "2026-01-01", "lastCheckedAt": "2026-01-01" },
  "review": { "status": "draft", "humanReviewed": true }
}
---

Fixture: `provenance` is asserted as "VERIFIED" while `venue` does not
resolve to any registry entry — an unevidenced claim. Being human-reviewed is
necessary but not sufficient: "VERIFIED" drives destructive TTL in the
private Research OS and must never be assignable by assertion alone
(docs/decisions/research-item-identity.md#Status-History-And-Provenance-Tier).
This stands in for the private-only `sameWorkAs`-without-evidence case from
the task packet, which cannot be expressed as a public-projection fixture —
`sameWorkAs` is explicitly Table-B/private-only and must never appear in
`src/content/papers/`; see the handoff for the full explanation. The
underlying principle is the same: no unevidenced claim is treated as settled.
