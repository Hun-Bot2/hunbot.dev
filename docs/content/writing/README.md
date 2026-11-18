# 블로그 글 작성

## 새 글 쓰기

Node 24에서 `npm run post:new -- ko study/my-post`를 실행하면 빈 MDX 파일과 미리보기 경로를 얻는다. 원하는 위치에 Markdown이나 MDX 파일을 직접 만들어도 된다. `npm run dev`로 실행하고 `/__drafts/`에서 글을 연다. frontmatter 없이도 본문 레이아웃을 확인할 수 있다.

글의 내용을 먼저 적는다. 비교, 넓은 그림, 폴더 트리가 필요한 구간에서 [MDX 태그](components.md)를 사용한다. 블로그 라우트가 제목, 본문 폭, 시리즈 연결, 오른쪽 읽기 영역을 구성한다.

## 표지와 시리즈 지정

- 이미지가 있으면 `heroImage: /images/my-cover.webp`를 사용한다. 상세 페이지, 목록과 내부 읽기 노드가 해당 이미지를 우선한다.
- 기하학 썸네일은 글의 frontmatter에서 `editorial.motif`로 선택한다. 글 목록과 이어 읽기 노드에 표시된다. 둘 다 지정하지 않은 글은 목록에서 공통 기본 이미지를 사용한다.
- 시리즈는 기존 `series` 이름과 `seriesOrder`를 사용한다. 같은 언어의 공개 글에서 이전·다음 항목을 찾는다. `editorial.relatedPosts`는 시리즈 밖의 관련 글을 명시할 때 사용한다.
- 외부 자료는 `editorial.references` 또는 본문 출처 링크에 적는다. 링크를 선택한 근거는 본문이나 설명에 남긴다.

지원 값과 예시는 [컴포넌트 및 메타데이터](components.md)에서 확인할 수 있다.

## 공개 전 확인

`title`, `description`, `pubDate`를 작성하고 글, 링크, 이미지, 시리즈 순서를 검토한다. 그다음 공개할 시점에 `draft: true`를 해제한다. `npm run post:audit`로 표지와 시리즈 상태를 확인하고, `npm run blog:validate`와 `npm run build`를 실행한다. [콘텐츠 검토 흐름](../workflow.md)에 번역과 비공개 자료 기준이 있다.
