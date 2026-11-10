import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStudySource, readNote } from '../src/note.ts';
import { extractRules, headingSubject, parseCommentCard } from '../src/rules.ts';
import { buildPayload } from '../src/payload.ts';
import { validateOutput, responseSchema } from '../src/llm.ts';
import { attachFormulaChoices, compareFront, definitionFront, formulaFront, limitationFront, principleFront, type Card } from '../src/cards.ts';
import { parseEnv } from '../src/env.ts';
import { splitSentences } from '../src/text.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const basic = path.join(here, 'fixtures', 'basic.mdx');
const concept = path.join(here, 'fixtures', 'concept.mdx');
const root = path.resolve(here, '..');

test('front templates pick particles by the final consonant', () => {
	assert.equal(definitionFront('학습률'), '학습률이란?');
	assert.equal(definitionFront('신뢰된 키'), '신뢰된 키란?');
	assert.equal(definitionFront('Gradient'), 'Gradient란?');
	assert.equal(definitionFront('MOK(Machine Owner Key)'), 'MOK(Machine Owner Key)란?');
	assert.equal(definitionFront('token'), 'token이란?');
	assert.equal(definitionFront('3'), '3이란?');
	assert.equal(principleFront('RRF', '왜 점수 대신 순위를 합치는가?'), 'RRF는 왜 점수 대신 순위를 합치는가? 설명하라.');
	assert.equal(compareFront('편향', '분산', '모델 복잡도'), '편향과 분산: 모델 복잡도의 trade-off를 설명하라.');
	assert.equal(compareFront('Dense', 'BM25', null), 'Dense와 BM25의 관계·차이를 설명하라.');
	assert.equal(principleFront('LSTM', '왜 기울기 소실을 줄이는가'), 'LSTM은 왜 기울기 소실을 줄이는가? 설명하라.');
	assert.equal(limitationFront('RNN', 'LSTM'), 'RNN의 한계는? 그 한계에서 나온 기술은?');
	assert.equal(limitationFront('RNN', null), 'RNN의 한계는?');
	assert.equal(headingSubject('RRF는 왜 점수 대신 순위를 합치는가?'), 'RRF');
	assert.equal(headingSubject('2. 왜 NVIDIA 드라이버가 문제였나'), 'NVIDIA 드라이버');
	assert.equal(headingSubject('개념은(는) 왜 이렇게 동작하는가?'), '개념');
});

test('sentences split at terminal punctuation and line breaks', () => {
	assert.deepEqual(splitSentences('하나입니다. 둘입니다!\n셋'), ['하나입니다.', '둘입니다!', '셋']);
});

test('rules fill definition, formula and principle slots from the basic fixture', () => {
	const note = readNote(basic, root);
	assert.equal(note.parseError, null);
	const { cards, issues } = extractRules(note, { headingBaseline: true });
	assert.deepEqual(issues, []);
	const byFront = new Map(cards.map((c) => [c.front, c]));
	assert.equal(byFront.get('학습률이란?')?.type, 'definition');
	assert.ok(byFront.has('Gradient란?'));
	assert.ok(byFront.has('모멘텀이란?'));
	assert.ok(byFront.has('Gradient Descent는 어떤 방향으로 이동하나요?'));
	const principle = byFront.get('왜 학습률이 너무 크면 발산하는가?');
	assert.equal(principle?.type, 'principle');
	assert.equal(principle?.track, 'understand');
	const formula = cards.find((c) => c.type === 'formula');
	assert.equal(formula?.concept, '갱신 규칙');
	assert.match(formula?.front ?? '', /이 식은 무엇인가\?$/);
	assert.equal(formula?.track, 'memorize');
	assert.ok(!cards.some((c) => /fake|인용 안|일반 항목/.test(c.front)));
});

test('card-break starts a new section with the same heading', () => {
	const note = readNote(basic, root);
	assert.equal(note.sections.filter((s) => s.heading === '왜 학습률이 너무 크면 발산하는가?').length, 2);
});

