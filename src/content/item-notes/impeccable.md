---
about: resource:impeccable
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://impeccable.style
  - https://github.com/pbakaus/impeccable
---

## 무엇인가
Impeccable은 AI 코딩 에이전트가 더 나은 UI 디자인을 하도록 돕는 디자인 어휘 및 도구 모음입니다. Paul Bakaus가 만들었고 GitHub에 공개되어 있습니다. 에이전트가 만든 평범하고 비슷비슷한 화면을 다듬고 싶은 프론트엔드 개발자와 디자이너를 위한 것입니다.

## 이럴 때 쓴다
- 에이전트가 만든 화면의 타이포그래피, 레이아웃, 색을 다듬고 싶을 때
- 디자인을 평가하고 위계, 명확성, 완성도에 대한 점검 결과를 받고 싶을 때
- 한 화면에 대해 여러 방향의 시안을 비교하고 싶을 때
- PR 단계에서 AI가 흔히 만드는 디자인 패턴을 자동으로 걸러내고 싶을 때

## 핵심 기능
- **디자인 명령**: `polish`, `typeset`, `layout`, `colorize`, `animate` 등으로 UI를 다듬습니다. 저장소 설명에는 하나의 스킬에 명령 24개가 있다고 나옵니다.
- **평가 명령**: `critique`와 `audit`이 디자인을 평가합니다.
- **탐지기**: AI 기본값 패턴을 찾는 62개 규칙이 있으며, AI 모델이나 API 키 없이 코드로 동작한다고 설명합니다.
- **PRODUCT.md와 DESIGN.md**: 제품 목적과 시각 체계를 문서로 남겨 에이전트가 읽게 합니다.
- **라이브 모드**: 실행 중인 앱에서 요소를 골라 수정 방향을 지시합니다.

## 시작하는 법
스킬을 설치한 뒤 초기화하고 훅을 켭니다.

```bash
npx impeccable install
```

Claude Code에서는 `/plugin marketplace add pbakaus/impeccable`로 추가할 수 있습니다. 설치 후 `/impeccable init`, `/impeccable hooks on`을 실행하고, 사용 중인 도구에서 훅을 승인해야 합니다. 이후 `/impeccable polish`처럼 명령을 에이전트에 줍니다. 업데이트는 `npx impeccable update`입니다.

## 알아둘 점
- 저장소 라이선스는 Apache 2.0입니다(2026-10 기준).
- 훅은 도구에서 승인하기 전에는 동작하지 않습니다.
- 결과 품질은 사용하는 에이전트와 모델에 좌우됩니다.
- Codex CLI, Claude Code, Copilot, Cursor, Gemini CLI 등 여러 도구를 지원한다고 안내합니다.
