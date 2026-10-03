# Atelier 리디자인 이식 계획 (2026-10-03)

> 원본 디자인: `Redesign Interactive Research Atelier/` (Figma Make에서 export한 React + Vite + Tailwind v4 프로토타입. 저장소 루트에 untracked로 있음 — **커밋 금지**)
> 대상: hun-bot.dev (Astro 5)
> 원칙: **블로그의 기능·데이터·URL은 그대로 두고, 화면만 새로 입힌다.** 프로토타입은 *시각 언어*의 참고 자료이지, 기능 명세가 아니다.

---

## 0. 한 줄 요약

주황색 글래스 UI를 걷어내고 "종이 위의 연구 노트" 톤으로 바꾼다. 따뜻한 미색 배경, 잉크색 글자, 얇은 구분선, 세리프 제목, 작은 모노스페이스 라벨, 붉은 주황 포인트 색 하나. 페이지 구조(글 / 연구 / 라이브러리)와 모든 기능은 그대로 유지한다.

---

## 1. 프로토타입에서 가져올 것 / 가져오지 않을 것

### 가져온다 (시각 언어)

| 요소 | 프로토타입 출처 | 내용 |
|---|---|---|
| 색 토큰 | `src/index.css` `:root`, `:root[data-theme="dark"]` | paper / paper-deep / paper-light / ink / secondary / faint / rule / rule-strong / accent / stage* |
| 타이포그래피 | 같은 파일 | 제목 `Newsreader` + `Noto Serif KR/JP`, 본문 `Noto Sans KR/JP`, 라벨 `IBM Plex Mono` (대문자, 자간 .09em) |
| 헤더 | `Header`, `.site-header` | 72px 높이, 3열 grid(브랜드 · 중앙 텍스트 내비 · 오른쪽 액션), 하단 1px 선, 활성 링크는 accent 색 + 밑줄 애니메이션 |
| 브랜드 마크 | `Mark()` SVG | 막대 5개 + 주황 점 로고, "Hun—Bot" 워드마크 |
| 섹션 머리 | `.column-heading`, `.eyebrow`, `.section-index`, `.subpage-intro` | 세리프 제목 + 오른쪽 모노 링크 + 하단 rule |
| 목록 행 | `.writing-entry`, `.home-post-list`, `.paper-reading-list` | 날짜(모노) · 썸네일 · 제목(세리프) · 설명 · 메타 칩. 행 사이 1px rule, 호버 시 제목이 accent |
| 썸네일 | `WritingPreview`, `ResourceVisual` | heroImage 없는 글/픽에 쓰는 추상 SVG(3~6가지 변형) |
| 상태 칩 | `.paper-state.state-*` | 논문 상태(reviewed / reading / queue 등) 테두리 칩 |
| 아티클 | `ArticleLayout`, `.article-*`, `.prose` | 큰 세리프 제목 헤더, 모노 메타 줄, 왼쪽 sticky 목차, 세리프 blockquote, 종이색 코드 블록 |
| 링크 | `.underlined-link`, `Arrow` | 밑줄 + `↗`, 호버 시 화살표가 살짝 이동 |
| 푸터 | `Footer`, `.site-footer` | 큰 세리프 문장 + 소개 + 세로 내비 + 모노 저작권 줄 |
| 라이브러리 그리드 | `.library-grid-page`, `.knowledge-item` | 4열 카드: 일러스트 영역 + 모노 라벨 + 세리프 제목 + 한 줄 설명 |

### 가져오지 않는다

- **Gallery / Explore / Build / Atlas / Explorable 페이지**: 블로그에 해당 콘텐츠도, 기능도 없다. 새 라우트를 만들지 않는다.
- **프로토타입의 가짜 데이터**(`data.ts`, 하드코딩된 논문 목록 등): 모든 데이터는 기존 Astro 컬렉션과 utils에서 가져온다.
- **해시 라우팅 · React**: Astro 컴포넌트 + 기존 `public/scripts/*.js`를 그대로 쓴다. React 의존성을 추가하지 않는다.
- **Cmd+K 검색 오버레이**: 새 기능이다. 헤더의 Search는 기존 `/{lang}/search/` 페이지로 연결한다.
- **Tailwind v4 마이그레이션**: 블로그는 Tailwind v3(`@astrojs/tailwind`)를 계속 쓴다.
- **프로토타입의 버그와 접근성 문제**:
  - 7~10px 모노 글자: 너무 작다(§3.3 최소 크기 규칙 적용).
  - 1100px 미만에서 내비가 사라지고 대체 수단이 없다 → 블로그의 햄버거 메뉴를 유지한다.
  - `.article-canvas`가 980px 안에 3열을 넣어 본문이 200px 남짓으로 찌그러진다 → §5.2에서 2열로 바로잡는다.

