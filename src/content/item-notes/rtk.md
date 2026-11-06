---
about: resource:rtk
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/rtk-ai/rtk
---

## 무엇인가
RTK(Rust Token Killer)는 AI 코딩 에이전트가 읽는 셸 명령 출력을 걸러 내고 압축해서 토큰 사용량을 줄이는 오픈소스 CLI 프록시입니다. Rust로 만든 단일 바이너리이며, 프로젝트는 일반적인 개발 명령에서 60~90%의 토큰 절감을 주장합니다. 에이전트에게 `git status`나 테스트 로그 같은 긴 출력을 자주 읽히는 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- Claude Code, Cursor 등에서 장황한 명령 출력이 컨텍스트를 빨리 채울 때
- 반복되는 로그 줄이 많은 빌드나 테스트 결과를 줄여서 에이전트에게 보여 주고 싶을 때
- 얼마나 절감됐는지 통계로 확인하고 싶을 때

## 핵심 기능
- **출력 필터링**: 잡음 제거, 유사 항목 묶기, 잘라내기, 반복 로그 중복 제거
- **에이전트 연동**: Claude Code, Copilot, Cursor, Gemini CLI, Codex 등 18개 도구를 지원한다고 안내합니다
- **자동 재작성**: 훅이 설치되면 `git status` 같은 명령이 자동으로 RTK 경유로 바뀝니다
- **통계와 점검**: `rtk gain`은 절감량, `rtk discover`는 놓친 적용 기회를 보여 줍니다
- **우회**: `rtk bypass <명령>`으로 필터 없이 실행합니다

## 시작하는 법
macOS와 Linux에서는 Homebrew로 설치합니다.

```
brew install rtk
rtk init -g
```

`rtk init -g`는 Claude Code용 기본 설정이며 다른 도구는 `--gemini`, `--codex`, `--agent cursor` 같은 옵션을 씁니다. 이후 AI 도구를 재시작하면 적용됩니다. Windows는 `winget install rtk-ai.rtk`를 쓰고, 설치 확인은 `rtk --version`으로 합니다. 문서는 crates.io에 이름이 같은 다른 프로젝트가 있으니 주의하라고 경고합니다.

## 알아둘 점
- 훅은 Bash 도구 호출에서만 동작하며, 내장 Read, Grep, Glob 도구의 출력은 가로채지 않습니다.
- 절감 수치는 bash 출력 기준이며 전체 비용 절감률과 같지 않습니다. 토큰 수는 바이트 수를 4로 나눈 추정값입니다.
- 텔레메트리는 기본으로 꺼져 있고 명시적으로 동의해야 켜집니다.
- 라이선스가 혼합되어 있습니다. `rtk` CLI는 Apache-2.0이지만 압축 엔진과 프록시는 BUSL-1.1이며, 제3자에게 상용 제품이나 서비스로 제공하려면 메인테이너와 협의가 필요하다고 안내합니다 (2026-10 기준).
