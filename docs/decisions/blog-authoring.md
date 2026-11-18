# 블로그 글 작성과 렌더링의 경계

채택 · 2026-11-18

글마다 레이아웃과 컴포넌트 import를 반복하면 초안과 게시 글의 표현이 갈라진다. 레이아웃은 Astro가 담당하고 글에는 내용, 의미 있는 태그, 명시적 관계만 남긴다. 메타데이터가 없는 글은 개발 서버에서 기본 레이아웃을 적용하고, 공개 빌드와 공개 자료 검증에서는 제외한다. 기존의 공개 기준은 frontmatter가 있는 글에 적용한다.

시리즈 링크는 기존 언어와 순서에서 파생한다. 연결이 확인되지 않은 글은 별도 관련 항목으로 추정하지 않는다. 표지는 편집자가 지정한 이미지를 우선하며, 기존 이미지 없는 글은 주제에 맞춰 고른 기하학적 모티프를 사용한다. 이 모티프는 도식적 해석이다. 데이터나 실측값을 나타내지 않는다.

[Diátaxis 적용 안내](https://diataxis.fr/how-to-use-diataxis/)의 점진 개선 원칙으로 작성 절차와 필드 참조를 분리했다. [Google 문서 작성 지침](https://google.github.io/styleguide/docguide/best_practices.html)에 따라 변경할 때 코드와 문서를 함께 수정한다. [Astra의 지침 설계 글](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)의 단계적 공개 원칙을 따라 AGENTS에는 작업별 진입점만 두고 상세 절차를 링크한다.

반복 실행은 `post:new`, `post:audit`, `blog:validate` 같은 로컬 명령과 빌드 훅이 담당한다. Agent는 해당 작업을 맡으면 AGENTS의 경로를 따라 필요한 명령을 실행한다. 파일 작성 자체에 모델 호출이나 외부 연동은 필요 없다.