---

## 2. 기능 보존 계약 (절대 깨면 안 되는 것)

아래 항목은 리디자인 전후로 동일해야 한다. 각 phase가 끝날 때마다 확인한다.

1. **라우트·URL**: `CLAUDE.md` Route Architecture 표의 모든 경로, `vercel.json` 리다이렉트, `getBlogUrlFromId()` 등 URL 헬퍼. 새 라우트 추가 금지.
2. **데이터 계층**: `src/utils/*`, `src/content.config.ts`, `src/data/*`는 손대지 않는다(표시용 순수 헬퍼 추가만 허용).
   - 글 목록은 반드시 `getAllPosts()`를 거친다(`getCollection('blog')` 금지).
   - 리뷰는 `getPublishedAcademicReviews()`를 거친다.
3. **i18n**: 모든 UI 문자열은 `src/i18n/ui.ts`에 있어야 한다.
   - 프로토타입의 영어 문구("All writing", "Read the essay", "Selected from the Library" 등)는 ko/jp/en 키로 추가한다.
   - 기존 키를 지우거나 이름을 바꾸지 않는다. validator가 `nav.skip`, `home.feeds.title`, `home.explore.title`, `library.title`, `library.tab.*` 등을 검사한다.
4. **validator가 검사하는 마크업**(`scripts/validate-*.mjs`):
   - `Header.astro`: `class="skip-link"`, `href="#main-content"`, `nav.skip`, `/scripts/header-menu.js` 로드, `#menuToggle`·`#mobileMenu` id.
   - `global.css`: `.skip-link`, `:focus-visible`.
   - 홈: `getUsefulFeedItems`, `getRecentPicks`, `getLatestBriefPosts`, `getLatestBlogPosts`, `getPostsForLanguage`, `data-pagefind-body`, `data-pagefind-filter="language[content]"`, `data-pagefind-filter="section[content]"`.
   - 라이브러리: `getCollection('picks')`, `computePickTier`, pagefind 속성.
   - `BaseHead.astro`: canonical, hreflang, RSS link 등(SEO validator).
   - 마크업을 바꿀 때 **먼저 해당 validator를 읽고** 요구 문자열을 유지한다.
5. **Pagefind**: `data-pagefind-body` / `data-pagefind-ignore` / `data-pagefind-filter` / `data-pagefind-meta` 위치를 그대로 둔다. 헤더·푸터는 계속 ignore.
6. **테마**: 저장 키 `neural-blog-theme`, `prefers-color-scheme` 자동 추종, 토글 버튼 `#themeToggleBtn`, `html.dark` 선적용 스크립트(BaseHead)를 유지한다. 라이트/다크 모두 지원한다.
7. **포스트 기능**: ViewCounter(`/api/views`), Giscus, FeedbackBox(`/api/feedback`), LanguageSuggestion, FloatingLanguagePicker, 시리즈 내비게이션, Breadcrumb, Bio, KaTeX, Shiki 듀얼 테마, PresentationEmbed(덱), 리뷰 MDX 컴포넌트. 여기에 2026-10-03 수정분(CJK 굵게, 외부 링크 `↗`, 목록 간격, 검색 비우기 버튼)도 포함된다.
8. **소셜·피드 링크**: GitHub, LinkedIn, RSS(`/rss.xml`)는 위치가 바뀌어도(§4.3) 사이트 어디에선가 계속 접근 가능해야 한다.
9. **CSP**(`vercel.json`): 폰트는 `fonts.googleapis.com` / `fonts.gstatic.com`(이미 허용됨)만 쓴다. 새 서드파티 도메인을 추가하지 않는다. 인라인 스크립트를 추가하면 `docs/ops/csp.md` 인벤토리를 갱신한다.

---

## 3. 디자인 토큰 & 기반

### 3.1 색 토큰 — `src/styles/tokens.css` (신규)

테마 스크립트는 `html.dark`를 페인트 전에 설정하고, `body.dark-theme`/`body.light-theme`는 `DOMContentLoaded`에서야 붙는다. 따라서 깜빡임을 막으려면 토큰은 **`html.dark` 기준**으로 정의한다.