test('the payload numbers only units the rules did not use', () => {
	const note = readNote(basic, root);
	const rules = extractRules(note, { headingBaseline: true });
	const payload = buildPayload(note, rules.used);
	assert.ok(payload);
	for (const id of rules.used) assert.ok(!payload.unitIds.includes(id), `${id} should not be sent`);
	assert.match(payload.text, /\[C1\] ```python/);
	assert.ok(!payload.text.includes('<|'));
});

test('comment cards report malformed input', () => {
	assert.deepEqual(parseCommentCard('/* anki id="x"\nQ: q\nA: a\n*/'), { id: 'x', q: 'q', a: 'a' });
	assert.deepEqual(parseCommentCard('/* anki\nQ: only question\n*/'), { error: 'needs Q: then A:' });
	assert.deepEqual(parseCommentCard('/* anki id="Bad Id"\nQ: q\nA: a */'), { error: 'invalid id "Bad Id"' });
	assert.equal(parseCommentCard('/* just a comment */'), null);
});

test('a concept note gives a principle card and a formula recognition card with symbol meanings', () => {
	const note = readNote(concept, root);
	const { cards } = extractRules(note, { headingBaseline: true });
	const principle = cards.find((c) => c.type === 'principle');
	const formula = cards.find((c) => c.type === 'formula');
	assert.equal(principle?.concept, 'RRF');
	assert.equal(principle?.front, 'RRF는 왜 점수 대신 순위를 합치는가?');
	assert.equal(formula?.concept, 'RRF 점수');
	assert.match(formula?.front ?? '', /^\$\$\n.*RRF/);
	assert.equal(formula?.back, '**RRF 점수**\n- k: 상위 순위의 영향을 줄이는 상수\n- rank_r(d): 검색기 r에서 문서 d의 순위');
	assert.equal(cards.filter((c) => c.type === 'definition').length, 0);
});

function conceptPayload() {
	const note = readNote(concept, root);
	const payload = buildPayload(note, new Set());
	assert.ok(payload);
	const unitsOf = (heading: string) => note.sections.find((s) => s.heading === heading)!.units;
	return { note, payload, unitsOf };
}

test('LLM concepts become slot cards; bad slots are dropped with a reason', () => {
	const { note, payload, unitsOf } = conceptPayload();
	const rrf = unitsOf('RRF는 왜 점수 대신 순위를 합치는가?');
	const sentences = rrf.filter((id) => id.startsWith('S'));
	const [s1, s2] = sentences;
	const m = rrf.find((id) => id.startsWith('M'))!;
	const symbols = sentences.slice(-2);
	const cmp = unitsOf('Dense와 BM25');
	const lim = unitsOf('BM25의 한계');
	const raw = {
		schema_version: '3.0',
		source_id: note.sourceId,
		concepts: [
			{ name: 'RRF', definition: [s1], principle: { question: '왜 점수 대신 순위를 합치는가', units: [s1, s2] }, formula: { unit: m, symbols, confusables: ['BM25'] } },
			{ name: 'Dense 검색', compare: [{ with: 'BM25', axis: '의미 vs 정확한 단어', units: cmp }] },
			{ name: 'BM25', limitation: [{ units: lim, led_to: '다국어 dense 검색' }] },
			{ name: 'Broken', definition: ['S999'], principle: { question: '왜', units: [s1, cmp[0]] }, formula: { unit: s1 } },
			{ name: '<b>x</b>', definition: [s1] },
		],
	};
	const v = validateOutput(raw, note, payload, 10);
	assert.equal(v.fatal, null);
	assert.deepEqual(v.cards.map((c) => `${c.concept}:${c.type}`), ['RRF:definition', 'RRF:principle', 'RRF:formula', 'Dense 검색:compare', 'BM25:limitation']);
	const byType = Object.fromEntries(v.cards.map((c) => [c.type, c]));
	assert.equal(byType.principle.front, 'RRF는 왜 점수 대신 순위를 합치는가? 설명하라.');
	assert.equal(byType.compare.front, 'Dense 검색과 BM25: 의미 vs 정확한 단어의 trade-off를 설명하라.');
	assert.equal(byType.limitation.front, 'BM25의 한계는? 그 한계에서 나온 기술은?');
	assert.match(byType.limitation.back, /→ \*\*다국어 dense 검색\*\*$/);
	assert.match(byType.formula.back, /^\*\*RRF\*\*\n- k:/);
	assert.deepEqual(byType.formula.confusables, ['BM25']);
	assert.deepEqual(v.rejected.map((r) => `${r.concept}:${r.slot}`), ['Broken:definition', 'Broken:principle', 'Broken:formula', '<b>x</b>:concept']);
	assert.equal(validateOutput({ ...raw, source_id: 'other' }, note, payload, 10).fatal, 'source_id does not match the request');
	assert.match(validateOutput({ cards: [] }, note, payload, 10).fatal ?? '', /^schema:/);
});

test('LLM cards that duplicate a rule card are skipped', () => {
	const { note, payload, unitsOf } = conceptPayload();
	const [s1] = unitsOf('RRF는 왜 점수 대신 순위를 합치는가?').filter((id) => id.startsWith('S'));
	const raw = { schema_version: '3.0', source_id: note.sourceId, concepts: [{ name: 'RRF', definition: [s1] }] };
	assert.equal(validateOutput(raw, note, payload, 5, new Set(['def:rrf'])).cards.length, 0);
});

test('formula choices use other formula concepts first, then confusables', () => {
	const make = (concept: string, confusables: string[] = []): Card => ({ cardKey: `formula:${concept}`, sourceId: 's', origin: 'llm', type: 'formula', track: 'memorize', concept, front: '', back: '', units: [], section: 0, heading: '', formula: `f_{${concept}}`, confusables });
	const many = ['RRF', 'BM25', 'softmax', 'cross-entropy'].map((c) => make(c));
	attachFormulaChoices(many);
	for (const card of many) {
		assert.match(card.front, /이 식은 어떤 기법인가\?\n\n① /);
		assert.ok(card.front.includes(card.concept));
		assert.equal((card.front.match(/[①②③④]/g) ?? []).length, 4);
	}
	const lone = [make('RRF', ['CombSUM', 'Borda count'])];
	attachFormulaChoices(lone);
	assert.equal((lone[0].front.match(/[①②③④]/g) ?? []).length, 3);
	const bare = [make('RRF')];
	attachFormulaChoices(bare);
	assert.equal(bare[0].front, formulaFront('f_{RRF}', null));
});

test('the response schema caps concepts and lists the five slots', () => {
	const schema = responseSchema(5) as { properties: { concepts: { maxItems: number; items: { properties: Record<string, unknown> } } } };
	assert.equal(schema.properties.concepts.maxItems, 5);
	assert.deepEqual(Object.keys(schema.properties.concepts.items.properties), ['name', 'definition', 'principle', 'formula', 'compare', 'limitation']);
});

test('BOM and CRLF keep line numbers of the original file', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-'));
	const file = path.join(dir, 'crlf.mdx');
	fs.writeFileSync(file, '\uFEFF---\r\ntitle: "t"\r\n---\r\n\r\n## 용어\r\n\r\n- **키:** 값입니다.\r\n');
	const note = readNote(file, dir);
	assert.equal(note.parseError, null);
	const card = extractRules(note, { headingBaseline: false }).cards[0];
	assert.equal(card.front, '키란?');
	assert.equal(note.units.get(card.units[0])?.line, 7);
});

test('env parsing strips quotes and ignores comments', () => {
	assert.deepEqual(parseEnv('# c\nA="x"\nB=\'y\'\nC = z \n'), { A: 'x', B: 'y', C: 'z' });
});

test('only study notes are sources (D11)', () => {
	assert.equal(isStudySource('src/content/blog/ko/study/linux/secure-boot.mdx'), true);
	assert.equal(isStudySource('src/content/blog/en/study/x.md'), true);
	assert.equal(isStudySource('src/content/blog/ko/devlog/ALGO_BOT/Algorithm_Bot_01.mdx'), false);
	assert.equal(isStudySource('src/content/academic-reviews/ko/study/x.mdx'), false);
});

test('code patterns become recognition cards from rules (X 사용법: / X의 코드:)', () => {
	const note = readNote(path.join(here, 'fixtures', 'code.mdx'), root);
	assert.equal(note.parseError, null);
	const { cards } = extractRules(note, { headingBaseline: false });
	const code = cards.filter((c) => c.type === 'formula');
	assert.deepEqual(code.map((c) => c.concept), ['Promise', 'async/await']);
	assert.equal(code[0].formulaKind, 'code');
	assert.match(code[0].front, /^```js\nconst p = new Promise[\s\S]*```\n\n이 코드는 무엇인가\?$/);
	assert.equal(code[0].back, '**Promise**\n- resolve: 성공 값을 넘기며 이행 상태로 바꾼다\n- reject: 실패 이유를 넘기며 거부 상태로 바꾼다');
	attachFormulaChoices(code);
	assert.match(code[0].front, /이 코드는 어떤 기법인가\?\n\n[①②] (Promise|async\/await) {2}[①②] /);
});

test('table rows become header: value units', () => {
	const note = readNote(path.join(here, 'fixtures', 'code.mdx'), root);
	const texts = [...note.units.values()].map((u) => u.text);
	assert.ok(texts.includes('지표: Recall@8 · 값: 0.71'));
	assert.ok(!texts.some((t) => t.includes('|')));
});

test('LLM: a code unit can fill the formula slot; a slot repeating another slot\'s sentences is rejected', () => {
	const note = readNote(path.join(here, 'fixtures', 'code.mdx'), root);
	const payload = buildPayload(note, new Set());
	assert.ok(payload);
	const promise = note.sections.find((s) => s.heading === 'Promise')!.units;
	const c1 = promise.find((id) => id.startsWith('C'))!;
	const s = promise.filter((id) => id.startsWith('S'));
	const raw = { schema_version: '3.0', source_id: note.sourceId, concepts: [{ name: 'Promise', definition: [s[1]], principle: { question: '어떻게 비동기 결과를 전달하는가', units: [s[1]] }, formula: { unit: c1, symbols: [s[1], s[2]] } }] };
	const v = validateOutput(raw, note, payload, 5);
	assert.deepEqual(v.cards.map((c) => c.type), ['definition', 'formula']);
	assert.equal(v.cards[1].formulaKind, 'code');
	assert.deepEqual(v.rejected.map((r) => r.reason), ['same sentences as the definition slot']);
});

test('instructions live in the system instruction; the user message holds only the note', async () => {
	const { buildPrompt } = await import('../src/llm.ts');
	const note = readNote(basic, root);
	const payload = buildPayload(note, extractRules(note, { headingBaseline: true }).used);
	assert.ok(payload);
	const prompt = buildPrompt(payload, 5);
	assert.match(prompt.system, /fill a fixed schema per concept/);
	assert.ok(!prompt.system.includes(payload.text.trim().split('\n')[1]), 'note text must not be in the system instruction');
	assert.ok(prompt.user.startsWith(`source_id: ${note.sourceId}\n<note>\n`));
	assert.ok(prompt.user.endsWith('</note>'));
	assert.ok(!/schema|Return only|instructions/i.test(prompt.user.replace(payload.text.trimEnd(), '')));
});

test('decks follow decks.yaml by folder; snippet leftovers are ignored (D15)', async () => {
	const { resolveDeck, noteTags, loadDeckMap } = await import('../src/decks.ts');
	const map = loadDeckMap();
	assert.equal(resolveDeck('src/content/blog/ko/study/RAG/Search.mdx', { anki: { deck: 'Study' } }, map), 'Study::AI');
	assert.equal(resolveDeck('src/content/blog/ko/study/Training/lora.mdx', null, map), 'Study::AI');
	assert.equal(resolveDeck('src/content/blog/ko/study/Linear-Algebra/eigen.mdx', null, map), 'Study::Math');
	assert.equal(resolveDeck('src/content/blog/ko/study/Statistics/mle.mdx', null, map), 'Study::Math');
	assert.equal(resolveDeck('src/content/blog/ko/study/linux/secure-boot.mdx', null, map), 'Study::CS');
	assert.equal(resolveDeck('src/content/blog/ko/study/ai01.md', null, map), 'Study::AI');
	assert.equal(resolveDeck('src/content/blog/ko/study/unknown/x.mdx', null, map), 'Study::Inbox');
	assert.equal(resolveDeck('src/content/blog/ko/study/RAG/x.mdx', { anki: { deck: 'Study::Custom' } }, map), 'Study::Custom');
	assert.deepEqual(noteTags('src/content/blog/ko/study/RAG/Search.mdx', { tags: ['tag', 'rag'] }), ['subject::rag', 'rag']);
});

test('card HTML: math becomes MathJax delimiters, code is escaped, raw HTML is dropped', async () => {
	const { markdownToHtml } = await import('../src/render.ts');
	assert.equal(markdownToHtml('$$\nx<1\n$$'), '<div class="math">\\[x&#x3C;1\\]</div>');
	assert.match(markdownToHtml('값 $k$'), /\\\(k\\\)/);
	assert.match(markdownToHtml('```js\na < b\n```'), /<pre><code class="language-js">a &#x3C; b/);
	assert.ok(!markdownToHtml('<script>alert(1)</script>').includes('<script'));
});

test('numbered question headings lose their section number on the front', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-'));
	const file = path.join(dir, 'n.mdx');
	fs.writeFileSync(file, '---\ntitle: "t"\n---\n\n## 2.1 왜 reranker가 효과적이었나\n\n순위가 문제였습니다.\n');
	const card = extractRules(readNote(file, dir), { headingBaseline: true }).cards[0];
	assert.equal(card.front, '왜 reranker가 효과적이었나');
});
