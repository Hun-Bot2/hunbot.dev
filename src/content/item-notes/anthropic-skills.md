---
about: resource:anthropic-skills
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/anthropics/skills
---

## 무엇인가
anthropics/skills는 Anthropic이 공개한 Agent Skills 모음 저장소입니다. 스킬은 지침, 스크립트, 참고 자료를 한 폴더에 담아 두면 Claude가 필요할 때 불러 쓰는 확장 단위입니다. 이 저장소는 완성된 제품이라기보다 직접 스킬을 만들 때 참고할 예시와 템플릿 성격이 강합니다.

## 이럴 때 쓴다
- 나만의 스킬을 만들기 전에 잘 짜인 `SKILL.md`의 구조를 살펴보고 싶을 때
- Claude Code에 문서(PDF, Word, 엑셀, 슬라이드) 작업용 스킬을 붙이고 싶을 때
- 브랜드 가이드 적용이나 웹앱 테스트 같은 반복 작업을 스킬로 정리하는 방식을 참고하고 싶을 때

## 핵심 기능
- **skills/ 폴더**: 창작·디자인, 개발·기술, 기업·커뮤니케이션, 문서 작업 범주의 예시 스킬이 들어 있습니다.
- **문서 스킬**: `docx`, `pdf`, `pptx`, `xlsx` 폴더가 있습니다.
- **spec/**: Agent Skills 명세가 들어 있습니다.
- **template/**: 새 스킬을 시작할 때 쓰는 뼈대입니다.
- **플러그인 마켓플레이스 설정**: Claude Code에서 저장소를 마켓플레이스로 등록할 수 있게 합니다.

## 시작하는 법
스킬은 폴더 하나와 `SKILL.md` 파일이면 되고, 프런트매터에는 `name`(소문자와 하이픈)과 `description`이 필요합니다. Claude Code에서는 저장소를 마켓플레이스로 등록한 뒤 설치합니다.

```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

설치 후에는 프롬프트에서 "PDF 스킬로 이 파일의 양식 필드를 추출해 줘"처럼 스킬을 언급해 사용합니다. Claude.ai와 Claude API에서의 사용법은 저장소가 안내하는 Anthropic 공식 문서를 따릅니다.

## 알아둘 점
- 라이선스가 섞여 있습니다. 다수의 스킬은 Apache 2.0이지만, 문서 스킬 4종은 오픈소스가 아니라 소스 공개(source-available) 방식입니다.
- 저장소는 시연과 교육 목적으로 제공된다고 밝히며, 중요한 작업에 쓰기 전에 자신의 환경에서 충분히 테스트하라고 안내합니다.
- Claude가 실제로 보이는 동작은 스킬 예시와 다를 수 있다고 명시되어 있습니다.
