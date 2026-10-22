import { test } from 'node:test';
import assert from 'node:assert/strict';

import { selectHeroSlides, splitHeadline, plateWord } from '../src/utils/hero.ts';

const post = (id, date, extra = {}) => ({
	id,
	data: { title: `t-${id}`, description: `d-${id}`, pubDate: new Date(date), ...extra },
});
const review = (id, date) => ({
	id,
	data: { title: `r-${id}`, pubDate: new Date(date), paper: { title: 'Paper', venue: 'NeurIPS', year: 2025 } },
});

test('takes the newest four posts when there is no review', () => {
	const posts = ['a', 'b', 'c', 'd', 'e'].map((id, i) => post(id, `2026-01-0${i + 1}`));
	const slides = selectHeroSlides(posts, []);
	assert.deepEqual(slides.map((s) => s.entry.id), ['e', 'd', 'c', 'b']);
	assert.ok(slides.every((s) => s.kind === 'post'));
});

test('the newest review replaces slide four', () => {
	const posts = ['a', 'b', 'c', 'd', 'e'].map((id, i) => post(id, `2026-01-0${i + 1}`));
	const slides = selectHeroSlides(posts, [review('old', '2026-02-01'), review('new', '2026-03-01')]);
	assert.deepEqual(slides.map((s) => s.entry.id), ['e', 'd', 'c', 'new']);
	assert.equal(slides[3].kind, 'review');
	assert.equal(slides[3].description, 'Paper — NeurIPS · 2025');
});

test('fewer items than slots: review is appended, nothing is invented', () => {
	assert.equal(selectHeroSlides([post('a', '2026-01-01')], []).length, 1);
	const slides = selectHeroSlides([post('a', '2026-01-01')], [review('r', '2026-01-02')]);
	assert.deepEqual(slides.map((s) => s.kind), ['post', 'review']);
	assert.equal(selectHeroSlides([], []).length, 0);
});

test('a post slide carries its hero image', () => {
	const [slide] = selectHeroSlides([post('a', '2026-01-01', { heroImage: '/images/x.png' })], []);
	assert.equal(slide.heroImage, '/images/x.png');
});

test('splitHeadline: spaces separate words, punctuation sticks', () => {
	const words = splitHeadline('Hello, brave new world!', 'en');
	assert.deepEqual(words.map((w) => w.text), ['Hello,', 'brave', 'new', 'world!']);
	assert.deepEqual(words.map((w) => w.spaceAfter), [true, true, true, false]);
});

test('splitHeadline: Korean splits on spaces, Japanese on words', () => {
	assert.deepEqual(splitHeadline('보안 부팅 체인 이해하기', 'ko').map((w) => w.text), ['보안', '부팅', '체인', '이해하기']);
	const ja = splitHeadline('今日は天気がいい。', 'jp');
	assert.ok(ja.length > 1);
	assert.equal(ja.map((w) => w.text).join(''), '今日は天気がいい。');
	assert.ok(ja.at(-1).text.endsWith('。'));
});

test('plateWord is the first word', () => {
	assert.equal(plateWord('Secure Boot chain', 'en'), 'Secure');
	assert.equal(plateWord('', 'en'), '');
});
