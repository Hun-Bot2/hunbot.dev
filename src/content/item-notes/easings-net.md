---
about: resource:easings-net
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://easings.net
  - https://github.com/ai/easings.net
---

## 무엇인가
Easing Functions Cheat Sheet(easings.net)는 애니메이션 이징 함수를 한눈에 비교하는 참고 페이지입니다. Andrey Sitnik과 Ivan Solovev가 만들었습니다. 이징은 값이 시간에 따라 변하는 속도를 정하는 함수이며, 사이트는 현실의 물체가 일정한 속도로 움직이지 않으므로 이징을 쓰면 더 자연스럽다고 설명합니다. 애니메이션 곡선을 고르는 프론트엔드 개발자와 디자이너를 위한 곳입니다.

## 이럴 때 쓴다
- CSS transition에 어울리는 가속·감속 곡선을 고를 때
- 튀거나 출렁이는 효과(Back, Elastic, Bounce)가 어떻게 보이는지 확인할 때
- 이징 함수의 수학적 정의를 코드로 구현하고 싶을 때
- 직선(linear) 움직임과 비교해 차이를 눈으로 볼 때

## 핵심 기능
- **30개 이징**: Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce의 10개 계열이 각각 In, Out, InOut 세 가지로 나뉩니다.
- **인터랙티브 비교**: 크기, 위치, 투명도 변화에서 선택한 이징과 직선을 견줘 볼 수 있습니다.
- **CSS 사용 예**: transition과 animation 속성, @keyframes에 적용하는 예가 있습니다.
- **PostCSS 플러그인 안내**: postcss-easings와 postcss-easing-gradients를 소개합니다.
- **다국어와 테마**: 약 40개 언어와 라이트/다크/자동 테마를 지원합니다.

## 시작하는 법
목록에서 이징 카드를 눌러 움직임을 확인하고, 마음에 드는 것의 CSS 값이나 함수 정의를 복사해 사용합니다. 곡선을 직접 수정하려면 페이지가 안내하는 cubic-bezier.com을 활용할 수 있습니다.

## 알아둘 점
- 사이트는 오픈 소스이며, GitHub 저장소(ai/easings.net)의 라이선스는 GPL-3.0으로 표시됩니다(2026-10 기준). 코드를 가져다 쓸 때는 조건을 확인하세요.
- 페이지 설명에 따르면 PostCSS 플러그인으로 이징 자체를 지정할 수는 없어 @keyframes를 우회로로 쓰라고 안내합니다.
