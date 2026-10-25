---
about: resource:superpowers
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/obra/superpowers
---

## 무엇인가
Superpowers는 코딩 에이전트를 위한 스킬 프레임워크이자 소프트웨어 개발 방법론입니다. 조합 가능한 스킬 모음과, 에이전트가 그 스킬을 쓰도록 만드는 초기 지시문으로 구성됩니다. Jesse Vincent와 Prime Radiant가 관리하며, Claude Code를 비롯한 여러 코딩 에이전트에서 설치해 쓸 수 있습니다.

## 이럴 때 쓴다
- 에이전트가 바로 코드부터 쓰지 않고 요구사항을 먼저 묻게 하고 싶을 때
- 설계, 계획, 구현, 리뷰 순서를 일정한 절차로 고정하고 싶을 때
- 작업마다 독립된 git 워크트리와 서브에이전트를 활용해 병렬로 진행하고 싶을 때
- 테스트 주도 개발이나 체계적 디버깅 규칙을 에이전트에 적용하고 싶을 때

## 핵심 기능
- **brainstorming**: 의도를 확인하고 설계안을 만듭니다
- **writing-plans**: 파일 경로와 검증 단계가 담긴 작은 작업 단위로 계획을 쪼갭니다
- **subagent-driven-development**: 작업마다 새 서브에이전트를 쓰고 결과를 리뷰하며 진행합니다
- **test-driven-development**: 레드-그린-리팩터 순서를 강제합니다
- **requesting-code-review / finishing-a-development-branch**: 계획 기준 리뷰와 병합, PR 등 마무리 선택지를 제공합니다

그 밖에 systematic-debugging, verification-before-completion 등의 스킬도 있고, 스킬은 자동으로 발동된다고 설명합니다.

## 시작하는 법
설치 방법은 도구마다 다르며, 쓰는 도구마다 따로 설치해야 합니다. Claude Code의 경우 다음 명령을 씁니다.

```
/plugin install superpowers@claude-plugins-official
```

Gemini CLI는 `gemini extensions install https://github.com/obra/superpowers`를 씁니다. 설치 뒤 새 기능을 만들자고 요청하면, 에이전트가 먼저 질문하고 스펙을 짧게 나눠 보여 주는 흐름으로 시작됩니다.

## 알아둘 점
- 라이선스는 MIT입니다.
- README는 Claude Code, Codex, Cursor, Gemini CLI, Copilot CLI 등 16개 도구를 지원한다고 적습니다.
- 절차가 정해진 방법론이므로, 가벼운 수정까지 이 흐름을 따를지는 사용자가 판단할 부분입니다. 이 점은 문서에서 별도로 다루지 않았습니다.
