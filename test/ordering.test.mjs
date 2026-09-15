import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compareIds, stableBy, sortStable } from '../src/utils/ordering.ts';
import { getFeaturedTopics, getFeaturedPapers, getFeaturedResources } from '../src/utils/library.ts';

// Deterministic shuffle: a seeded LCG, so a failure is reproducible. A test that
// only fails sometimes is a test nobody trusts.
function shuffled(items, seed) {
	const out = [...items];
	let state = seed;
	for (let i = out.length - 1; i > 0; i -= 1) {
		state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
		const j = state % (i + 1);
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function assertOrderIsStable(label, items, run) {
	const expected = run(items).map((entry) => entry.id);
	for (let seed = 1; seed <= 200; seed += 1) {
		assert.deepEqual(run(shuffled(items, seed)).map((e) => e.id), expected,
			`${label} depended on input order (seed ${seed})`);
	}
	return expected;
}

const topic = (id, order, ko) => ({ id, data: { order, label: { ko }, status: 'active' } });
const dates = { review: { reviewedAt: '2026-01-01' }, source: { firstSeenAt: '2026-01-01', lastCheckedAt: '2026-01-01' } };
const paper = (id, year, title) => ({ id, data: { year, title, ...dates } });
const resource = (id, title, featured = false) => ({ id, data: { title, featured, ...dates } });

test('compareIds is a total order and avoids locale-dependent collation', () => {
	assert.ok(compareIds('a', 'b') < 0);
	assert.ok(compareIds('b', 'a') > 0);
	assert.equal(compareIds('same', 'same'), 0);
	// Code-point order, not locale order: the two disagree for these in some locales.
	assert.ok(compareIds('Z', 'a') < 0, 'uppercase must sort before lowercase, as code points do');
});

test('stableBy falls back to id when the primary comparison ties', () => {
	const alwaysTied = stableBy(() => 0);
	const items = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
	assert.deepEqual([...items].sort(alwaysTied).map((i) => i.id), ['a', 'b', 'c']);
});

test('sortStable does not mutate its input', () => {
	const items = [{ id: 'b' }, { id: 'a' }];
	const before = items.map((i) => i.id);
	sortStable(items, () => 0);
	assert.deepEqual(items.map((i) => i.id), before);
});

test('featured topics honour order, then Korean label, then id', () => {
	const topics = [
		topic('zulu', 0, '가'), topic('alpha', 0, '나'), topic('mike', -5, '다'), topic('bravo', 10, '라'),
	];
	assert.deepEqual(getFeaturedTopics(topics, 4).map((t) => t.id), ['mike', 'zulu', 'alpha', 'bravo']);
});

test('featured topics are identical under 200 shuffles', () => {
	const topics = Array.from({ length: 30 }, (_, i) => topic(`t${String(i).padStart(2, '0')}`, 0, '같은라벨'));
	const order = assertOrderIsStable('getFeaturedTopics', topics, (t) => getFeaturedTopics(t, 6));
	assert.equal(order.length, 6);
});

test('featured papers are identical under 200 shuffles when every sort key ties', () => {
	const papers = Array.from({ length: 20 }, (_, i) => paper(`p${String(i).padStart(2, '0')}`, 2024, 'Identical title'));
	assertOrderIsStable('getFeaturedPapers', papers, (p) => getFeaturedPapers(p, 3));
});

test('featured papers still rank newer years first', () => {
	const papers = [paper('old', 2019, 'A'), paper('new', 2025, 'B'), paper('mid', 2022, 'C')];
	assert.deepEqual(getFeaturedPapers(papers, 3).map((p) => p.id), ['new', 'mid', 'old']);
});

test('featured resources are identical under 200 shuffles when every sort key ties', () => {
	const resources = Array.from({ length: 20 }, (_, i) => resource(`r${String(i).padStart(2, '0')}`, 'Identical title'));
	assertOrderIsStable('getFeaturedResources', resources, (r) => getFeaturedResources(r, 3));
});

test('featured resources still put featured entries first', () => {
	const resources = [resource('plain', 'A'), resource('starred', 'B', true)];
	assert.deepEqual(getFeaturedResources(resources, 2).map((r) => r.id), ['starred', 'plain']);
});
