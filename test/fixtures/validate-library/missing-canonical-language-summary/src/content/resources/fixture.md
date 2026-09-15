---
{
  "id": "fixture-resource",
  "url": "https://example.com",
  "tags": [],
  "license": { "publicPolicy": "unknown" },
  "status": "approved",
  "review": { "humanReviewed": true },
  "canonicalLanguage": "en",
  "summary": { "ko": "한국어 요약만 있고 영어 요약은 없습니다." }
}
---

Fixture: approved resource declares `canonicalLanguage: "en"` but only has a
`summary.ko` entry — the relaxed rule (canonical language required, not
hard-coded Korean) must still reject this.
