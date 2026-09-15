---
{
  "id": "fixture-archived-topic",
  "label": { "ko": "보관된 주제" },
  "description": { "ko": "다른 주제로 병합된 보관 주제입니다." },
  "positiveKeywords": [],
  "negativeKeywords": [],
  "venues": [],
  "arxivCategories": [],
  "seedPapers": [],
  "reviewPolicy": { "autoPublish": false, "requireHumanReview": true },
  "status": "archived",
  "mergedInto": "fixture-survivor-topic"
}
---

Fixture: proves the scope note holds — `mergedInto` on a TOPIC must keep
validating even after the T02 boundary extension forbids it on
papers/resources. Mirrors T03's real lifecycle mechanism
(docs/decisions/discover-direction.md#Taxonomy): archiving a topic sets
`mergedInto` on the survivor pointer, and this must never be flagged as a
corpus-only leak.
