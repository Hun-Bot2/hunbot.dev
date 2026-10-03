# Atelier 정리 패스 (2026-10-03)

재디자인이 SaaS/제품 랜딩 쪽으로 너무 매끈하고 컴포넌트화되었다. 방향은 유지하고, **개인 기술 노트/출판물** 느낌(조용함, 콘텐츠 우선, 약간 실용적, 에디토리얼)으로 되돌린다. 재디자인 아님.

원칙: **기능과 개인 정체성의 기준 = 원래 Hun-Bot(`main`)**, 시각 기준 = Figma/Atelier. 원본 동작·에셋은 `git show main:<path>`로 확인해 재사용한다. React 도입 금지, Astro 유지.

## 항목별 지시

1. **로고 아이콘 제거** — `Header.astro`의 워드마크 옆 막대 SVG(Mark)를 뺀다. 푸터/기타 위치의 Mark도 같은 이유로 제거. 워드마크 `Hun—Bot`만 남긴다.
2. **실제 썸네일 복원** — `PostThumb.astro`(홈·글 목록·카테고리)에서 `heroImage`가 있으면 그것을, 없으면 원본과 같이 `/images/blank.png`(기존 기본 이미지)를 `getResponsivePublicImage`로 렌더한다. 생성형 `WritingPreview` 추상 썸네일은 글 목록/홈에서 쓰지 않는다(컴포넌트가 다른 데서 안 쓰이면 삭제). 원본 마크업은 `git show main:src/pages/[lang]/index.astro`(heroImage ?? '/images/blank.png', webp srcset)와 `main:src/components/blog/PostListCard.astro` 참고. 라이브러리의 `ResourceVisual`은 이번 항목 범위 밖이지만, 실제 이미지가 있는 곳에서 추상 대체물로 치환하고 있다면 같은 원칙을 적용한다.
3. **중복 선 줄이기** — 한 경계에는 선 하나. 선이 겹쳐 쌓인 곳(섹션 제목 rule + 첫 행 border-top, 행 border-bottom + 다음 블록 border-top, intro 하단선 + 필터 바 상단선, 푸터 상단선 + 띠 등)과 장식용 rule을 제거한다. 전 페이지(홈, 글 목록, 포스트 헤더/본문/시리즈/Giscus 구분, 연구, 라이브러리, 검색)를 훑어 `border-top/bottom` 이중 지점을 찾는다. 행 목록은 "행 사이 선"만 두고 첫/마지막 행 바깥 선은 제거하는 식으로 통일.
4. **푸터 위 배경 띠 제거 + 푸터 재구성**
   - 홈의 틴트 배경 띠(`--paper-deep` 풀블리드, `.site-footer{margin-top:0}` 핵 포함)를 없애고 푸터 직전까지 일반 페이지 배경(`--paper`)을 유지한다. 푸터 자체도 풀블리드 배경 대신 배경 동일 + 상단 선 하나.
   - 푸터 내용은 **원본 구조 그대로**: (a) Hun-Bot + 사이트 설명(원문 영어 설명을 i18n 키로 유지), (b) Navigation(Home/Blog/Library/Search — 현재 라벨 체계에 맞춰 연구 포함 가능), (c) Connect: GitHub·LinkedIn·Email 아이콘 + `contact@hun-bot.dev`, (d) 하단 `© {year} Hun-Bot` + "Built with Astro & Tailwind CSS". "꼼꼼한 작업을 위한 공개 노트" 같은 브랜딩 문구(`footer.tagline`)는 제거. 스타일만 Atelier 톤(토큰, 모노 라벨 소제목, 큰 세리프 문장 없음).
