---
title: '26년 반기를 돌아보면서'
description: '설명 입력'
pubDate: '2026-06-12'
#heroImage: '/images/giscus.png'
tags: ['tag1', 'tag2']
category: 'category'
series: 'series 이름'
seriesOrder: 1
---

# ONTHEBLOCK App Gateway 설명

## 결론

`app-gateway-service`는 여러 서비스를 억지로 한곳에 묶는 서비스가 아니다.

목적은 Flutter 앱이 안정적인 gRPC 진입점 하나를 바라보게 하고, 내부의
`authorization-service`, `recommendation-service`, `chatbot-service` 같은
도메인 서비스를 private하게 보호하면서 요청을 올바른 서비스로 전달하는
모바일용 gRPC gateway/BFF를 만드는 것이다.

즉, gateway는 다음 문제를 해결하기 위해 만든다.

- Flutter가 내부 서비스별 URL, IAM, metadata 규칙을 모두 알 필요가 없게 한다.
- 내부 Cloud Run 서비스는 private하게 유지한다.
- 사용자 인증, request_id, timeout, logging, metadata forwarding을 한곳에서 관리한다.
- Flutter-facing proto를 안정적으로 유지하고, 내부 서비스 변경을 앱에 바로 노출하지 않는다.
- chatbot 경로와 recommendation 직접 경로를 명확히 분리한다.

## 왜 gateway가 필요한가

ONTHEBLOCK은 기능별로 서비스가 나뉘어 있다.

- `authorization-service`: 로그인, 토큰 검증, 사용자 인증
- `recommendation-service`: 추천 프로필, 추천 순위, 추천 이유, 추천 이벤트
- `chatbot-service`: 챗봇 orchestration, 추천 context 구성, LLM 호출, guardrail
- `llm-serving-service`: 모델 inference만 담당
- `map-service`, `survey-service`, `board-service`: 각자 도메인 기능 담당

Flutter가 이 모든 서비스를 직접 호출하면 앱이 너무 많은 책임을 갖게 된다.

예를 들어 Flutter가 직접 해야 할 일이 많아진다.

- 어떤 화면에서 어떤 backend service를 호출할지 판단
- 서비스별 gRPC address 관리
- private Cloud Run 호출용 Google ID token 처리
- 사용자 bearer token과 Cloud Run IAM token 구분
- 서비스별 timeout 설정
- 서비스별 장애 fallback 처리
- proto 변경에 따른 앱 수정
- request_id, logging, observability 기준 맞추기

이건 모바일 앱이 맡기에는 무겁다. 앱은 사용자 경험과 화면 상태에 집중해야
하고, backend routing과 service-to-service 인증은 서버에서 처리하는 것이 맞다.

그래서 `app-gateway-service`를 둔다.

## gateway가 하는 일

gateway는 Flutter-facing gRPC API를 제공한다.

Flutter는 내부 서비스들을 직접 알지 않고 gateway만 호출한다.

```text
Flutter
-> app-gateway-service
-> internal backend services
```

gateway는 요청을 받은 뒤 다음 일을 한다.

- Flutter의 `authorization: Bearer <user_access_token>` metadata를 받는다.
- access token을 검증하거나 authorization-service를 통해 사용자 context를 확인한다.
- trusted user context를 만든다.
- 필요한 downstream service를 선택한다.
- 사용자 bearer token을 downstream service에 그대로 전달한다.
- private Cloud Run service에는 별도로 Google ID token을
  `x-serverless-authorization` metadata로 붙인다.
- gRPC response를 Flutter가 쓰기 좋은 app-facing response로 반환한다.

## gateway가 하지 말아야 하는 일

gateway는 도메인 서비스가 아니다.

따라서 gateway는 다음 일을 하면 안 된다.

- 술 추천 점수 계산
- 추천 순위 변경
- 추천 후보 필터링
- 추천 이유 생성
- 설문 데이터 해석
- 지도 DB 또는 추천 DB 직접 조회
- 챗봇 답변 생성
- LLM 직접 호출
- client가 보낸 `user_id` 신뢰

특히 LLM 호출은 절대 gateway가 직접 하면 안 된다.

LLM 호출은 `chatbot-service` 책임이다.

```text
Flutter
-> app-gateway-service
-> chatbot-service
-> llm-serving-service
```

gateway가 LLM을 직접 호출하기 시작하면 chatbot-service의 guardrail,
grounded context, verifier 책임이 gateway로 새어 들어오게 된다. 그러면 서비스
경계가 무너진다.

## chatbot 경로와 recommendation 직접 경로

gateway에는 크게 두 종류의 routing이 생긴다.

### 1. Chatbot path

챗봇 질문은 gateway가 chatbot-service로 보낸다.

```text
Flutter
-> app-gateway-service
-> chatbot-service
-> recommendation-service
-> llm-serving-service
```

이 흐름에서 gateway는 챗봇 내용을 해석하지 않는다.

gateway의 역할은 다음뿐이다.

- 인증 확인
- metadata forwarding
- private Cloud Run IAM token 추가
- timeout 적용
- response 전달

질문 의도 분류, 추천 context 구성, LLM 호출, hallucination 차단은
`chatbot-service`가 담당한다.

### 2. Recommendation direct path

추천 화면, 홈 hero, 추천 리스트, 추천 이벤트 같은 UI는 gateway가
recommendation-service로 직접 보낼 수 있다.

```text
Flutter
-> app-gateway-service
-> recommendation-service
```

하지만 이때도 gateway는 추천을 만들지 않는다.

gateway는 recommendation-service가 준 순서와 값을 그대로 앱에 전달해야 한다.

gateway가 하면 안 되는 일:

- 추천 결과 재정렬
- score 재계산
- 가격/장소/재고 추측
- reason code 해석으로 새로운 이유 생성
- survey DB 또는 recommendation DB 직접 조회

## authorization과 x-serverless-authorization 차이

이 부분이 가장 중요하다.

Flutter에서 gateway로 들어오는 metadata:

```text
authorization: Bearer <user_access_token>
```

gateway가 private downstream Cloud Run service를 호출할 때:

```text
authorization: Bearer <user_access_token>
x-serverless-authorization: Bearer <google_id_token_for_downstream_service>
```

두 token은 목적이 다르다.

- `authorization`: 앱 사용자 인증과 user context용
- `x-serverless-authorization`: Google Cloud Run IAM 통과용

절대 user access token을 Google ID token으로 대체하면 안 된다.

recommendation-service나 chatbot-service는 `authorization` metadata를 보고
사용자를 판단해야 한다. Cloud Run IAM은 `x-serverless-authorization`으로만
처리한다.

## 왜 Flutter가 private service를 직접 호출하지 않는가

Flutter가 private Cloud Run service를 직접 호출하려면 앱이 Google ID token을
다뤄야 한다.

이건 좋지 않다.

- 모바일 앱에 server-to-server IAM 책임이 생긴다.
- private backend topology가 앱에 노출된다.
- 서비스 URL 변경 시 앱 수정이 필요하다.
- 권한 관리가 복잡해진다.
- 보안 경계가 흐려진다.

따라서 Flutter는 public gateway만 호출한다.

```text
Flutter -> app-gateway-service
```

그리고 gateway가 private downstream service를 호출한다.

```text
app-gateway-service -> private chatbot-service
app-gateway-service -> private recommendation-service
```

## Cloud Run 배포 관점

Flutter-facing gateway는 앱에서 호출해야 하므로 public invoker가 될 수 있다.

```text
app-gateway-service: --allow-unauthenticated
```

하지만 내부 서비스는 private하게 유지한다.

```text
chatbot-service: --no-allow-unauthenticated
recommendation-service: --no-allow-unauthenticated
llm-serving-service: --no-allow-unauthenticated
```

gateway runtime service account에는 downstream private service 호출 권한을 준다.

```text
roles/run.invoker
```

그리고 gRPC Cloud Run 배포에서는 HTTP/2가 필요하다.

```text
--use-http2
--port=8080
```

서버는 반드시 `PORT` 환경변수로 받은 port에서 listen해야 한다.

## 비용과 성능 관점

gateway를 추가하면 네트워크 hop이 하나 생긴다.

```text
Flutter -> gateway -> service
```

하지만 이 비용은 보통 작다.

반대로 gateway가 없으면 Flutter가 여러 backend service와 직접 연결해야 하므로
운영 비용과 복잡도가 커진다.

gateway가 주는 이점은 다음과 같다.

- 앱 release 없이 backend routing 변경 가능
- downstream timeout과 retry 정책 중앙화
- request logging과 tracing 중앙화
- private service 보호
- Flutter proto 안정성 유지
- 서비스별 장애 fallback 설계 가능

따라서 약간의 hop 비용보다 구조적 이점이 더 크다.

## MSA 관점에서의 의미

MSA에서 gateway는 도메인 로직을 모으는 곳이 아니다.

gateway는 service boundary를 지키기 위한 외부 진입점이다.

좋은 gateway:

- 얇다.
- 인증과 routing에 집중한다.
- domain service의 책임을 침범하지 않는다.
- API contract를 안정화한다.
- 내부 service topology를 숨긴다.

나쁜 gateway:

- 추천을 직접 계산한다.
- chatbot 답변을 직접 만든다.
- 여러 DB를 직접 읽는다.
- 모든 비즈니스 로직을 한곳에 모은다.
- 내부 서비스 변경을 임시로 때우는 장소가 된다.

우리가 만들 gateway는 첫 번째 방향이어야 한다.

## 현재 ONTHEBLOCK에서 gateway가 필요한 직접적인 이유

현재 챗봇 시스템은 여러 서비스가 순서대로 연결된다.

```text
Flutter
-> chatbot-service
-> recommendation-service
-> llm-serving-service
```

그리고 추천 UI는 별도 흐름도 필요하다.

```text
Flutter
-> recommendation-service
```

Flutter가 이 둘을 모두 직접 관리하면 앱 구조가 복잡해진다.

gateway를 두면 Flutter는 다음처럼 단순해진다.

```text
Flutter
-> app-gateway-service
```

그리고 gateway 내부에서 분기한다.

```text
chatbot request -> chatbot-service
recommendation request -> recommendation-service
auth request -> authorization-service
```

이렇게 하면 앱은 하나의 backend contract를 사용하고, backend는 각 서비스의
책임을 유지할 수 있다.

## 첫 구현 대상

처음부터 모든 서비스를 gateway로 옮길 필요는 없다.

big-bang migration은 위험하다.

추천 순서:

1. gRPC health check
2. auth metadata resolver
3. chatbot gRPC proxy
4. recommendation profile status proxy
5. beverage recommendation proxy
6. venue recommendation proxy
7. feedback/event proxy
8. Flutter staging integration

먼저 chatbot과 recommendation만 gateway로 연결해도 충분히 의미가 있다.

## 최종 정리

`app-gateway-service`는 “엮이는 서비스들을 하나로 합치는 서비스”가 아니다.

정확한 목적은 다음이다.

```text
Flutter-facing gRPC contract를 안정화하고,
내부 private services로 안전하게 routing하는 얇은 BFF/gateway
```

gateway는 앱과 내부 MSA 사이의 경계다.

이 경계를 두면 Flutter는 단순해지고, 내부 서비스는 private하게 보호되며,
recommendation-service와 chatbot-service의 책임도 명확하게 유지된다.