```css
:root {
  --paper: #f2f0e9;  --paper-deep: #e7e4db;  --paper-light: #f8f6f0;
  --ink: #171916;    --secondary: #5f625c;   --faint: #8e9089;
  --rule: #cbc9c0;   --rule-strong: #93958e;
  --accent: #d84e2b;
  --stage: #171816;  --stage-ink: #eeede5;   --stage-muted: #9f9f98;
  --content-max: 980px;
  --font-serif: "Newsreader", "Noto Serif KR", "Noto Serif JP", serif;
  --font-sans: "Noto Sans KR", "Noto Sans JP", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  color-scheme: light;
}
html.dark {
  --paper: #191a18;  --paper-deep: #22231f;  --paper-light: #1e1f1c;
  --ink: #eeede5;    --secondary: #aaa9a1;   --faint: #777871;
  --rule: #3f403b;   --rule-strong: #65665f;
  --accent: #ee6841;
  --stage: #10110f;  --stage-ink: #f2f0e9;   --stage-muted: #9f9f98;
  color-scheme: dark;
}
```

- **대비 확인 필수**:
  - `--faint`는 라이트 배경에서 대비가 약 3:1이다. 본문이나 중요한 메타에는 쓰지 말고 장식·보조 라벨에만 쓴다.
  - 11px 이상 모노 라벨 중 정보가 담긴 것은 `--secondary`를 쓴다.
- `--lang-serif` 순서는 언어별로 조정한다. `:lang(jp)`에서는 Noto Serif JP를 KR보다 앞에 둔다. 단, 블로그는 `jp`라는 비표준 코드를 쓰므로 실제 `lang` 속성 값을 확인한다.

### 3.2 Tailwind 연결

`tailwind.config.mjs` `theme.extend`에 다음을 추가한다.

```js
colors: { paper: 'var(--paper)', 'paper-deep': 'var(--paper-deep)', 'paper-light': 'var(--paper-light)',
          ink: 'var(--ink)', secondary: 'var(--secondary)', faint: 'var(--faint)',
          rule: 'var(--rule)', 'rule-strong': 'var(--rule-strong)', accent: { DEFAULT: 'var(--accent)' } },
fontFamily: { serif: ['var(--font-serif)'], sans: ['var(--font-sans)'], mono: ['var(--font-mono)'] },
```

- 기존 `accent.dark/light`, `neural.*`, `gradient-*` 애니메이션은 쓰는 곳이 없어진 뒤 마지막 phase에서 지운다.
- 템플릿의 `text-slate-*`, `bg-slate-*`, `border-slate-*`, `orange-*`, `dark:` 변형은 토큰 유틸(`text-ink`, `text-secondary`, `border-rule`, `bg-paper-deep`, `text-accent` …)로 바꾼다.
  - 토큰이 테마를 따라가므로 `dark:` 접두사가 필요 없어진다.
  - `global.css`의 `body.light-theme .border-slate-700 {…}` 같은 덮어쓰기 핵도 모두 지울 수 있게 된다. **이것이 이 리디자인의 핵심 정리 효과다.**

### 3.3 타이포그래피 규칙

| 역할 | 글꼴 | 크기 / 행간 | 비고 |
|---|---|---|---|
| 페이지 제목(h1) | serif 400 | `clamp(40px, 5.5vw, 80px)` / .95, 자간 -.04em | 아티클 헤더 |
| 섹션 제목 | serif 400 | 28px | `.column-heading h2` |
| 목록 제목 | serif 400 | 20–23px / 1.2 | 글 목록, 카드 |
| 본문(prose) | sans 400 | 17px / 1.85 (ko·jp), 18px / 1.8 (en) | 한글은 세리프 본문이 너무 무거우므로 sans를 쓴다 |
| 리드 문단 | serif | 22px / 1.55 | 포스트 description |
| 라벨·메타(eyebrow) | mono 400, uppercase, .09em | **최소 11px** | 프로토타입의 7–10px은 쓰지 않는다 |
| 보조 설명 | sans | **최소 13px** | 목록 설명 등 |

폰트 로딩은 `BaseHead.astro`의 `fontCssConfig`를 교체한다. 언어별로 필요한 것만 불러온다.
- **ko**: Newsreader(opsz,wght 400;500) + IBM Plex Mono(400;500) + Noto Serif KR(400;500) + Noto Sans KR(400;500;600)
- **jp**: Newsreader + IBM Plex Mono + Noto Serif JP + Noto Sans JP
- **en**: Newsreader + IBM Plex Mono + Noto Sans(400;500;600)

기존 Gowun Dodum / Montserrat / M PLUS 1p는 제거한다. `global.css`의 `h1:lang(ko)` 등 폰트 규칙도 함께 정리한다. `@fontsource/noto-sans-*` 의존성이 실제로 import되는 곳이 없다면 이번에는 그대로 둔다(의존성 정리는 범위 밖).

### 3.4 기본 요소 (`global.css` 재작성)

