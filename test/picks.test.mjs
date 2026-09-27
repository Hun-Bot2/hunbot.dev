import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
	computePickTier,
	getFreshnessBadges,
	getPickFacts,
	formatStarCount,
	normalizePickUrl,
	getRecentPicks,
} from '../src/utils/picks.ts';

// Same tier order/shape src/data/libraryPolicy.ts ships, kept local so these
// tests do not depend on that file's current threshold values — a future
// threshold tweak there should not have to touch this test.
const tiers = [
	{ id: 'essential', label: { ko: '', en: '', jp: '' }, description: { ko: '', en: '', jp: '' }, minStars: 10000 },
	{ id: 'popular', label: { ko: '', en: '', jp: '' }, description: { ko: '', en: '', jp: '' }, minStars: 1000 },
	{ id: 'discovery', label: { ko: '', en: '', jp: '' }, description: { ko: '', en: '', jp: '' }, minStars: 0 },
];

function snapshotWith(stars) {
	return { 'owner/repo': { stars, createdAt: '2020-01-01', pushedAt: '2026-01-01', fetchedAt: '2026-02-01' } };
}

test('computePickTier: a manual tier wins even when stars would say otherwise', () => {
	const result = computePickTier({ tier: 'discovery', repo: 'owner/repo' }, snapshotWith(50_000), tiers);
	assert.deepEqual(result, { tier: 'discovery', source: 'manual' });
});

test('computePickTier: star thresholds at their exact boundaries', () => {
	const cases = [
		[0, 'discovery'],
		[999, 'discovery'],
		[1000, 'popular'],
		[9999, 'popular'],
		[10000, 'essential'],
	];
	for (const [stars, expectedTier] of cases) {
		const result = computePickTier({ repo: 'owner/repo' }, snapshotWith(stars), tiers);
		assert.deepEqual(result, { tier: expectedTier, source: 'stars' }, `${stars} stars should land in "${expectedTier}"`);
	}
});

test('computePickTier: a repo with no snapshot entry falls back to discovery/default', () => {
	const result = computePickTier({ repo: 'owner/unknown-repo' }, snapshotWith(50_000), tiers);
	assert.deepEqual(result, { tier: 'discovery', source: 'default' });
});

test('computePickTier: a non-repo pick with no manual tier falls back to discovery/default', () => {
	const result = computePickTier({}, snapshotWith(50_000), tiers);
	assert.deepEqual(result, { tier: 'discovery', source: 'default' });
});

test('computePickTier: an unknown manual tier is ignored, not thrown', () => {
	const result = computePickTier({ tier: 'legendary', repo: 'owner/repo' }, snapshotWith(50_000), tiers);
	assert.deepEqual(result, { tier: 'essential', source: 'stars' });
});

test('computePickTier: a custom tiers argument is used instead of the default registry', () => {
	const customTiers = [
		{ id: 'huge', label: { ko: '', en: '', jp: '' }, description: { ko: '', en: '', jp: '' }, minStars: 5 },
		{ id: 'small', label: { ko: '', en: '', jp: '' }, description: { ko: '', en: '', jp: '' }, minStars: 0 },
	];
	const result = computePickTier({ repo: 'owner/repo' }, { 'owner/repo': { stars: 5, createdAt: '', pushedAt: '', fetchedAt: '' } }, customTiers);
	assert.deepEqual(result, { tier: 'huge', source: 'stars' });
});

// --- getFreshnessBadges -----------------------------------------------------

const FIXED_NOW = new Date('2026-09-27T00:00:00Z');

test('getFreshnessBadges: checkedAt exactly 6 months ago is not flagged', () => {
	const badges = getFreshnessBadges({ checkedAt: '2026-03-27', lastActivityAt: null }, FIXED_NOW);
	assert.equal(badges.needsCheck, false);
});

test('getFreshnessBadges: checkedAt one day older than 6 months is flagged', () => {
	const badges = getFreshnessBadges({ checkedAt: '2026-03-26', lastActivityAt: null }, FIXED_NOW);
	assert.equal(badges.needsCheck, true);
});

test('getFreshnessBadges: lastActivityAt exactly 12 months ago is not stale', () => {
	const badges = getFreshnessBadges({ checkedAt: FIXED_NOW.toISOString().slice(0, 10), lastActivityAt: '2025-09-27' }, FIXED_NOW);
	assert.equal(badges.stale, false);
});

test('getFreshnessBadges: lastActivityAt one day older than 12 months is stale', () => {
	const badges = getFreshnessBadges({ checkedAt: FIXED_NOW.toISOString().slice(0, 10), lastActivityAt: '2025-09-26' }, FIXED_NOW);
	assert.equal(badges.stale, true);
});

test('getFreshnessBadges: a null lastActivityAt is never stale', () => {
	const badges = getFreshnessBadges({ checkedAt: FIXED_NOW.toISOString().slice(0, 10), lastActivityAt: null }, FIXED_NOW);
	assert.equal(badges.stale, false);
});

