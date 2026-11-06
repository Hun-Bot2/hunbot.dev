---
about: resource:bifrost
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/maximhq/bifrost
---

## 무엇인가
Bifrost는 Maxim이 오픈소스로 공개한 AI 게이트웨이입니다. 여러 LLM 제공자를 OpenAI 호환 API 하나로 묶어 주는 중간 서버로, 애플리케이션이 모델 제공자별 SDK 차이를 신경 쓰지 않고 호출하도록 돕습니다. 모델 호출을 여러 곳에서 하는 팀이나 비용과 장애 대응을 관리하려는 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- 특정 제공자에 장애가 났을 때 다른 제공자나 모델로 자동 전환하고 싶을 때
- 여러 API 키와 제공자에 요청을 나눠 보내고 싶을 때
- 팀이나 키 단위로 사용량, 속도 제한, 예산을 관리하고 싶을 때
- 기존 OpenAI·Anthropic SDK 코드를 거의 바꾸지 않고 게이트웨이를 끼우고 싶을 때

## 핵심 기능
- **통합 API**: 하나의 OpenAI 호환 인터페이스로 여러 제공자를 호출합니다.
- **폴백과 로드 밸런싱**: 제공자·모델 간 자동 대체와 키 간 분산을 지원합니다.
- **시맨틱 캐싱**: 의미가 비슷한 요청의 응답을 재사용해 비용과 지연을 줄입니다.
- **거버넌스**: 가상 키, 속도 제한, 계층형 예산을 제공합니다.
- **관측성**: Prometheus 지표, 분산 트레이싱, 로깅을 제공합니다.
- **MCP 지원**: 모델이 외부 도구를 쓰도록 연결합니다.

## 시작하는 법
가장 빠른 방법은 npx입니다. 실행 후 `http://localhost:8080`에서 웹 UI로 설정합니다.

```
npx -y @maximhq/bifrost
docker run -p 8080:8080 maximhq/bifrost
```

기존 SDK는 base URL만 바꾸면 됩니다. 예를 들어 OpenAI SDK는 `http://localhost:8080/openai`, Anthropic SDK는 `http://localhost:8080/anthropic`를 가리키게 합니다.

## 알아둘 점
- 라이선스는 Apache 2.0입니다.
- 저장소는 23개 이상의 제공자를 지원한다고 밝히며, OpenAI, Anthropic, AWS Bedrock, Google Vertex, Azure, Ollama 등을 예로 듭니다.
- 적응형 로드 밸런싱, 클러스터링, 가드레일 등은 엔터프라이즈 기능으로 분류되어 있습니다.
- 성능 수치(오버헤드 마이크로초 단위)는 저장소 안에서도 문서마다 표기가 달라, 도입 전 직접 측정하는 편이 안전합니다(2026-10 기준).
