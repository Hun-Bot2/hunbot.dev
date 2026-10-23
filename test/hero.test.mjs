import { test } from 'node:test';
import assert from 'node:assert/strict';

import { selectHeroSlides, splitHeadline, plateWord } from '../src/utils/hero.ts';

const explainer = (id, date, image) => ({
	id,
	data: {
		id,
		title: `e-${id}`,
		dek: `dek-${id}`,
		publishedAt: date,
		source: { language: 'ja', kind: 'article' },
		...(image ? { image } : {}),
	},
});
const note = (issue, publishedAt = '2026-10-23', weekOf = '2026-10-19') => ({
	id: String(issue),
	data: { issue, title: `n-${issue}`, dek: `dek-${issue}`, weekOf, publishedAt },
});
const signal = (id, keptAt, verdict = 'try') => ({ id, data: { keptAt, title: `s-${id}`, verdict } });
const item = (id, date, withImage = true) => ({
	id,
	title: `i-${id}`,
	url: `https://example.com/${id}`,
	kind: 'tool',
	date,
	image: withImage ? { kind: 'og', src: `/images/resources/${id}.webp`, width: 1200, height: 630 } : { kind: 'typographic', label: id },
});
const base = { explainers: [], weeklyNotes: [], signals: [], items: [], signalsTitle: 'Signals today' };

test('with nothing published the hero is filled from the 자료 items, newest first, images first', () => {
	const slides = selectHeroSlides({
		...base,
		items: [item('old', '2026-01-01'), item('plain', '2026-09-01', false), item('new', '2026-08-01'), item('mid', '2026-05-01'), item('x', '2025-01-01')],
	});
	assert.deepEqual(slides.map((s) => s.kind), ['item', 'item', 'item', 'item']);
	assert.deepEqual(slides.map((s) => s.key), ['item-new', 'item-mid', 'item-old', 'item-x']);
});

test('order is explainer, weekly note, today\'s signals, then 자료 items up to four', () => {
	const slides = selectHeroSlides({
		explainers: [explainer('a', '2026-10-01'), explainer('b', '2026-10-20')],
		weeklyNotes: [note(1), note(2)],
		signals: [signal('x', '2026-10-20'), signal('y', '2026-10-22'), signal('z', '2026-10-22', 'doubt')],
		items: [item('i1', '2026-09-01'), item('i2', '2026-09-02')],
		signalsTitle: 'Signals today',
	});
	assert.deepEqual(slides.map((s) => s.kind), ['explainer', 'weekly', 'signals', 'item']);
	assert.equal(slides[0].slug, 'b');
	assert.equal(slides[1].issue, 2);
	assert.equal(slides[3].key, 'item-i2');
});

test('the signals slide is the latest keptAt day with a count and at most three titles', () => {
	const signals = ['a', 'b', 'c', 'd'].map((id) => signal(id, '2026-10-22'));
	const [slide] = selectHeroSlides({ ...base, signals: [...signals, signal('old', '2026-10-01')] });
	assert.equal(slide.kind, 'signals');
	assert.equal(slide.day, '2026-10-22');
	assert.equal(slide.count, 4);
	assert.equal(slide.items.length, 3);
	assert.equal(slide.title, 'Signals today');
});

test('the weekly slide counts the signals kept inside its week', () => {
	const [slide] = selectHeroSlides({
		...base,
		weeklyNotes: [note(1, '2026-10-23', '2026-10-19')],
		signals: [signal('in1', '2026-10-19'), signal('in2', '2026-10-25'), signal('out', '2026-10-26'), signal('before', '2026-10-18')],
	});
	assert.equal(slide.kind, 'weekly');
	assert.equal(slide.signalCount, 2);
});

test('a typographic explainer image gives no image; a real one is kept', () => {
	const [plain] = selectHeroSlides({ ...base, explainers: [explainer('a', '2026-10-01', { kind: 'typographic' })] });
	assert.equal(plain.image, null);
	const [pic] = selectHeroSlides({ ...base, explainers: [explainer('a', '2026-10-01', { kind: 'og', src: '/images/resources/a.webp', width: 10, height: 5 })] });
	assert.equal(pic.image.src, '/images/resources/a.webp');
});

test('empty input gives no slides; one input gives one (the caller renders it static)', () => {
	assert.deepEqual(selectHeroSlides(base), []);
	assert.equal(selectHeroSlides({ ...base, explainers: [explainer('a', '2026-10-01')] }).length, 1);
});

test('splitHeadline: spaces separate words, punctuation sticks', () => {
	const words = splitHeadline('Hello, brave new world!', 'en');
	assert.deepEqual(words.map((w) => w.text), ['Hello,', 'brave', 'new', 'world!']);
	assert.deepEqual(words.map((w) => w.spaceAfter), [true, true, true, false]);
});

test('splitHeadline: Korean splits on spaces, Japanese on words', () => {
	assert.deepEqual(splitHeadline('보안 부팅 체인 이해하기', 'ko').map((w) => w.text), ['보안', '부팅', '체인', '이해하기']);
	assert.deepEqual(splitHeadline('Boot와 드라이버', 'ko').map((w) => w.text), ['Boot와', '드라이버']);
	const ja = splitHeadline('今日は天気がいい。', 'jp');
	assert.ok(ja.length > 1);
	assert.equal(ja.map((w) => w.text).join(''), '今日は天気がいい。');
	assert.ok(ja.at(-1).text.endsWith('。'));
});

test('plateWord is the first word', () => {
	assert.equal(plateWord('Secure Boot chain', 'en'), 'Secure');
	assert.equal(plateWord('', 'en'), '');
});