- `body`: `background: var(--paper); color: var(--ink); font-family: var(--font-sans)`.
- `a`: `color: inherit`. 본문 링크 스타일은 기존 `.prose a` 점선 밑줄 규칙을 유지하되 색을 토큰으로 바꾼다.
- `button`: 전역 버튼 스타일(패딩·테두리·배경)을 **없앤다.** 2026-10-03의 검색 비우기 버튼 버그 원인이었다. 버튼 모양이 필요한 곳은 `.btn-text`(모노 라벨 + 밑줄), `.btn-pill`(rule 테두리 칩) 클래스로 명시한다.
- `:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px }`. validator가 요구하므로 유지한다.
- `.skip-link`: 유지하고 토큰 색으로 바꾼다.
- `::selection { background: color-mix(in srgb, var(--accent) 25%, transparent) }`.
- 레이아웃 래퍼 `.page-frame { width: min(calc(100% - 32px), var(--content-max)); margin-inline: auto }`. 모바일 좌우 16px, 640px 이상에서는 `calc(100% - 64px)`.
- 공용 컴포넌트 클래스: `.eyebrow`, `.section-index`, `.column-heading`, `.subpage-intro`, `.underlined-link`, `.rule-list`(행 사이 1px rule), `.chip`, `.state-chip--{reviewed,reading,queue,recommended}`.

---

## 4. 전역 크롬

### 4.1 Header (`src/components/Header.astro`)

```
[Mark Hun—Bot]          글   연구   라이브러리          SEARCH  DARK  KO·JP·EN  [≡ <1100px]
```

- 3열 grid, 72px 높이. 배경은 `color-mix(in srgb, var(--paper) 95%, transparent)`, 하단 1px `--rule`.
  - sticky 여부: 현재 동작을 따른다.
- **중앙 내비** `nav.blog` / `nav.research` / `nav.library`. 텍스트 13–14px.
  - 활성 상태는 accent 색 + `::after` 밑줄을 쓴다(현재 페이지 판별 로직은 그대로).
- **오른쪽 액션**: 모노 11px 대문자.
  - Search: 돋보기 + `nav.search` → `/{lang}/search/`.
  - 테마 토글: 텍스트 버튼. 라벨은 다음 테마 이름이고, i18n 키를 추가한다. `id="themeToggleBtn"`은 유지한다.
  - 언어 전환: 기존 `LanguagePicker`의 로직(번역본이 있으면 해당 글로 이동)을 그대로 쓰고, `KO / JP / EN` 텍스트 링크로 표시한다. 현재 언어는 ink, 나머지는 faint.
- **1100px 미만**: 중앙 내비를 숨기고 햄버거(`#menuToggle`)를 표시한다. `#mobileMenu`는 헤더 아래로 펼쳐지는 종이색 패널이다.
  - 패널 내용: 내비 3개 + 검색 + 언어 + 테마 + GitHub/LinkedIn/RSS.
  - `header-menu.js`는 수정하지 않는다.
  - 2026-10-03 수정(데스크톱에서 햄버거 숨김)의 기준점은 768px에서 1100px로 옮긴다.
- 기존 원형 아이콘 버튼들(GitHub/LinkedIn/RSS/검색/테마/햄버거)의 글래스 스타일은 제거한다.

### 4.2 FloatingLanguagePicker / LanguageSuggestion

기능은 유지하고 스타일만 바꾼다. 원형 플로팅 버튼 대신 우하단의 작은 종이색 칩(rule 테두리 + 모노 라벨)으로 표시한다. 헤더 언어 전환과 겹치더라도 이번 범위에서는 제거하지 않는다.

### 4.3 Footer (`src/components/Footer.astro`)

프로토타입 `.site-footer` 구조를 따른다.
- 1열: Mark + 세리프 문장(새 i18n 키 `footer.tagline`. ko 예: "꼼꼼한 작업을 위한 공개 노트").
- 2열: 사이트 소개(기존 문구 재사용) + 연락처 링크(현재 푸터에 있는 것만).
- 3열: 세로 내비(글 / 연구 / 라이브러리 / 검색 / RSS / GitHub / LinkedIn) + "맨 위로 ↑".
- 하단 모노 줄: `© 2026 Hun—Bot`.
- 배경은 `color-mix(in srgb, var(--paper) 92%, var(--ink))`. `data-pagefind-ignore`는 유지한다.

---

## 5. 페이지별 적용

### 5.1 홈 (`src/pages/[lang]/index.astro`)

데이터 호출(validator가 검사하는 함수들)은 그대로 둔다. 레이아웃만 다음과 같이 바꾼다.

