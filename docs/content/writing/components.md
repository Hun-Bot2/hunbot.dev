# 블로그 작성 참조

## 본문 태그

블로그 폴더의 MDX에서는 아래 태그를 바로 쓸 수 있다. 이미 같은 이름을 import하거나 선언하는 글은 해당 바인딩을 사용한다. Markdown은 기존 Markdown 문법과 동일한 기본 레이아웃을 지원한다.

| 태그 | 필드 | 쓰임 |
| --- | --- | --- |
| `Compare` | `labelA`, `labelB`, 슬롯 `a`·`b`, 선택 `title` | 나란히 비교할 두 내용 |
| `Example` | `label`, `tone="a"` 또는 `"b"` | 설명 사이에 분리할 비교 항목 |
| `FolderTree` | `nodes={[{ name, children?, note? }]}`, 선택 `label` | 파일·폴더 구조 |
| `WideFigure` | `caption`, `src`·`alt` 또는 자식 요소 | 본문보다 넓게 읽을 그림 |
| `GeometricCover` | `motif`, 선택 `stage="parts"` | 본문에서 표지 모티프 변형 |
| `Workflow` | `label`, `stages={[{ name, skills? }]}` | 순서가 있는 작업 흐름 |

```mdx
<Compare labelA="모호한 요청" labelB="완료 조건이 있는 요청">
  <p slot="a">응답 속도를 개선하라.</p>
  <p slot="b">같은 입력에서 변경 전후 P95를 측정하라.</p>
</Compare>

<WideFigure src="/images/architecture.webp" alt="세 단계 처리 구조" caption="처리 구조 개요" />
```

## 메타데이터

```yaml
series: '블로그 개발일지'
seriesOrder: 15
editorial:
  motif: astra
  relatedPosts: [devlog/status_arc/statusarc_develop_01]
  references:
    - title: 문서 제목
      url: https://example.com/guide
      relation: 원문
      description: 이 자료를 참고한 이유
```

세 필드 `motif`, `relatedPosts`, `references`는 선택 사항이다. `motif`는 목록과 이어 읽기 썸네일을 정한다. `relatedPosts`는 같은 언어의 공개 블로그 글 slug이며 언어 접두사를 빼고 적는다. 둘 다 세 항목까지 지정할 수 있다. 참고 자료는 HTTP(S) 링크를 사용하며 `image`에 자체 `/images/` 자산을 지정할 수 있다.

| 모티프 | 의미 |
| --- | --- |
| `disclosure` | 전체를 필요한 부분으로 나누기 |
| `research` | 질문 수집과 탐색 |
| `reasoning` | 단계나 구성 요소 사이의 연결 |
| `layers` | 계층, 스택, 축적 |
| `intersect` | 여러 입력이나 개념의 교차 |
| `pulse` | 신호, 음성, 측정 변화 |
| `abstract` | 원과 색면을 조합한 추상 썸네일 |
| `astra` | 중심 별, 위성, 궤도를 담은 우주 썸네일 |

내부 읽기에서는 시리즈 이웃과 관련 글을 합쳐 최대 세 개를 표시한다. 노드 선택으로 아래 카드가 바뀌며, JavaScript 없이도 링크를 읽을 수 있다.
