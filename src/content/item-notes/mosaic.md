---
about: resource:mosaic
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://idl.uw.edu/mosaic/
  - https://idl.uw.edu/mosaic/get-started/
---

## 무엇인가
Mosaic은 워싱턴 대학교 Interactive Data Lab과 카네기멜런 대학교 Data Interaction Group이 만든 확장형 프레임워크로, 데이터베이스와 인터랙티브 시각화 뷰를 연결합니다. 수백만에서 수십억 건에 이르는 대용량 데이터를 선택하고 필터링하며 시각화하는 것이 목표입니다. 대용량 데이터 대시보드를 만드는 개발자와 데이터 시각화 연구자가 주 대상입니다.

## 이럴 때 쓴다
- 브라우저에서 수백만 행 규모의 데이터를 부드럽게 탐색하는 대시보드를 만들 때
- 여러 차트가 같은 선택 상태를 공유하는 연동형 화면을 구성할 때
- Jupyter 노트북에서 인터랙티브 시각화를 쓰고 싶을 때
- 계산을 DuckDB에 맡기는 구조를 실험하고 싶을 때

## 핵심 기능
- **DuckDB 기반 계산**: 연산을 서버의 DuckDB 또는 WebAssembly로 브라우저 안에서 실행하는 DuckDB에 맡깁니다.
- **vgplot**: Mosaic에서 차트를 만드는 라이브러리로, 데이터베이스 테이블에서 바로 마크를 그립니다.
- **선택과 데이터셋 연동**: 컴포넌트들이 선택과 데이터셋을 공유하며 통합되도록 설계되었습니다.
- **배포 방식**: 웹 앱과 Jupyter 위젯에서 쓸 수 있고, 새 컴포넌트를 추가해 확장할 수 있습니다.
- **문서 구성**: Core, SQL, Inputs, vgplot, Spec, Server 등의 가이드가 있습니다.

## 시작하는 법
공식 Get Started 문서는 JavaScript 프로젝트에 라이브러리를 의존성으로 추가하는 방법, 파이썬/Jupyter 사용법, 저장소를 내려받아 개발하는 방법을 안내합니다. 저장소 개발 모드는 Node.js 22 이상과 `pnpm`이 필요하며 `pnpm i` 후 `pnpm dev`로 예제를 볼 수 있습니다. 문서의 최소 예제는 다음과 같습니다.

```js
import * as vg from "@uwdata/vgplot";

vg.coordinator().databaseConnector(vg.wasmConnector());
vg.coordinator().exec(vg.loadCSV("stocks", "stock-data.csv"));
const chart = vg.plot(vg.areaY(vg.from("stocks"), { x: "Date", y: "Price" }));
```

## 알아둘 점
- 라이선스는 BSD이며 저작권은 UW Interactive Data Lab에 있다고 표기됩니다.
- 기본 예제는 브라우저의 DuckDB-WASM을 쓰고, 로컬 DuckDB 서버를 따로 띄우면 더 나은 성능을 기대할 수 있다고 안내됩니다.
- 교차 필터링의 동작 방식은 시작 문서에서 자세히 설명하지 않고 별도 예제 노트북으로 연결됩니다.