```
┌ page-frame ─────────────────────────────────────────────┐
│ 글 (Writing)                    전체 보기 ↗ │ 연구        리뷰 ↗ │
│ ───────────────────────────────────────── │ ─────────────────── │
│ [썸네일] 최신 글(featured)                 │ [상태칩] 리뷰 제목   │
│          eyebrow · 제목(세리프 큰) · 설명   │ 저자 · 연도        │
│ ─ 날짜 [썸] 제목 ──────────────── ↗       │ ...               │
│ ─ 날짜 [썸] 제목 ──────────────── ↗       │                   │
├─────────────────────────────────────────────────────────┤
│ (paper-deep 띠) Library에서 고른 것         라이브러리 보기 ↗ │
│ [art] [art] [art]   ← getRecentPicks                    │
│ Useful Feeds 목록 (rule-list)                           │
└─────────────────────────────────────────────────────────┘
```

- **왼쪽 열** = 최신 글. featured 1개 + 목록. 지금 홈이 보여주는 개수를 유지한다. `getLatestBriefPosts`/`getLatestBlogPosts`가 각각 무엇을 채우는지 확인해서 매핑한다.
- **오른쪽 열** = 지금 홈의 "논문 리뷰" 섹션 데이터.
  - 비었을 때의 처리(현재 "아직 공개된 논문 리뷰가 없습니다." 문구)도 유지한다. 빈 상태는 rule로 둘러싼 한 줄 문장으로 표시한다.
- **하단 띠**: 최근 픽 카드 + Useful Feeds. 비어 있는 섹션은 지금처럼 빈 상태 문구로 처리한다.
- 지금 홈에 있는 다른 섹션(`home.explore.*` 등)도 **모두 남긴다.** 위 구조 안에 같은 행 스타일로 배치한다.
- 썸네일 규칙(§6)을 따른다.
- 900px 미만에서는 두 열을 세로로 쌓는다.

### 5.2 포스트 상세 (`src/layouts/BlogPost.astro`, `[...slug].astro`)

```
article-header (page-frame)
  eyebrow: 카테고리 · 시리즈 · 읽는 시간
  h1 제목 (세리프, 큰)
  리드: description (세리프 22px, secondary)
  meta(mono): 발행일 · 수정일 · 조회수(ViewCounter) · 번역 링크
  태그 칩
────────────────────────────────────────── rule
article-canvas: [목차 200px sticky] [prose ≤ 720px]
series 내비 / Bio / FeedbackBox / Giscus  (prose 열 폭에 맞춰)
```

- **2열만 쓴다.** 프로토타입의 오른쪽 notes 열은 넣지 않는다. 메타는 헤더로 올린다.
  - 컨테이너: `max-width: 1080px; grid-template-columns: 200px minmax(0, 720px); gap: 64px`.
- **목차**: `TableOfContents.astro`의 헤딩 수집 로직(헤딩 id 생성 포함)은 재사용하고, 표시만 바꾼다.
  - ≥1100px: 왼쪽 sticky 목록. 모노 라벨 "목차" + 13px 항목. 들여쓰기는 h2 0, h3 12px, h4+ 20px. 현재 섹션은 accent.
    - 현재 섹션 하이라이트는 기존 active 로직이 있으면 재사용한다. 없으면 IntersectionObserver 한 개로 추가해도 된다.
  - <1100px: 기존 플로팅 토글 버튼 + 패널을 종이색 스타일로 유지한다.
  - 드래그 기능은 위치 저장을 이미 꺼둔 상태이므로 제거해도 된다. 다만 단순화는 이 파일 안에서만 한다.
- **prose**: `BlogPost.astro`의 긴 `proseClass` 임의 유틸 문자열을 `src/styles/prose.css`의 `.prose` 규칙으로 옮긴다(가독성과 유지보수 목적).
  - `h2`: 세리프 30–34px, 위 64px / 아래 16px.
  - `h3`: 세리프 23px. `h4`: sans 600 18px.
  - `p`: 아래 1.25em. **문단 바로 뒤 목록 간격 규칙(2026-10-03)은 그대로 이식한다.**
  - `blockquote`: 왼쪽 2px accent, 세리프 21px, 이탤릭 없음. 한글 이탤릭은 어색하다.
  - `pre`: `--paper-deep` 배경, 위 1px `--rule-strong`. Shiki 듀얼 테마 변수는 유지하되 배경만 토큰으로 바꾼다.
  - 인라인 `code`: mono 0.88em, `--paper-deep` 배경.
  - 표: 1px rule, 헤더는 모노 라벨.
  - 이미지: 라운드·그림자 없이 `figure`/`figcaption`(모노 11px)으로 표시.
  - 링크: 점선 밑줄 + 외부 링크 `↗`(2026-10-03 규칙). 색만 토큰으로 바꾼다.
  - KaTeX display는 가운데 정렬을 유지한다.
