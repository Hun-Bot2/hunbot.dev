---
about: resource:ecc
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/affaan-m/ECC
---

## 무엇인가
ECC는 AI 코딩 에이전트에 작업 방식과 도구를 얹어 주는 오픈 소스 "에이전트 하니스" 모음입니다. 서브에이전트, 스킬, 훅, 규칙, 메모리, 보안 점검 기능을 묶어, 계획, 테스트, 구현, 리뷰, 검증을 매번 다시 지시하지 않아도 되게 하는 것이 목표라고 설명합니다. Claude Code, Codex, Cursor 등을 쓰는 개발자를 위한 것입니다.

## 이럴 때 쓴다
- 기능 개발 전에 계획 단계를 거치고 싶을 때
- 버그 수정에 테스트 주도 개발(TDD) 흐름을 적용하고 싶을 때
- 코드 리뷰나 빌드 오류 수정을 정해진 절차로 돌리고 싶을 때
- 에이전트 설정(프롬프트, 훅, MCP 설정, 권한)을 보안 관점에서 점검하고 싶을 때

## 핵심 기능
- **에이전트와 스킬**: README 기준 에이전트 71개, 스킬 311개를 제공하며 스킬이 주된 작업 단위입니다(2026-10 기준).
- **훅과 메모리**: 세션 요약과 지속 학습, 신뢰도 점수가 붙은 "instincts"를 지원합니다.
- **규칙(rules)**: 공통 규칙과 언어별 규칙 묶음을 선택해 적용합니다.
- **AgentShield**: 에이전트 설정의 프롬프트, 훅, MCP, 권한, 비밀 값을 스캔합니다.
- **Memory Vault**: 하니스 사이에서 인수인계할 수 있는 로컬 마크다운 메모리 형식입니다.

## 시작하는 법
Claude Code 기준 권장 방법은 안내형 설치입니다. Node.js 18 이상, Git, Claude Code 2.1 이상이 필요합니다.

```bash
npx ecc-universal@2.2.3 setup
```

네이티브 플러그인으로는 `/plugin marketplace add https://github.com/affaan-m/ECC` 후 `/plugin install ecc@ecc`를 씁니다. 설치 뒤에는 `/ecc:plan`, `/code-review`, `/security-scan` 같은 진입점으로 시작합니다. 같은 하니스에 설치 방식을 중복하면 스킬과 훅이 겹칠 수 있다고 경고합니다.

## 알아둘 점
- 라이선스는 MIT입니다.
- 지원 수준이 하니스마다 다릅니다. Claude Code가 주 대상이고 Cursor와 OpenCode는 베타입니다.
- 네이티브 Windows에서는 지속 학습 등 일부 기능에 제약이 있습니다.
- `/astra-review`는 변경 내용을 OpenAI로 보내며, `multi-*` 명령은 별도 런타임이 필요합니다.
- 비공식 미러는 안전하지 않을 수 있으므로 공식 저장소와 npm 패키지만 쓰라고 안내합니다.
- 확인한 페이지의 앞부분 기준이며 문서 후반부는 읽지 못했습니다.
