---
about: resource:headroom
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/headroomlabs-ai/headroom
---

## 무엇인가
Headroom은 AI 에이전트가 LLM에 보내는 내용(도구 출력, 로그, 파일, RAG 조각, 대화 기록)을 줄여 주는 Apache-2.0 오픈 소스 프로젝트입니다. 압축은 로컬에서 실행되며 압축 대상 내용을 외부 서비스로 보내지 않는다고 설명합니다. 토큰 비용과 컨텍스트 길이를 줄이고 싶은 에이전트 사용자와 LLM 앱 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- 코딩 에이전트가 긴 로그나 JSON 출력을 읽느라 토큰을 많이 쓸 때
- 코드 수정 없이 프록시만 끼워 기존 앱의 입력을 줄이고 싶을 때
- Claude Code, Codex 같은 에이전트를 압축 프록시 위에서 실행하고 싶을 때
- 압축된 원문을 필요할 때 다시 불러오고 싶을 때

## 핵심 기능
- **세 가지 사용 방식**: 라이브러리 `compress(messages)`, 프록시 `headroom proxy --port 8787`, 에이전트 래퍼 `headroom wrap <agent>`가 있습니다.
- **내용 종류별 압축**: JSON, 소스 코드(AST 분석), 일반 문장에 각각 다른 압축기를 씁니다.
- **가역 압축(CCR)**: 원본을 로컬에 저장해 모델이 `headroom_retrieve`로 다시 가져올 수 있습니다.
- **MCP 서버**: compress, retrieve, stats 도구를 MCP 클라이언트에 노출합니다.
- **통계 명령**: `headroom doctor`, `headroom savings`, `headroom dashboard` 등이 있습니다.

## 시작하는 법
Python 3.10 이상이 필요합니다.

```bash
pip install "headroom-ai[all]"
headroom proxy --port 8787
```

`uv tool install`, npm(TypeScript SDK만), Docker 이미지도 제공됩니다. 에이전트와 함께 쓰려면 `headroom wrap <agent>`로 로컬 프록시와 에이전트를 함께 띄우고, 되돌릴 때는 `headroom unwrap <tool>`을 씁니다.

## 알아둘 점
- README의 자체 벤치마크에서 토큰 절감은 시나리오에 따라 21%에서 57%였습니다. 입력이 반복적일수록 효과가 크고, 짧은 대화나 이미 조밀한 데이터는 효과가 작다고 합니다.
- 익명 사용 지표 전송이 기본으로 켜져 있으며, `HEADROOM_TELEMETRY=off` 등으로 끌 수 있습니다. 프롬프트와 코드는 보내지 않는다고 설명합니다.
- Intel Mac은 Docker나 수동 설정이 필요하고, 회사 네트워크의 SSL 검사가 설치 오류를 일으킬 수 있습니다.
- 별도의 유료 Enterprise 제품이 있으나 저장소 자체는 Apache 2.0입니다(2026-10 기준).
