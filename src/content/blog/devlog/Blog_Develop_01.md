---
title: '블로그 개발일지 01'
description: 'Astro 기반 블로그 구축, 다크 테마, 레이아웃 개선 기록'
pubDate: '2025-10-27'
# heroImage: '../../assets/KOSSDA.png'
tags: ['Devlog', 'Astro', 'Tailwind']
category: 'devlog'
---

## 프로젝트
개인 블로그 제작 · 운영 기록

- 기간: 2025.09 - 현재
- 역할: 블로그 운영자

---

## 배포 링크 / 저장소

- 배포 링크: https://hunbot-dev.vercel.app/
- GitHub: https://github.com/Hun-Bot2/hunbot.dev

---

## 블로그 운영자

- 주요 업무: 콘텐츠 작성, 디자인/레이아웃 개선, 성능 및 접근성 개선, 배포 자동화
- 사용 기술: TypeScript, Astro, Tailwind CSS, MDX

---

## 블로그 구축 (플랫폼 · 도구)

- 프레임워크: Astro v5.x (콘텐츠 중심, Zero-JS 지향, Islands Architecture)
- 스타일: Tailwind CSS + 전역 `global.css` 토큰(색상/폰트/간격)
- 콘텐츠: Markdown/MDX + Astro Content Collections(타입 안전한 Frontmatter 검증)
- 이미지: Sharp 기반 빌드 최적화(WebP/AVIF), 지연 로딩
- SEO: `BaseHead.astro` 메타태그, `sitemap.xml.ts`, `rss.xml.js` 구성

---

## 핵심 작업 요약

1) Header 개선(`src/components/Header.astro`)
- 전체 너비(full-bleed) + 상단 고정(sticky)
- 좌측 타이틀, 우측 아이콘(Theme, GitHub, LinkedIn, Blog, RSS, Search, Menu)
- `index.astro`와 `blog/index.astro`에서 Header를 `.global-wrapper` 바깥으로 이동해 너비 제한 해소

2) Footer 정리(`src/components/Footer.astro`)
- 중복 렌더링 제거, 패딩 축소(`mt-20→mt-12`, `py-16→py-8`)
- 가독성 향상(텍스트 크기 상향, 아이콘 사이즈 조정)

3) 다크 테마 시스템(`src/styles/global.css`)
- 배경: `rgb(40,40,40)` / 본문: `rgb(248,249,250)`로 명확한 대비
- 링크/포커스는 오렌지 계열로 통일, 파란색 계열 제거
- 헤딩들에 `scroll-margin-top: 5rem` 적용해 sticky header와의 충돌 방지

4) 콘텐츠/레이아웃 일관화
- `/`, `/blog`, `/about` 시각적 일관성 확보
- BlogPost/TOC 컴포넌트의 다크 팔레트 정비, 불필요한 블루 액센트 제거

---

## 기술 스택 및 구성

- `package.json`: astro, @astrojs/tailwind, @astrojs/mdx, sharp, @fontsource* 포함
- `tailwind.config.mjs`: `darkMode: 'class'`, 색상/폰트 확장
- 폰트: Inter(영문), Noto Sans/Serif KR(한글), JetBrains Mono(코드)
- 테마 관리:
  - 사이트: `BaseHead.astro` 인라인 스크립트가 `<html class="dark">` 토글 (sessionStorage 사용)
  - 시각화: `public/scripts/themeManager.js`가 3D 비주얼용 색상 팔레트 제공

---

## 성능 · 접근성

- Astro의 Zero-JS 기본값을 유지하고, 필요한 부분만 hydration
- Sharp 기반 이미지 최적화 + lazy loading
- 본문 가독성(폰트/간격/대비) 개선, 키보드 포커스 스타일 정비 예정

---

## 앞으로의 계획

- 색상 잔여 청소 및 `/about` 등 일부 페이지 최종 점검
- 테마 로직 통합 검토(BaseHead 인라인 vs ThemeManager 단일화)
- 빌드/미리보기 스모크 테스트 자동화 추가
- 간이 CMS 도입 검토(Netlify/Decap, Supabase, 또는 Headless CMS)
- 검색/필터 기능, 이미지 업로드 워크플로 개선
- SEO기능 도입

---

## 작업 타임라인(요약)
-  2025-06-24 ~ 2025-10-14 : 블로그 개설 시작, 기존의 Three.js를 버리고 깔끔한 글 형태의 블로그 레이아웃 적용
- 2025-10-27: 다크 테마 색상 토큰 정립, Header/Footer 레이아웃 개선, TOC/BlogPost 다크 스타일 정리, 개발일지 작성

---

작성일: 2025-10-27

