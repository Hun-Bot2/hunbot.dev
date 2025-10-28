---
title: '블로그 개발일지 02'
description: '다국어(i18n) 지원 구현 및 이미지 경로 최적화 기록'
pubDate: '2025-10-28'
# heroImage: '/images/blog-placeholder-2.jpg'
tags: ['Devlog', 'Astro', 'i18n', 'Refactoring']
category: 'devlog'
---

## 프로젝트
개인 블로그 다국어 지원 및 이미지 시스템 개선

- 기간: 2025-10-28
- 역할: 블로그 개발자

---

## 주요 업무

- Astro i18n 설정 및 다국어 라우팅 구현
- 블로그 콘텐츠 언어별 구조화
- 이미지 경로 시스템 개선 (src/assets → public/images)
- 타입 안전성 개선 및 코드 단순화

---

## 핵심 작업 요약

### 1. Astro i18n 설정 (`astro.config.mjs`)

```javascript
i18n: {
  defaultLocale: 'ko',
  locales: ['ko', 'jp', 'en'],
  routing: {
    prefixDefaultLocale: false
  }
}
```

- **한국어**: `/` (기본 언어, prefix 없음)
- **일본어**: `/jp/`
- **영어**: `/en/`

### 2. 번역 시스템 구축 (`src/i18n/ui.ts`)

- 3개 언어(ko, jp, en)에 대한 번역 딕셔너리 생성
- `useTranslations()` 헬퍼 함수로 타입 안전한 번역 접근
- 네비게이션, 블로그, About 페이지 등 UI 텍스트 완전 번역

**주요 번역 키**:
- `nav`: home, blog, about
- `blog`: all-posts, read-more, no-posts, tags, category
- `about`: title, greeting, intro, background, interests, skills, contact

### 3. LanguagePicker 컴포넌트 (`src/components/LanguagePicker.astro`)

- 드롭다운 형식의 언어 선택기
- 현재 언어 상태 표시 (🌐 아이콘 + 언어명)
- 언어 변경 시 동일 경로 유지 (예: `/blog` → `/jp/blog`)

### 4. 언어별 페이지 라우팅 (`src/pages/[lang]/`)

새로운 페이지 구조:
```
src/pages/
  ├── index.astro (/ → /ko/ 리다이렉트)
  ├── about.astro (/about → /ko/about 리다이렉트)
  └── [lang]/
      ├── index.astro (언어별 홈)
      ├── about.astro (언어별 소개)
      └── blog/
          ├── index.astro (언어별 블로그 목록)
          └── [...slug].astro (언어별 개별 포스트)
```

**주요 로직**:
- `getStaticPaths()`로 ko, jp, en 경로 생성
- `post.id.startsWith(\`${lang}/\`)`로 언어별 포스트 필터링
- 각 페이지에서 `useTranslations(lang)` 사용

### 5. 블로그 콘텐츠 구조 재편

기존:
```
src/content/blog/
  ├── devlog/
  ├── review/
  └── contemplation/
```

변경 후:
```
src/content/blog/
  ├── ko/
  │   ├── devlog/
  │   ├── review/
  │   └── contemplation/
  ├── jp/
  │   └── sample.md
  └── en/
      └── sample.md
```

### 6. 이미지 시스템 개선

**문제점**:
- `src/assets/`의 이미지를 content collection에서 상대 경로로 참조 시 오류
- `image()` 헬퍼와 public 폴더 경로 간 타입 충돌
- 복잡한 이미지 타입 체크 로직

**해결 방법**:
1. 모든 이미지를 `public/images/`로 이동
2. `content.config.ts`에서 `image()` 헬퍼 제거, `z.string().optional()`로 단순화
3. `BaseHead.astro`와 `BlogPost.astro`에서 Image 컴포넌트 제거
4. 표준 `<img>` 태그로 통일

**변경 파일**:
- `src/content.config.ts`: heroImage 스키마 단순화
- `src/components/BaseHead.astro`: ImageMetadata 제거, string URL로 변경
- `src/layouts/BlogPost.astro`: Image import 제거, 조건부 렌더링 제거
- `src/pages/[lang]/about.astro`: 이미지 import 제거, 직접 URL 사용