- **Breadcrumb**: 헤더 eyebrow 위의 모노 11px 경로로 표시한다.
- **시리즈 내비, Bio, FeedbackBox, GiscusComments**: rule로 구분한 블록으로 바꾼다. 카드·그림자를 쓰지 않는다.
  - Giscus 테마는 지금처럼 사이트 테마를 따라간다. 테마 매핑 코드는 건드리지 않는다.

### 5.3 학술 리뷰 (`AcademicReviewPost.astro`, `src/styles/academic-review.css`, `components/reviews/*`)

5.2와 같은 아티클 골격을 쓴다. 리뷰 컴포넌트는 다음처럼 매핑한다.
- `KeyTakeaways` / `ResultHighlight`: `--paper-deep` 박스 + 모노 라벨 + 위 2px accent.
- `LimitationBlock`: 같은 박스, 위 2px `--rule-strong`.
- `MyCommentary`: 왼쪽 2px accent, 세리프.
- `EquationNote`: 표 형태, 모노 라벨.
- `ReferenceList`: 번호 붙은 rule-list, 모노 번호.

`academic-review.css`의 하드코딩 색은 전부 토큰으로 바꾼다.

### 5.4 글 목록 (`blog/index.astro`, `blog/page/[page].astro`, `blog/categories*.astro`, `components/blog/*`, `BlogCard.astro`)

- `.subpage-intro`(eyebrow "글 · N편 · RSS" + 한 줄 설명) → `BlogFilterBar` → 연도 구분선(`.year-separator`: 세리프 연도 + 모노 개수) → `.writing-entry` 행.
- **writing-entry 행**: `날짜(mono) | 썸네일 126×84 | 제목(serif 20px) / 설명(13px) / 메타(카테고리 · 태그 2개)`. 호버하면 제목이 accent로 바뀐다.
  - <640px: 썸네일을 숨기고 날짜를 제목 위로 올린다.
- **BlogFilterBar**: `blog-filters.js` 동작(URL 파라미터, localStorage)은 그대로 둔다. 시각만 바꾼다. 모노 라벨 + 밑줄 탭, 활성은 accent.
- **PaginationNav**: 모노 "← 이전 / 01 / 다음 →".
- **CategoryBadge**: 테두리 칩으로 바꾼다. 4버킷 색 구분은 accent 하나 + 중립 칩으로 단순화해도 된다.
- **카테고리 페이지**: 같은 행 컴포넌트를 재사용한다.

### 5.5 연구 (`research.astro`, `research/topics/[topic].astro`, `research/decks.astro`, `paths.astro`, `paths/[path].astro`)

- 허브는 `.subpage-intro` + 섹션별 `.column-heading`으로 구성한다. 빈 섹션은 지금처럼 렌더하지 않는다.
- **스터디 로그와 논문 목록**은 프로토타입 `.paper-reading-list` 행을 쓴다.
  - 1줄: 제목(serif) + 오른쪽 상태 칩 · "리뷰" 링크 · "원문 ↗".
  - 2줄: 저자 · 연도 · venue(mono) + 토픽 칩.
  - 상태 칩 매핑: `studiedAt` 있음 → "studied", 리뷰 있음 → "reviewed", 선택했지만 아직 안 읽음 → "queue".
  - 표시 문자열은 i18n 키를 쓰고, 저장 id를 그대로 출력하지 않는다. venue·acceptance 등은 `getVenueDisplayName()` 같은 기존 display 헬퍼만 쓴다.
- 토픽 페이지, 러닝 패스, 덱 페이지도 같은 행·칩 패턴을 쓴다.
- 덱 임베드(`PresentationEmbed` 계열)는 프레임 테두리만 rule로 바꾼다.
- `LibraryPageStyles.astro`를 연구 페이지가 재사용하고 있으므로, 이 파일을 토큰 기반으로 바꾸면 연구 페이지에도 함께 적용된다.

### 5.6 라이브러리 (`library.astro`, `library/[section].astro`, `library/useful-feeds.astro`, `components/library/*`)

- `.subpage-intro`(eyebrow + 설명) + `LibraryTabs`(외부 링크 / Useful Feeds). 탭은 모노 밑줄 탭으로 바꾼다.
  - "research-os" 라벨은 계속 링크가 아닌 일반 텍스트로 둔다.
- **PickCard**를 `.knowledge-item`으로 바꾼다.
  - 일러스트 영역(§6) → 모노 라벨(kind · section) → 세리프 제목 → 노트 한 줄 → 메타 줄(tier · ★stars · 신선도 배지).
  - tier/stars/freshness 계산은 `picks.ts` 그대로 쓰고, 배지 표시만 칩으로 바꾼다.
