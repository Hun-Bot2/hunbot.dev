// Tests for series identity (src/utils/artifacts/series.ts) and the series
// field of the public artifact contract.
import assert from 'node:assert/strict';
import test from 'node:test';

import { readArtifactSources } from '../scripts/lib/read-artifact-sources.mjs';
import { buildHunbotArtifactExport } from '../src/utils/artifacts/adapters.ts';
import { buildSeriesIndex, normalizeSeriesName } from '../src/utils/artifacts/series.ts';
import { validateArtifactExports } from '../src/utils/artifacts/validate.ts';
import { repoRoot } from './helpers/contract-fixture.mjs';

const posts = (entries) => new Map(Object.entries(entries));

test('normalizeSeriesName folds case, spaces, and underscores', () => {
	assert.equal(normalizeSeriesName(' Blog Devlog '), 'blog-devlog');
	assert.equal(normalizeSeriesName('chatting_system'), 'chatting-system');
	assert.equal(normalizeSeriesName('on-the-block'), 'on-the-block');
	assert.equal(normalizeSeriesName('블로그 개발일지'), '블로그-개발일지');
});

test('translations of one post link their spellings; the same normalized spelling elsewhere joins them', () => {
	const { bySlug, inconsistent } = buildSeriesIndex(
		posts({
			'devlog/a': [{ lang: 'ko', series: '블로그 개발일지' }, { lang: 'en', series: 'Blog Devlog' }],
			'devlog/b': [{ lang: 'ko', series: '블로그 개발일지' }, { lang: 'en', series: 'Blog Devlog' }],
			// English-only post spelled "blog-devlog": same normalized form as "Blog Devlog".
			'devlog/c': [{ lang: 'en', series: 'blog-devlog' }],
		}),
	);
	const ids = new Set([...bySlug.values()].map((series) => series.id));
	assert.equal(ids.size, 1, 'one series');
	assert.equal([...ids][0], 'blog-devlog', 'the smallest normalized spelling');
	assert.deepEqual(bySlug.get('devlog/c').title, { ko: '블로그 개발일지', en: 'Blog Devlog' }, 'one shared title: the most used spelling per language');
	assert.deepEqual(bySlug.get('devlog/a'), bySlug.get('devlog/c'));
	assert.deepEqual(inconsistent, [{ id: 'blog-devlog', language: 'en', spellings: ['Blog Devlog', 'blog-devlog'] }]);
});

test('spellings with no post and no normalized form in common stay separate series (nothing is guessed)', () => {
	const { bySlug } = buildSeriesIndex(
		posts({
			'a': [{ lang: 'ko', series: '로컬 LLM 개발일지' }],
			'b': [{ lang: 'en', series: 'Local LLM Devlog' }],
		}),
	);
	assert.notEqual(bySlug.get('a').id, bySlug.get('b').id);
});

test('posts without a series have none', () => {
	const { bySlug, inconsistent } = buildSeriesIndex(posts({ a: [{ lang: 'ko' }], b: [{ lang: 'ko', series: '  ' }, { lang: 'en', series: null }] }));
	assert.equal(bySlug.get('a'), null);
	assert.equal(bySlug.get('b'), null);
	assert.deepEqual(inconsistent, []);
});

test('series ids are stable regardless of post order', () => {
	const forward = buildSeriesIndex(posts({ a: [{ lang: 'ko', series: 'Zeta' }, { lang: 'en', series: 'Alpha' }], b: [{ lang: 'en', series: 'alpha' }] }));
	const reverse = buildSeriesIndex(posts({ b: [{ lang: 'en', series: 'alpha' }], a: [{ lang: 'en', series: 'Alpha' }, { lang: 'ko', series: 'Zeta' }] }));
	assert.equal(forward.bySlug.get('a').id, 'alpha');
	assert.equal(reverse.bySlug.get('a').id, 'alpha');
	assert.equal(forward.bySlug.get('b').id, reverse.bySlug.get('b').id);
});

// ---------------------------------------------------------------------------
// contract
// ---------------------------------------------------------------------------

const artifact = (overrides = {}) => ({
	id: 'writing:a',
	kind: 'writing',
	domain: 'build',
	domainsAlso: [],
	title: { ko: 'A' },
	summary: null,
	time: { start: '2026-01-10' },
	state: 'published',
	topics: [],
	href: { ko: '/ko/blog/a/' },
	externalUrl: null,
	landmark: false,
	addedAt: '2026-01-10',
	origin: 'hunbot',
	sourceRef: null,
	...overrides,
});
const check = (artifacts) =>
	validateArtifactExports([{ label: 'e', value: { contractVersion: 1, producer: 'hunbot', generatedAt: '2026-10-04T00:00:00.000Z', artifacts, relations: [], aggregates: [] } }], { topics: [] });
const rejects = (result, pattern) => assert.ok(result.errors.some((error) => pattern.test(error)), `Expected ${pattern}, got:\n${result.errors.join('\n') || '(none)'}`);

test('contract: series is optional, null, or { id, title }', () => {
	assert.deepEqual(check([artifact()]).errors, [], 'absent: a producer that predates the field');
	assert.deepEqual(check([artifact({ series: null })]).errors, []);
	assert.deepEqual(check([artifact({ series: { id: 'on-the-block', title: { ko: 'on-the-block' } } })]).errors, []);
});

test('contract: malformed series are rejected', () => {
	rejects(check([artifact({ series: 'on-the-block' })]), /series must be null or \{ id, title \}/);
	rejects(check([artifact({ series: { id: 'On The Block', title: { ko: 'x' } } })]), /series\.id must be a lowercase lane key/);
	rejects(check([artifact({ series: { id: 'x', title: {} } })]), /series\.title must contain at least one language/);
	rejects(check([artifact({ series: { id: 'x', title: { ko: 'x' }, order: 2 } })]), /series has unknown field "order"/);
});

test('contract: one series id must carry one title on every artifact', () => {
	const result = check([
		artifact({ series: { id: 'x', title: { ko: '엑스' } } }),
		artifact({ id: 'writing:b', href: { ko: '/ko/blog/b/' }, series: { id: 'x', title: { ko: '다른 이름' } } }),
	]);
	rejects(result, /series "x" has a different title here than on writing:a/);
});

// ---------------------------------------------------------------------------
// real content
// ---------------------------------------------------------------------------

test('real content: every post carries a series or null, grouped consistently, and validates', () => {
	const { export: result } = buildHunbotArtifactExport(readArtifactSources(repoRoot));
	for (const entry of result.artifacts) {
		assert.ok(entry.series === null || typeof entry.series?.id === 'string', `${entry.id}: series is explicit`);
	}
	const withSeries = result.artifacts.filter((entry) => entry.series);
	assert.ok(withSeries.length > 0);
	// Every artifact of a series has the identical title object.
	const titles = Map.groupBy(withSeries, (entry) => entry.series.id);
	for (const [id, members] of titles) {
		assert.equal(new Set(members.map((entry) => JSON.stringify(entry.series.title))).size, 1, `series ${id} has one title`);
	}
	assert.deepEqual(validateArtifactExports([{ label: 'real', value: result }], { topics: readArtifactSources(repoRoot).topics }).errors, []);
});