**이미지 경로 형식**:
```markdown
# 올바른 경로
heroImage: '/images/KOSSDA.png'

# 잘못된 경로
heroImage: 'images/KOSSDA.png'  # 슬래시 누락
heroImage: '../../assets/KOSSDA.png'  # 존재하지 않는 경로
```

### 7. 레거시 코드 정리

- `/blog` 폴더 완전 삭제
- 중복 블로그 포스트 제거
- 사용하지 않는 이미지 import 제거

---

## 기술 스택 변경사항

### 추가된 설정
- `astro.config.mjs`: i18n 설정
- `src/i18n/ui.ts`: 번역 시스템

### 수정된 컴포넌트
- `Header.astro`: LanguagePicker 통합
- `BaseHead.astro`: 이미지 타입 간소화
- `BlogPost.astro`: 이미지 처리 로직 단순화

### 삭제된 의존성
- `astro:assets` Image 컴포넌트 (블로그 포스트에서)
- ImageMetadata 타입 체크

---

## 문제 해결 과정

### Issue 1: Content Collection 이미지 경로 오류
**증상**: `ImageNotFound: Could not find requested image`

**원인**: Content collection의 `image()` 헬퍼가 중첩된 폴더 구조에서 상대 경로를 올바르게 해석하지 못함

**해결**: 
- src/assets 사용 포기
- public/images로 이미지 이동
- heroImage를 문자열 타입으로 변경

### Issue 2: BaseHead 이미지 타입 충돌
**증상**: `Property 'src' does not exist on type 'string'`

**원인**: BaseHead가 ImageMetadata를 기대했지만 문자열 URL을 받음

**해결**:
- image prop 타입을 `string`으로 변경
- `image.src` → `image`로 수정
- fallback을 `/images/blog-placeholder-1.jpg`로 설정

### Issue 3: About 페이지 빌드 실패
**증상**: `Rollup failed to resolve import "/images/my_photo.png"`

**원인**: Public 폴더의 이미지를 import 시도

**해결**:
- import 문 제거
- 직접 URL 문자열 사용: `src="/images/my_photo.jpeg"`
- 파일 확장자 수정 (.png → .jpeg)

---

## 성과 및 개선점

### ✅ 성과
- 완전한 3개 언어 지원 (한국어, 일본어, 영어)
- 타입 안전한 번역 시스템
- 이미지 처리 로직 단순화 (복잡도 약 50% 감소)
- 빌드 오류 완전 해결
- 코드 가독성 및 유지보수성 향상

### 📊 코드 통계
- 삭제된 파일: 14개 (legacy blog 폴더, src/assets 이미지)
- 추가된 파일: 8개 (언어별 페이지, 번역 시스템)
- 수정된 파일: 12개 (컴포넌트, 레이아웃, 설정)

---

## 앞으로의 계획

### 단기 (1-2주)
- [ ] 일본어/영어 블로그 포스트 번역 추가
- [ ] 언어별 SEO 메타태그 최적화
- [ ] 언어 선택 시 부드러운 전환 애니메이션
- [ ] 404 페이지 다국어 지원

### 중기 (1개월)
- [ ] 각 언어별 독립적인 콘텐츠 작성
- [ ] hreflang 태그 추가 (다국어 SEO)
- [ ] 언어별 RSS 피드 생성
- [ ] 사이트맵 다국어 지원

### 장기 (분기별)
- [ ] 자동 번역 워크플로 검토 (DeepL API 등)
- [ ] 언어별 분석 대시보드
- [ ] 다국어 검색 기능

---

## 배운 점

### Astro Content Collections의 한계
- `image()` 헬퍼는 단순한 폴더 구조에서만 안정적
- 중첩된 언어별 구조에서는 public 폴더 사용이 더 안전
- 타입 안전성과 단순성 사이의 균형 필요

### i18n 구현 전략
- URL 기반 라우팅이 SEO에 유리
- 기본 언어는 prefix 없이 사용하여 기존 URL 유지
- 번역 딕셔너리는 중앙화하여 관리 용이성 확보

### 리팩토링의 중요성
- 복잡한 타입 체크보다 단순한 구조가 더 안정적
- 빌드 오류는 즉시 해결해야 기술 부채 방지
- 작은 단위로 테스트하며 진행 (dev → build → deploy)

---

작성일: 2025-10-28
