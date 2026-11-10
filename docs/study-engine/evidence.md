# Learning-science evidence

Checked 2026-11-10 via PubMed, Crossref, OpenAlex, ERIC and full-text PDFs where available. **Level**: `full` = numbers read from the paper; `abstract` = abstract only; `search` = search results only. Every DOI resolved to the stated paper.

## Core papers

| Paper | Level | Participants and task | Delay | Main result | Limits |
| --- | --- | --- | --- | --- | --- |
| Dunlosky et al. (2013) [10.1177/1529100612453266](https://doi.org/10.1177/1529100612453266) | abstract | Review of 10 techniques | — | High utility: practice testing, distributed practice. Moderate: elaborative interrogation, self-explanation, interleaving. Low: summarization, highlighting, keyword mnemonic, imagery, rereading | Expert ratings, not effect sizes; self-explanation under-tested in classrooms |
| Roediger & Karpicke (2006) [10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x) | full | 120 and 180 undergraduates; prose free recall; no feedback | 5 min, 2 d, 1 wk | 1 week: tested 56% vs restudied 42% (d = 0.83). At 5 minutes restudy wins. Restudiers were most confident | Lab, two passages, no transfer measure |
| Cepeda et al. (2006) [10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354) | abstract | Meta-analysis, 839 assessments from 184 articles; verbal recall | Various | Spaced beats massed; the best gap grows with the retention interval | Verbal recall only |
| Karpicke & Blunt (2011) [10.1126/science.1199327](https://doi.org/10.1126/science.1199327) | full | 80 and 120 undergraduates; science texts; retrieval vs concept mapping at equal time | 1 wk | Retrieval 0.67 vs mapping 0.45 (d = 1.50), also on inference questions; 84% did better with retrieval while 75% expected mapping to be better | Critique by Mintzes et al. (2011) [10.1126/science.1203698](https://doi.org/10.1126/science.1203698); inference items are near transfer |
| Sweller & Cooper (1985) [10.1207/s1532690xci0201_3](https://doi.org/10.1207/s1532690xci0201_3) | abstract | School and university students; algebra; worked examples vs problem solving | Immediate | Faster learning and fewer errors on similar problems; benefit limited to problems with the same structure | No transfer to different structures; no delay |

## Effect sizes and boundaries

| Source | Level | Finding | Implication |
| --- | --- | --- | --- |
| Rowland (2014) [10.1037/a0037559](https://doi.org/10.1037/a0037559) | full (numbers) | Testing vs restudy g = 0.50; recall > recognition; with feedback 0.73 vs 0.39 without; ≥ 1 day delay 0.69; initial success ≤ 50% → g = 0.03; publication bias | Free recall, feedback after every attempt, not-too-hard prompts |
| Pan & Rickard (2018) [10.1037/bul0000151](https://doi.org/10.1037/bul0000151) | abstract | Transfer d = 0.40; strongest to application/inference; weak to untested material and worked-example problems; can vanish after bias correction | Expect, do not assume, better new-problem solving; explanation-style retrieval helps |
| Adesope et al. (2017) [10.3102/0034654316689306](https://doi.org/10.3102/0034654316689306) | abstract | Practice tests beat restudy and other conditions | Supporting |
| Bisra et al. (2018) [10.1007/s10648-018-9434-x](https://doi.org/10.1007/s10648-018-9434-x) | abstract | Self-explanation prompts g = .55 (69 effect sizes) | Basis for understand cards |
| Agarwal et al. (2021) [10.1007/s10648-021-09595-9](https://doi.org/10.1007/s10648-021-09595-9) | abstract | 50 classroom experiments; 57% medium or large effects | Holds outside the lab |
| Kalyuga et al. (2003) [10.1207/S15326985EP3801_4](https://doi.org/10.1207/S15326985EP3801_4) | abstract | Expertise reversal: aids that help novices can hurt experts | Fade hints and worked examples |
| Hattie & Timperley (2007) [10.3102/003465430298487](https://doi.org/10.3102/003465430298487); Shute (2008) [10.3102/0034654307313795](https://doi.org/10.3102/0034654307313795) | abstract | Feedback can help or hurt; specific, non-evaluative, timely works | Show what is missing, not a score |

## Anki and FSRS

Anki 23.10 (2023-11-01) integrated FSRS; the manual describes it as an alternative to SM-2, enabled globally in deck options. Whether SM-2 is still the default is not stated. The engine builds no scheduler (D7).

## Features mapped to evidence

| Feature | Evidence | Hypothesis | Metric | In scope |
| --- | --- | --- | --- | --- |
| Memorize cards in Anki | High (R&K 2006, Rowland 2014, Cepeda 2006) | Retrieval + feedback + spacing beats rereading | 7-day recall, Anki lapses | Yes (core) |
| Understand cards ("explain, then flip") | Moderate (Dunlosky 2013, Bisra 2018, K&B 2011) | Explaining improves understanding and transfer more than recall alone | 7-day explanation score, misconceptions | Yes (core) |
| Import all, suspend in Anki | None (workflow choice) | Missing a needed card costs more than reviewing an easy one | Suspend rate by track | Yes |
| Application task page | Moderate–low (Pan & Rickard 2018) | Applying helps new-problem solving a little | New-problem success | Later (D8) |
| Error-type self-classification | Low (derived from feedback reviews) | Different causes need different next steps | Type counts, next-attempt change | Later (with D8) |
| Worked example → fading | Moderate (Sweller & Cooper 1985, Kalyuga 2003) | Reduces load for novices | Success per step | Not planned |
| AI-written cards / AI grading | None (tooling) | Saves my time | Hit rate, factual error rate, agreement with my grading | Cards yes; grading no |

Most evidence uses short texts and verbal recall in the lab. I found no study measuring 7-day recall plus new-problem solving at equal total time on university CS/ML/math notes, so the hypotheses above are tested in [evaluation.md](evaluation.md) §4.

## Activity by subject

| Subject | Card types / tasks | Example |
| --- | --- | --- |
| NLP/ML | `why`, `compare`, `formula` | Why LoRA uses less memory than full fine-tuning, and its assumption |
| RL/math | `formula`; derivation tasks | Derive the Bellman expectation equation from the definition of the state value |
| Systems | `how`; debugging tasks | Why a freshly built kernel module does not load with Secure Boot on |
| HCI/InfoVis | `compare`; design tasks | Bar vs dot chart for this data, and why |
| Languages | `definition`; speaking tasks | Say the expression, then compare with the note |

Not everything becomes a card, and nothing becomes multiple choice by default.
