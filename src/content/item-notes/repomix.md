---
about: resource:repomix
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://repomix.com
---

## 무엇인가
Repomix는 코드베이스 전체를 AI 도구가 읽기 좋은 하나의 파일로 묶어 주는 명령줄 도구입니다. 기본 출력 파일 이름은 `repomix-output.xml`입니다. 저장소 전체를 LLM에게 한 번에 넘겨 질문하거나 리뷰를 받고 싶은 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- 프로젝트 전체 맥락을 챗봇에 붙여 넣고 구조에 대해 질문하고 싶을 때
- 낯선 오픈소스 저장소를 원격 주소만으로 묶어서 AI에게 분석시키고 싶을 때
- 토큰 수를 파일별로 확인하며 컨텍스트 한도에 맞게 줄이고 싶을 때
- 비밀 정보가 섞인 파일이 출력에 들어가는 것을 막고 싶을 때

## 핵심 기능
- **코드 압축**: Tree-sitter로 시그니처와 구조는 남기고 구현 세부를 덜어 내며, 가이드는 약 70%의 토큰 절감을 언급합니다
- **보안 검사**: Secretlint로 자격 증명 형식과 일치하는 파일을 출력에서 제외합니다
- **출력 형식**: XML(기본), Markdown, JSON, 일반 텍스트를 `--style`로 선택합니다
- **Git 연동**: `.gitignore`를 존중하고, 로컬 git을 쓰므로 비공개 저장소에도 접근합니다
- **MCP 서버**: AI 어시스턴트와 연결하는 Model Context Protocol 통합을 제공합니다

## 시작하는 법
설치 없이 바로 실행할 수 있습니다.

```
npx repomix@latest
```

전역 설치는 `npm install -g repomix` 또는 `brew install repomix`로 하며, 프로젝트 폴더에서 `repomix`를 실행하면 됩니다. 경로를 인자로 주면 특정 폴더만 묶고, `--include`와 `--ignore`로 글롭 패턴 필터를 걸 수 있습니다. 원격 저장소는 `--remote yamadashy/repomix` 같은 형태로 지정하고, `--init`은 `repomix.config.json`을 만듭니다. Docker 이미지도 제공됩니다.

## 알아둘 점
- 라이선스는 MIT입니다.
- 압축 효과(약 70%)는 공식 가이드의 수치이며 프로젝트마다 다를 수 있습니다.
- 보안 검사는 알려진 자격 증명 형식을 기준으로 하므로, 출력 파일을 외부에 공유하기 전에 직접 확인하는 습관이 필요합니다.