test('getFreshnessBadges: month-end clamping (Aug 31 minus 6 months lands on Feb 28)', () => {
	const now = new Date('2026-08-31T00:00:00Z');
	assert.equal(getFreshnessBadges({ checkedAt: '2026-02-28', lastActivityAt: null }, now).needsCheck, false);
	assert.equal(getFreshnessBadges({ checkedAt: '2026-02-27', lastActivityAt: null }, now).needsCheck, true);
});

test('getFreshnessBadges: a custom policy argument is respected', () => {
	const policy = { checkStaleMonths: 1, activityStaleMonths: 2 };
	// 1 month back from FIXED_NOW (2026-09-27) is 2026-08-27.
	assert.equal(getFreshnessBadges({ checkedAt: '2026-08-27', lastActivityAt: null }, FIXED_NOW, policy).needsCheck, false);
	assert.equal(getFreshnessBadges({ checkedAt: '2026-08-26', lastActivityAt: null }, FIXED_NOW, policy).needsCheck, true);
	// 2 months back from FIXED_NOW is 2026-07-27.
	assert.equal(
		getFreshnessBadges({ checkedAt: '2026-09-27', lastActivityAt: '2026-07-27' }, FIXED_NOW, policy).stale,
		false,
	);
	assert.equal(
		getFreshnessBadges({ checkedAt: '2026-09-27', lastActivityAt: '2026-07-26' }, FIXED_NOW, policy).stale,
		true,
	);
});

// --- getPickFacts ------------------------------------------------------------

test('getPickFacts: a manual createdAt wins over the snapshot createdAt', () => {
	const facts = getPickFacts({ createdAt: '2020-01-01', repo: 'owner/repo' }, snapshotWith(500));
	assert.equal(facts.createdAt, '2020-01-01');
});

test('getPickFacts: the snapshot pushedAt becomes lastActivityAt', () => {
	const facts = getPickFacts({ repo: 'owner/repo' }, snapshotWith(500));
	assert.equal(facts.lastActivityAt, '2026-01-01');
	assert.equal(facts.stars, 500);
	assert.equal(facts.starsAsOf, '2026-02-01');
});

test('getPickFacts: a non-repo pick has null stars, createdAt, and lastActivityAt', () => {
	const facts = getPickFacts({}, snapshotWith(500));
	assert.deepEqual(facts, { stars: null, starsAsOf: null, createdAt: null, lastActivityAt: null });
});

// --- formatStarCount ---------------------------------------------------------

test('formatStarCount formats star counts as documented', () => {
	assert.equal(formatStarCount(999), '999');
	assert.equal(formatStarCount(1000), '1k');
	assert.equal(formatStarCount(1234), '1.2k');
	assert.equal(formatStarCount(12345), '12.3k');
	assert.equal(formatStarCount(1_250_000), '1.3m');
});

// --- normalizePickUrl ---------------------------------------------------------

test('normalizePickUrl drops scheme, a leading www., trailing slash, and fragment; keeps query and path case', () => {
	assert.equal(normalizePickUrl('https://WWW.Example.com/Path/?a=1#frag'), 'example.com/Path?a=1');
});

test('normalizePickUrl treats http and https as equivalent', () => {
	assert.equal(normalizePickUrl('http://example.com/tool'), normalizePickUrl('https://example.com/tool'));
});

test('normalizePickUrl keeps host case-insensitive but path case-sensitive', () => {
	assert.equal(normalizePickUrl('https://EXAMPLE.com/CaseSensitivePath'), 'example.com/CaseSensitivePath');
});

test('normalizePickUrl keeps the query string but drops the fragment', () => {
	assert.equal(normalizePickUrl('https://example.com/tool?ref=abc#section'), 'example.com/tool?ref=abc');
});

// --- getRecentPicks -----------------------------------------------------------

function pick(id, addedAt, draft = false) {
	return { id, data: { addedAt, draft } };
}

test('getRecentPicks excludes drafts, sorts newest addedAt first, and respects the limit', () => {
	const picks = [
		pick('a', '2026-01-01'),
		pick('draft', '2026-01-10', true),
		pick('b', '2026-01-05'),
		pick('c', '2026-01-03'),
	];
	assert.deepEqual(getRecentPicks(picks, 2).map((p) => p.id), ['b', 'c']);
});

test('getRecentPicks breaks addedAt ties by id, ascending, regardless of input order', () => {
	const picks = [pick('zeta', '2026-01-01'), pick('alpha', '2026-01-01')];
	assert.deepEqual(getRecentPicks(picks, 2).map((p) => p.id), ['alpha', 'zeta']);
	// Reversed input order must produce the identical result.
	assert.deepEqual(getRecentPicks([...picks].reverse(), 2).map((p) => p.id), ['alpha', 'zeta']);
});

test('getRecentPicks defaults to the recentPicksLimit export when no limit is given', () => {
	const picks = Array.from({ length: 10 }, (_, i) => pick(`p${i}`, `2026-01-${String(i + 1).padStart(2, '0')}`));
	const result = getRecentPicks(picks);
	assert.ok(result.length <= 10);
	assert.ok(result.length > 0);
});
