---
title: '통계학 기초: 기술통계와 추론통계'
description: '공부하면서 느낀 통계지식의 부족함을 채워가는 과정'
pubDate: 'Jun 25 2025'
# heroImage: '../../assets/statistics.jpg'
tags: ['통계', '공부', '수학']
---

# 📊 통계학 기초: 기술통계와 추론통계

공부하면서 통계지식의 부족을 절실히 느끼고 있다. 특히 데이터 분석을 하다 보면 기본기가 얼마나 중요한지 깨닫게 된다.

## 🎯 기술통계 vs 추론통계

### 기술통계 (Descriptive Statistics)
> **표본에 관한 양적 정보를 요약**

- 데이터의 중심경향성 측정
- 분산과 표준편차
- 데이터 시각화

#### 주요 측도들

**중심경향성:**
- 평균 (Mean): $\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i$
- 중앙값 (Median)
- 최빈값 (Mode)

**산포도:**
- 분산 (Variance): $s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2$
- 표준편차 (Standard Deviation): $s = \sqrt{s^2}$

### 추론통계 (Inferential Statistics)
> **표본의 양적 정보를 바탕으로 더 큰 전집에 관해 추정**

- 가설검정
- 신뢰구간 추정
- 회귀분석

## 🔍 핵심 개념

### 전집 (Population)
```
전집(population): 무엇인가 알아내고자 하는 것에 관한 모든 가능한 관찰치
```

### 표본 (Sample)
전집에서 추출한 일부 관찰치들의 집합

### 중심극한정리
표본 크기가 충분히 클 때, 표본평균의 분포는 정규분포에 근사한다:

$$\bar{X} \sim N\left(\mu, \frac{\sigma^2}{n}\right)$$

## 💡 실제 적용 사례

### 예시: 대학생 키 분석
```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# 샘플 데이터 생성
heights = np.random.normal(170, 8, 1000)

# 기술통계
mean_height = np.mean(heights)
std_height = np.std(heights, ddof=1)

print(f"평균 키: {mean_height:.2f}cm")
print(f"표준편차: {std_height:.2f}cm")

# 95% 신뢰구간
confidence_interval = stats.t.interval(
    0.95, len(heights)-1, 
    loc=mean_height, 
    scale=stats.sem(heights)
)
print(f"95% 신뢰구간: {confidence_interval}")
```

## 🤔 느낀점과 다음 공부 계획

통계학은 정말 모든 데이터 분석의 기초라는 걸 다시 한번 깨달았다. 

**앞으로 공부할 것들:**
- [ ] 베이즈 통계
- [ ] 다변량 분석
- [ ] 시계열 분석
- [ ] 실험설계

---

### 참고 자료