- 그리드: ≥1100px 4열, ≥640px 2열, 그 미만 1열.
- **Useful Feeds**: rule-list 행(제목 · 출처 mono · 날짜).
- `LibraryIcon`은 섹션 아이콘이다. 선 굵기 1.35의 단색(`currentColor`) 스타일로 통일한다.

### 5.7 검색 (`search.astro`)

- `.subpage-intro` 아래에 필터 버튼(모노 밑줄 탭)과 Pagefind UI를 둔다.
- Pagefind CSS 변수를 토큰에 연결한다.
  - `--pagefind-ui-primary: var(--accent)`, `--pagefind-ui-text: var(--ink)`, `--pagefind-ui-background: var(--paper)`, `--pagefind-ui-border: var(--rule-strong)`, `--pagefind-ui-border-radius: 0`, `--pagefind-ui-font: var(--font-sans)`.
  - 입력창은 프로토타입 `.search-field`처럼 하단 1px ink 선만 남기고, 세리프 24px로 표시한다.
- 비우기 버튼 리셋 규칙(2026-10-03)을 유지한다. §3.4에서 전역 button 스타일을 없애면 더 단순해진다.
- 결과 행: 제목 세리프 19px + 발췌 13px + 하위 결과 들여쓰기, 행 사이 rule.

---

## 6. 썸네일 / 일러스트 규칙

- **글**: `heroImage`가 있으면 기존 `getResponsivePublicImage()`로 렌더한다(`object-fit: cover`, 라운드 없음).
  - 없으면 `WritingPreview` SVG 3종 중 하나를 쓴다. 변형은 **포스트 id 해시로 결정**하고, 인덱스 기반은 쓰지 않는다. 그래야 페이지마다 같은 글이 같은 그림을 갖는다.
  - 새 컴포넌트 `src/components/art/WritingPreview.astro`에 둔다. `aria-hidden="true"`.
- **픽 / 피드**: `ResourceVisual` 6종(plot, archive, mechanism, bars, blocks, sphere)을 `src/components/art/ResourceVisual.astro`로 옮긴다.
  - 변형은 `kind` → 기본 변형으로 매핑하고, 같은 kind 안에서는 slug 해시로 고른다.
  - 프로토타입 CSS 중 해당 시각 요소(`.archive-visual`, `.mechanism-visual`, `.bar-visual`, `.block-visual`, `.sphere-visual`, `.resource-art`)만 `src/styles/art.css`로 가져온다.
- 순수 장식이므로 JS를 쓰지 않는다.
- `prefers-reduced-motion`을 존중한다. 애니메이션은 넣지 않는 것을 기본으로 한다.

---

## 7. 반응형 & 접근성 기준

- 브레이크포인트: **540 / 800 / 1100px**(프로토타입과 동일).
- 모바일 좌우 여백 16px, 가로 스크롤 금지(375px에서 확인).
- 대비: 본문과 정보성 텍스트는 4.5:1 이상. 라이트·다크 모두 `--secondary` 기준으로 확인한다.
- 터치 타깃 ≥ 40px(헤더 액션, 탭, 페이지네이션).
- 포커스: 모든 인터랙티브 요소에 `:focus-visible` accent 아웃라인.
- `prefers-reduced-motion: reduce`이면 밑줄·화살표 트랜지션을 끈다.

---

## 8. 구현 단계 (sub-agent 단위)

각 phase는 **하나의 sub-agent**가 수행하고, 끝나면 내가 diff와 스크린샷을 리뷰한 뒤 다음 phase로 넘어간다.
- 브랜치는 `feat/atelier-redesign`(`fix/post-rendering-ui`에서 분기)을 쓰고, phase마다 커밋한다. push하지 않는다.
- 각 phase 공통 완료 조건: §9 체크리스트.

