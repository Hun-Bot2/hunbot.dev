---
about: resource:context7
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://context7.com
  - https://github.com/upstash/context7
---

## 무엇인가
Context7은 Upstash가 운영하는 서비스로, AI 코딩 에이전트에 라이브러리의 최신 버전별 문서와 코드 예시를 전달해 줍니다. 모델이 학습한 오래된 정보나 존재하지 않는 API를 만들어 내는 문제를 줄이려는 목적입니다. Claude Code, Cursor 같은 에이전트를 쓰는 개발자가 대상입니다.

## 이럴 때 쓴다
- 막 새 버전이 나온 프레임워크의 API를 에이전트가 정확히 쓰게 하고 싶을 때
- 프롬프트에서 특정 라이브러리와 버전의 문서를 근거로 코드를 생성하고 싶을 때
- 사이트에서 라이브러리별 문서 조각 수와 갱신 시점을 확인하고 싶을 때

## 핵심 기능
- **라이브러리 디렉터리**: 인기·트렌딩 라이브러리를 출처, 점수, 스니펫 수, 최근 갱신일과 함께 보여 줍니다.
- **MCP 서버**: `resolve-library-id`로 라이브러리 ID를 찾고 `query-docs`로 문서를 가져옵니다.
- **CLI**: `ctx7 library`와 `ctx7 docs` 명령으로 같은 일을 터미널에서 합니다.
- **프롬프트 지정**: 질문에 "use context7"을 붙이거나 `/supabase/supabase` 같은 ID를 직접 적습니다.
- **버전 지정**: 프롬프트에 버전을 적어 해당 문서를 요청할 수 있습니다.

## 시작하는 법
Node.js 22.13 이상에서 설정 명령을 실행하면 로그인, API 키 생성, 스킬 설치까지 안내합니다.

```
npx ctx7 setup
npx ctx7 setup --claude
```

수동으로 MCP를 붙일 때는 서버 URL `https://mcp.context7.com/mcp`에 `Authorization: Bearer <API 키>` 헤더를 보냅니다. 항상 쓰고 싶다면 Claude Code는 `CLAUDE.md`에 규칙을 추가하라고 안내합니다. 제거는 `npx ctx7 remove`입니다.

## 알아둘 점
- GitHub 저장소의 MCP 서버 코드는 MIT 라이선스이고, API 백엔드와 파싱·크롤링 엔진은 비공개입니다.
- 무료 API 키로 시작할 수 있고, 더 높은 호출 한도를 위해 키 사용을 권장합니다. 구체적인 한도 수치는 확인한 페이지에 없었습니다(2026-10 기준).
- 요금제는 사이트의 Pricing 페이지에서 따로 확인해야 합니다.
