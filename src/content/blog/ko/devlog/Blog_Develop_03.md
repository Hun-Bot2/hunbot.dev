---
title: '블로그 개발일지 03'
description: '도메인 업데이트 & 블로그 글이 없을 때 나타나는 404에러 수정'
pubDate: '2025-11-15'
heroImage: '/images/giscus.png'
tags: ['Devlog', 'Bug Fix']
category: 'devlog'
---

## 현재 발견된 경로 문제
블로그 글을 들어가서, 해당 글에서 번역을 누르려고 하면 404페이지가 나타난다. 이는 내가 해당 글을 다른 언어로 번역해둔 md파일이 없기에 발생하는 문제점이였고, 이를 수정하기 위해 아래와 같은 구조로 리팩토링했다.

### 해결: 언어 선택기에서 없는 언어 숨기기
- `getStaticPaths`에서 같은 slug의 다른 언어 버전이 있는지 `Map`으로 모은 후, 각 포스트에 `availableLangs`라는 배열을 props로 넘기도록 변경했다.
- `BlogPost` 레이아웃이 이 배열을 받아 `FloatingLanguagePicker`에 전달하고, Picker는 실제로 존재하는 언어만 필터링해 보여주도록 로직을 수정했다.

## hun-bot.dev Cloudflare DNS 구입
- 그동안은 `.vercel.app`로 서비스했는데, Cloudflare Registrar로 `hun-bot.dev`를 새로 구입하고 DNS 설정을 했다.
- `astro.config.mjs`의 `site`, `src/consts.ts`의 `SITE_URL`, `robots.txt` 등 모든 정적 링크를 `https://hun-bot.dev` 기준으로 다시 잡아서 빌드 산출물이 도메인으로 가도록 설정했다.

## SEO & Discovery 정비

오늘 도메인 바꾼 김에 전체 SEO 파이프라인도 정리했다.

1. **BaseHead 리팩토링**
   - `hreflang` 세트, canonical, Open Graph locale, JSON feed 링크, Search Console 검증 메타 태그를 한 번에 계산하도록 로직을 손봤다.
   - 언어별 국가 코드도 `SupportedLanguage` 타입과 매핑 테이블로 통합해서 `ko/jp/en`이 각각 `ko-KR`, `ja-JP`, `en-US`를 안정적으로 출력한다.

2. **Sitemap/Robots 재작성**
   - `public/robots.txt`에 `sitemap.xml`과 `sitemap-index.xml` 두 개를 모두 넣었고 `Host` 헤더도 새 도메인으로 명시했다.
   - 빌드 시 생성되는 `dist/sitemap-0.xml`이 새 URL로 채워지는 것까지 확인.


## Giscus 댓글 추가
- `src/components/GiscusComments.astro`를 만들어 `BlogPost` 레이아웃 하단에 붙였다. `.env`에 Giscus 환경 변수만 채우면 GitHub Discussions 스레드가 자동으로 생긴다.
- 환경 변수(`PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY_ID` 등)가 비어 있으면 “댓글 비활성화” 안내 박스만 출력되도록 하는 로직을 넣었음.
