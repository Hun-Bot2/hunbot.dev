---
about: resource:portkey-gateway
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/Portkey-AI/gateway
  - https://raw.githubusercontent.com/Portkey-AI/gateway/main/README.md
---

## 무엇인가
Portkey AI Gateway는 여러 LLM으로 가는 요청을 하나의 API로 보내 주는 오픈소스 게이트웨이입니다. 애플리케이션은 게이트웨이 하나만 호출하고, 어느 제공사와 모델로 보낼지, 실패하면 어디로 돌릴지는 게이트웨이 설정에서 정합니다. 여러 모델 제공사를 쓰는 서비스를 안정적으로 운영하려는 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- 특정 제공사 장애 시 다른 모델로 자동 전환되게 하고 싶을 때
- 여러 API 키나 제공사에 요청을 나눠 부하를 분산할 때
- 응답 캐싱으로 비용과 지연을 줄이고 싶을 때
- 입력과 출력에 대한 안전성 검사를 요청 경로에 넣고 싶을 때

## 핵심 기능
- **라우팅**: 키나 제공사 사이의 로드 밸런싱, 조건부 라우팅, 요청 타임아웃을 지원합니다.
- **폴백과 재시도**: 실패 시 다른 제공사로 넘기고, 지수 백오프로 자동 재시도합니다.
- **가드레일**: 입력·출력 검사를 제공하며 40개 이상의 사전 구성 가드레일이 있다고 소개됩니다.
- **캐싱**: 단순 캐시와 의미 기반(semantic) 캐시를 지원합니다.
- **멀티모달과 MCP**: 비전·오디오·이미지 요청과 MCP 서버 관리용 게이트웨이를 다룹니다.

## 시작하는 법
Node.js가 있으면 한 줄로 로컬 게이트웨이를 띄울 수 있습니다.

```bash
npx @portkey-ai/gateway
```

게이트웨이는 `http://localhost:8787/v1`에서, 콘솔은 `http://localhost:8787/public/`에서 열립니다. 파이썬에서는 `pip install -qU portkey-ai`로 클라이언트를 설치하고 제공사와 키를 지정한 `Portkey` 객체로 `client.chat.completions.create`를 호출합니다. Docker, Cloudflare, Replit 배포 가이드도 README에 링크되어 있습니다.

## 알아둘 점
- 라이선스는 MIT로 표기됩니다(GitHub 기준).
- 자체 호스팅 외에 Portkey Cloud(호스팅 서비스)와, SOC2·ISO·HIPAA·GDPR 준수를 내세우는 엔터프라이즈 비공개 배포가 있습니다.
- README 안에서 지원 제공사·모델 수 표기가 일치하지 않습니다(250개 이상, 1,600개 이상, 45개 이상 제공사 등). 정확한 지원 목록은 공식 문서에서 확인해야 합니다.
