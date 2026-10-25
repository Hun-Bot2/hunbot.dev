---
about: resource:llmlingua
writtenAt: '2026-10-25'
draft: true
authorship: bot
sources:
  - https://github.com/microsoft/LLMLingua
  - https://raw.githubusercontent.com/microsoft/LLMLingua/main/README.md
---

## 무엇인가
LLMLingua는 Microsoft가 공개한 프롬프트 압축 도구입니다. 작은 언어 모델로 프롬프트에서 중요도가 낮은 토큰을 찾아 제거해, 큰 모델에 보내는 입력 길이를 줄여 줍니다. 긴 프롬프트나 RAG 컨텍스트 때문에 비용과 지연이 커진 LLM 애플리케이션 개발자를 위한 도구입니다.

## 이럴 때 쓴다
- 긴 문서나 대화 기록을 넣어야 해서 토큰 비용이 부담될 때
- RAG에서 검색된 문맥이 길어 모델 컨텍스트 한도에 가까울 때
- 입력 길이를 줄여 응답 속도를 개선하고 싶을 때
- 프롬프트 압축 연구를 재현하거나 비교하고 싶을 때

## 핵심 기능
- **LLMLingua**: 원 방법으로, GPT2-small이나 LLaMA-7B 같은 모델로 압축합니다. README는 최대 20배 압축을 내세웁니다.
- **LongLLMLingua**: 긴 문맥과 RAG에 맞춘 변형으로, 중간 부분 정보가 묻히는 문제를 다룹니다.
- **LLMLingua-2**: GPT-4 증류 데이터로 학습한 BERT급 토큰 분류기로, 원 방법보다 빠르다고 소개됩니다.
- **SecurityLingua**: 보안 관점의 압축으로 탈옥 시도의 의도를 드러내는 변형입니다.
- **프레임워크 연동**: Prompt flow, LangChain, LlamaIndex와 함께 쓰는 방법이 안내됩니다.

## 시작하는 법

```bash
pip install llmlingua
```

```python
from llmlingua import PromptCompressor

llm_lingua = PromptCompressor()
compressed_prompt = llm_lingua.compress_prompt(prompt, instruction="", question="", target_token=200)
```

`target_token`으로 목표 길이를 지정합니다. `microsoft/phi-2`나 양자화된 Llama-2 같은 다른 압축 모델을 쓰는 예시도 README에 있으며, 양자화 모델은 `optimum`, `auto-gptq` 같은 추가 패키지가 필요합니다.

## 알아둘 점
- 라이선스는 MIT로 표기됩니다(GitHub 기준).
- 압축률과 성능 수치는 저자들의 논문과 README에 근거한 주장이며, README 자체에는 독립 벤치마크가 없습니다.
- README의 예시 출력에서 높은 압축률일 때 일부 단어가 깨진 모습이 보이므로, 압축 후 결과 품질은 직접 확인해야 합니다.