5. **글 가독성** — 포스트 제목 `clamp`를 줄인다(대략 `clamp(28px, 3.6vw, 44px)`, 행간 1.15). 리드/부제는 제목 열 전체 폭(본문 열이 아니라 헤더 컨테이너 폭)을 쓰고 `max-width`로 억지 줄바꿈하지 않는다. 본문 폭은 한글 기준 쾌적한 측정(약 36–42em, 현재 720px 근처 유지/조정), 본문 17px/1.85 유지. 헤더 상하 패딩 축소.
6. **고정 좌측 TOC 폐기** — `article-canvas`의 200px 좌측 sticky 컬럼을 없애 본문 단일 열(가운데 정렬)로 돌린다. **원본의 이동 가능한 플로팅 컴팩트 TOC**(`main:src/components/TableOfContents.astro`: 우측 `top-48 right-6`의 pill 버튼, 클릭 시 패널, 헤딩 목록, 활성 하이라이트, **마우스 드래그로 위치 이동**, 헤딩 없으면 숨김)를 모든 너비에서 복원하되 외형만 토큰 기반(종이색 배경, 1px rule 테두리, 모노 라벨, 그림자·블러 없음)으로 바꾼다. 2026-10-03의 TOC 크기 스케일(h1 15 / h2 14 / h3 13 / h4+ 12px)과 현재의 활성/스크롤 로직은 유지. 학술 리뷰의 서버 렌더 TOC도 같은 플로팅 방식으로 맞추되, 이미 동작하는 방식이 있으면 최소 변경.
7. **플로팅 지구본 언어 컨트롤 복원** — `main:src/components/FloatingLanguagePicker.astro`의 지구본 버튼(24px 아이콘, 라벨 "언어 선택", 우측 하단 고정, 메뉴에 언어명 + 현재 언어 체크)을 복원한다. 삭제된 `public/images/earth-9-svgrepo-com.svg`는 `git show main:public/images/earth-9-svgrepo-com.svg`로 되살린다(다크 모드에서 보이도록 필요하면 `currentColor` 인라인 SVG로 대체해도 됨). 번역이 있는 언어만 표시하고 현재 `availableLangs` 전달 로직(P1)은 유지. 모바일에서 글 목록 끝을 가리지 않도록 P4의 소형화/여백 처리는 유지. TOC 버튼과 겹치지 않게 배치한다.
8. **헤더에서 KO/JP/EN 제거 → GitHub·LinkedIn 아이콘** — 데스크톱 헤더 오른쪽에서 `LanguagePicker`(KO·JP·EN 텍스트)를 빼고 그 자리에 GitHub, LinkedIn 아이콘 링크(`SOCIAL_LINKS`, `target=_blank rel="noopener noreferrer"`, 아이콘 크기 ~18px, 테두리/원형 버튼 없이 `currentColor`)를 둔다. 언어 선택은 지구본이 전담. 모바일 메뉴에는 언어 전환 항목을 두지 않아도 되지만(지구본 존재), 기존 검색/소셜 항목은 유지. `LanguagePicker.astro`가 더 쓰이지 않으면 삭제하고 `availableLangs` 헤더 prop 전달이 불필요해지면 정리(단 `links:validate`가 깨지지 않게 FloatingLanguagePicker 쪽 전달은 유지).
9. **CTA 반복 줄이기** — `보기 ↗`, `글 읽기 ↗`, `Read the essay ↗`, `전체 보기 ↗` 같은 섹션별 버튼형 링크를 줄인다. 제목/행 전체를 링크로 만들고(이미 그런 곳은 유지), 섹션 우측 링크는 조용한 텍스트 링크 하나(모노 11px, 화살표 없음 또는 `→` 하나)만 남긴다. 홈 featured 글의 "읽기" 줄, 라이브러리/리뷰 섹션의 `view-all` 반복, 블로그 index intro의 링크 묶음 등을 점검. 불필요한 `↗`는 외부 링크(본문 `a.external-link`)에만 쓴다. i18n 키는 삭제하지 말고 쓰지 않게 되면 둔다(validator가 요구하는 키 확인).
10. **기능 보존** — 필터(`blog-filters.js` 동작), 검색, 번역, 시리즈 내비, 메타데이터, 포스트 이미지, ViewCounter/Giscus/Feedback, 덱 등 기존 기능을 어떤 것도 빼지 않는다. 프로토타입에 없다는 이유로 제거 금지.

## 확인된 사실 (원본 비교)
- 원본 썸네일: `post.data.heroImage ?? '/images/blank.png'` + 반응형 webp srcset. `public/images/blank.png` 존재.
- 원본 지구본: `/images/earth-9-svgrepo-com.svg` 24px 버튼, id `floating-lang-toggle`, 메뉴 `floating-lang-menu`, `flp-*` 클래스.
- 원본 TOC: 모든 너비에서 우측 플로팅 pill + 패널 + 드래그 이동. P2가 ≥1100px에서 좌측 고정 컬럼으로 바꾸고 드래그를 제거함.
- 원본 푸터: 설명/Navigation/Connect(GitHub·LinkedIn·Email + 주소)/© + Built with Astro & Tailwind CSS.

## 검증
`npm run content:validate`, `npm test`, `npm run build`, validators ui, homepage, blog:listing, library-page, seo, csp, routes, links, perf:budget, search. 브라우저(`preview_start {name:"blog-dev"}`; localhost `navigate`가 거부되면 `javascript_tool`의 `location.href`): 홈, 글 목록, 포스트(heroImage 있는 글과 없는 글), 연구, 라이브러리, 검색을 라이트/다크 1440·375로. TOC 드래그·열기·활성, 지구본 메뉴 언어 전환(번역 있는 글에서), 헤더 아이콘 링크, 선 이중 여부, 푸터 띠 없음, 가로 스크롤 없음을 확인한다. 문서(`CLAUDE.md` 컴포넌트 표, `docs/ops/ui-conventions.md`)는 바뀐 사실(Mark 제거, 썸네일 규칙, TOC 플로팅, 지구본)에 맞게 갱신한다.
