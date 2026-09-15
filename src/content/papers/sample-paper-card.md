---
{
  "id": "sample-paper-card",
  "itemId": "itm-7811ctspfjhjwgc0s299yf7dcd",
  "title": "Sample Paper Title",
  "url": "https://example.com/paper",
  "paperUrl": "https://example.com/paper.pdf",
  "codeUrl": null,
  "projectUrl": null,
  "venue": "iclr",
  "year": 2026,
  "acceptanceStatus": "accepted",
  "honors": [],
  "presentationFormat": null,
  "provenance": "RADAR",
  "topics": ["ai-agents"],
  "priority": "medium",
  "difficulty": "intermediate",
  "status": "approved",
  "summary": {
    "ko": {
      "tldr": "이 논문이 무엇을 말하는지 30초 안에 이해할 수 있는 샘플 요약입니다.",
      "problem": "이 논문이 다루는 문제를 설명하는 샘플 문장입니다.",
      "keyIdea": "핵심 아이디어를 짧게 정리한 샘플 문장입니다.",
      "whyItMatters": "개발자와 빌더에게 왜 중요한지 설명하는 샘플 문장입니다.",
      "limitations": "확인해야 할 한계를 기록하는 샘플 문장입니다.",
      "readThisIf": "AI 에이전트와 도구 사용 연구에 관심 있다면 읽을 만하다는 샘플 문장입니다."
    },
    "en": {
      "tldr": "A short reviewed English TLDR for schema validation."
    },
    "jp": {
      "tldr": "確認済みの短い日本語TLDRのサンプルです。"
    }
  },
  "signals": {
    "citationCount": null,
    "influentialCitationCount": null,
    "hasCode": false,
    "hasProjectPage": false
  },
  "source": {
    "kind": "manual",
    "externalIds": [],
    "firstSeenAt": "2026-05-22",
    "lastCheckedAt": "2026-05-22"
  },
  "review": {
    "status": "approved",
    "humanReviewed": true,
    "aiDraftUsed": false,
    "reviewedAt": "2026-05-22",
    "reviewer": "owner"
  },
  "relatedResources": [],
  "relatedDecks": []
}
---

Sample paper card entry for Library schema validation.

`provenance` is `RADAR`, not `VERIFIED`: this is fabricated sample data with
no authoritative source establishing the acceptance claim, so it does not
qualify even though `venue` happens to be a registry id and the record is
human-reviewed. See docs/decisions/research-item-identity.md#Migration-Notes-For-T09.
