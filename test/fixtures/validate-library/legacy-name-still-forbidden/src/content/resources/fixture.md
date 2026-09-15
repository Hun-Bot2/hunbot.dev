---
{
  "id": "fixture-resource",
  "url": "https://example.com",
  "tags": [],
  "license": { "publicPolicy": "unknown" },
  "status": "draft",
  "rawHtml": "<p>scraped page source</p>"
}
---

Fixture: proves the original five forbidden names (pre-T02) still fail after
the T02 boundary extension. A regression here — the extended
`forbiddenFieldNames` set silently dropping a name while gaining new ones —
would be the worst outcome this task could produce.