| Phase | 범위 | 주요 파일 |
|---|---|---|
| **P1 기반 + 크롬** | 토큰, Tailwind 연결, 폰트, global.css 재작성(전역 button 제거 포함), Header, 모바일 메뉴, Footer, FloatingLanguagePicker/LanguageSuggestion 스타일, skip-link | `tokens.css`, `global.css`, `tailwind.config.mjs`, `BaseHead.astro`, `Header.astro`, `Footer.astro`, `LanguagePicker.astro`, `FloatingLanguagePicker.astro`, `LanguageSuggestion.astro`, `ui.ts` |
| **P2 읽기 화면** | 포스트 레이아웃, prose.css, 목차, Breadcrumb/PostMeta/TagList/시리즈/Bio/Feedback/Giscus 래퍼, 학술 리뷰 레이아웃과 컴포넌트 | `BlogPost.astro`, `prose.css`, `TableOfContents.astro`, `AcademicReviewPost.astro`, `academic-review.css`, `components/reviews/*`, 관련 소형 컴포넌트 |
| **P3 목록 + 홈** | 썸네일 아트 컴포넌트, 홈, 글 목록/페이지네이션/카테고리, 필터 바 | `art/*`, `art.css`, `index.astro`, `blog/*`, `components/blog/*`, `BlogCard.astro`, `CategoryBadge.astro` |
| **P4 연구 + 라이브러리 + 검색** | 연구 허브/토픽/패스/덱, 라이브러리 3페이지, PickCard, LibraryTabs, LibraryPageStyles, 검색 | `research*.astro`, `paths*.astro`, `library*.astro`, `components/library/*`, `components/decks/*`(테두리만), `search.astro` |
| **P5 정리** | 안 쓰는 CSS·Tailwind 설정·`body.light-theme` 핵 제거, `controls.css` 등 잔여 파일 점검, 문서 갱신(`CLAUDE.md` 컴포넌트/스타일 표, `docs/ops/ui-conventions.md`, `docs/ops/csp.md`) | 전역 |

P1을 먼저 해야 이후 phase가 토큰을 쓸 수 있다. P2–P4는 `global.css` 충돌을 피하기 위해 **순차로** 진행한다.

---

## 9. Phase 완료 체크리스트

1. `npm run content:validate`, `npm test`, `npm run build` 모두 통과.
2. 추가 validator 통과: `ui:validate`, `homepage:validate`, `library-page:validate`, `seo:validate`, `csp:validate`, `routes:validate`, `links:validate`, `perf:budget`, `search:validate`.
3. 브라우저 확인(`preview_start {name:"blog-dev"}`):
   - 해당 phase 페이지를 데스크톱 1440 / 태블릿 768 / 모바일 375, **라이트·다크 각각** 스크린샷으로 남긴다.
   - 테마 토글은 헤더 버튼으로 바꾸고, 새로고침 후에도 유지되는지와 깜빡임이 없는지 확인한다.
4. 기능 스모크(해당 phase 범위):
   - P1: 내비 활성 상태, 모바일 메뉴 열기/닫기, 언어 전환, 테마 토글.
   - P2: 목차 이동과 활성 표시, 조회수 표시, Giscus 로드, 피드백 전송 UI, 시리즈 이동, KaTeX와 코드 블록 렌더, 외부 링크 `↗`, CJK 굵게.
   - P3: 필터(카테고리·연도·시리즈)와 URL 파라미터 동작, 페이지네이션.
   - P4: 라이브러리 탭, 픽 tier/stars 표시, 검색 결과·필터·비우기(빌드 결과물로 확인).
5. `git status`에 사용자 작업 파일(`HRD01/02.mdx`, `old.mdx`, `ㅇㅂㅈ.md`, `pul.mdx` 삭제, `Redesign Interactive Research Atelier/`)이 **스테이징되지 않았는지** 확인. 이 파일들은 `git add`하지 않는다.
6. 원본 비교 참고: 프로토타입은 `.claude/launch.json`의 `atelier-proto` 항목으로 띄울 수 있다(`preview_start {name:"atelier-proto"}`, 포트 5179, 해시 라우트 `#/journal`, `#/library`, `#/research`, `#/article/race-condition`).

---

## 10. 결정 기록 (사용자가 바꿀 수 있는 기본값)

| 결정 | 기본값 | 이유 |
|---|---|---|
| Gallery/Explore/Atlas | 이식하지 않음 | 콘텐츠·기능이 없다. 빈 페이지를 만들지 않는다 |
| 내비 라벨 | 기존 i18n(모든 글 / 연구 / 라이브러리) | 기능 보존. "Writing/Papers"로 바꾸려면 `ui.ts` 값만 수정하면 된다 |
| 소셜 아이콘 위치 | 헤더 → 푸터 + 모바일 메뉴 | 프로토타입 헤더는 텍스트 액션만 쓴다. 링크 자체는 유지된다 |
| 본문 글꼴 | sans(Noto Sans KR/JP) | 한글 장문은 세리프가 무겁다. 제목만 세리프 |
| 아티클 오른쪽 notes 열 | 넣지 않음 | 980px 안에 3열은 본문을 망가뜨린다(프로토타입 버그). 메타는 헤더로 |
| 기본 테마 | 기존과 동일(저장값 > OS 설정) | 기능 보존 |
| 검색 | 기존 페이지 유지, 오버레이 없음 | 새 기능은 범위 밖 |
