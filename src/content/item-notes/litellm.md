---
about: resource:litellm
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/BerriAI/litellm
  - https://raw.githubusercontent.com/BerriAI/litellm/main/README.md
---

## 무엇인가
LiteLLM은 100개 이상의 LLM 제공사를 OpenAI 형식의 하나의 인터페이스로 호출하게 해 주는 오픈소스 도구입니다. OpenAI, Anthropic, Gemini, Bedrock, Azure 등을 같은 코드 형태로 다룰 수 있습니다. 파이썬 코드에서 라이브러리로 쓰는 방식과, 팀 단위로 운영하는 게이트웨이(프록시 서버) 방식 두 가지로 제공됩니다.

## 이럴 때 쓴다
- 모델 제공사를 바꿔도 애플리케이션 코드를 거의 고치지 않고 싶을 때
- 한 제공사가 실패하면 다른 모델로 넘기는 재시도·폴백 로직이 필요할 때
- 팀이나 프로젝트별로 API 키를 나눠 발급하고 사용 비용을 추적하고 싶을 때
- 여러 모델을 한 엔드포인트 뒤에 두고 내부 도구들이 같은 주소를 쓰게 하고 싶을 때

## 핵심 기능
- **통합 호출**: 채팅 완성, 임베딩, 이미지, 오디오, 배치, 리랭크 등 여러 엔드포인트를 지원합니다.
- **Router**: SDK 안에서 재시도, 폴백, 애플리케이션 수준 부하 분산, 비용 추적을 제공합니다.
- **프록시 서버**: 가상 키, 멀티 테넌트 지출 추적, 프로젝트별 가드레일과 로깅, 관리 대시보드를 갖췄습니다.
- **MCP·에이전트 연동**: MCP 서버를 어떤 모델과도 연결하고, A2A 에이전트 호출을 지원합니다.
- **배포 자료**: AWS(ECS Fargate)와 GCP(Cloud Run)용 Terraform 모듈, Docker 이미지가 안내되어 있습니다.

## 시작하는 법
SDK 설치는 아래처럼 합니다.

```bash
uv add litellm
```

환경 변수로 제공사 API 키를 설정한 뒤 `litellm`의 `completion`에 `openai/gpt-4o` 같은 모델 이름과 메시지 목록을 넘기면 됩니다. 게이트웨이는 다음처럼 설치하고 실행합니다.

```bash
uv tool install 'litellm[proxy]'
litellm --model gpt-4o
```

실행 후에는 OpenAI 클라이언트의 base URL을 프록시 주소(예: `http://0.0.0.0:4000`)로 지정하면 됩니다.

## 알아둘 점
- 오픈소스이지만 일부 엔터프라이즈 기능은 별도의 "LiteLLM Commercial License" 대상이라고 안내되어 있습니다. 저장소 라이선스 표기는 GitHub에서 하나로 식별되지 않으므로 직접 확인해야 합니다.
- 유료 엔터프라이즈 플랜에는 SSO, 맞춤 SLA, 전용 지원 채널 등이 포함된다고 소개됩니다.
- 한 환경에는 SDK 배포판을 하나만 설치하라고 README에 적혀 있습니다.
