---
about: resource:omniroute
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/diegosouzapw/OmniRoute
  - https://raw.githubusercontent.com/diegosouzapw/OmniRoute/main/README.md
---

## 무엇인가
OmniRoute는 직접 호스팅해서 쓰는 AI 게이트웨이입니다. Claude Code, Codex, Cursor, Cline 같은 도구가 하나의 OpenAI 호환 엔드포인트만 바라보게 하고, 그 뒤에서 여러 AI 제공사로 요청을 나눠 보냅니다. 한 제공사가 실패하거나 한도에 걸리면 자동으로 다른 곳으로 넘어가도록 구성할 수 있습니다.

## 이럴 때 쓴다
- 여러 제공사의 API 키와 무료 한도를 하나의 주소로 묶어 쓰고 싶을 때
- 코딩 에이전트가 제공사 장애나 한도 초과로 멈추지 않게 하고 싶을 때
- 프롬프트 토큰 사용량을 줄이는 압축 기능을 시험해 보고 싶을 때
- 로컬에서 키를 관리하고 대시보드로 연결 상태를 확인하고 싶을 때

## 핵심 기능
- **라우팅**: 콤보와 `auto` 모델이 20가지 라우팅 전략, 서킷 브레이커, 폴백으로 연결된 제공사를 고릅니다.
- **토큰 압축**: 12개 엔진을 쌓아 토큰 사용을 줄이며, README는 기본 조합의 평균 절감률을 약 89%로 소개합니다.
- **제공사 카탈로그**: 375개 제공사를 목록으로 두고 그중 153개를 무료 티어가 있는 곳으로 표시합니다.
- **연동 인터페이스**: CLI, 110개 도구의 MCP 서버, A2A 에이전트 엔드포인트, 웹훅, 대시보드를 제공합니다.
- **보안 옵션**: 저장된 키를 AES-256-GCM으로 암호화하고, 선택적으로 PII 마스킹을 지원합니다.

## 시작하는 법

```bash
npm install -g omniroute
omniroute
```

대시보드는 `http://localhost:20128`에서 열립니다. Docker로는 아래 명령을 안내합니다.

```bash
docker run -d --name omniroute -p 127.0.0.1:20128:20128 -v omniroute-data:/app/data diegosouzapw/omniroute:latest
```

제공사를 연결한 뒤 `/v1/chat/completions`에 모델 `auto`로 요청해 동작을 확인합니다.

## 알아둘 점
- 라이선스는 MIT로 표기됩니다.
- 제공사 계정이나 API 키는 직접 준비해야 하며, 무료 티어는 가입·승인·결제 수단이 필요할 수 있고 한도는 제공사마다 바뀔 수 있습니다.
- `auto`는 연결된 경로가 하나라도 있어야 동작하므로 새로 설치한 직후에는 사용할 수 없을 수 있습니다.
- Docker 이미지의 기본 메모리 힙은 1024MB로 가벼운 사용에 맞춰져 있고, `:next` 태그는 운영용으로 지원되지 않습니다.
- 쿠키 기반 제공사는 별도의 Playwright Chromium 설정이 필요합니다.
- README의 압축률과 무료 한도 수치는 프로젝트 자체 집계입니다(2026-10 기준).
