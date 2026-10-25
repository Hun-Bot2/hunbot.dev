import assert from 'node:assert/strict';
import test from 'node:test';

import { getAreaTabs, getMonogram } from '../src/utils/library-area-tabs.ts';
import { libraryAreas } from '../src/data/libraryAreas.ts';

const items = [
	{ area: 'code' },
	{ area: 'design' },
	{ area: 'code' },
	{ area: 'other' },
	{ area: 'code' },
];

test('area tabs: 전체 first with the total, then areas that have items in registry order, 기타 last', () => {
	const tabs = getAreaTabs(items, 'ko');
	assert.deepEqual(tabs.map((t) => [t.id, t.count]), [['all', 5], ['design', 1], ['code', 3], ['other', 1]]);
	assert.equal(tabs[0].label, '전체');
	assert.equal(tabs[0].tint, null);
	assert.equal(tabs[2].label, '코드·프론트엔드');
});

test('area tabs: an area with no items has no tab, an empty list only has 전체', () => {
	assert.deepEqual(getAreaTabs([], 'en').map((t) => [t.id, t.count]), [['all', 0]]);
	assert.ok(!getAreaTabs(items, 'en').some((t) => t.id === 'learning'));
});

test('area tabs: the counts of the area tabs add up to the 전체 count', () => {
	const tabs = getAreaTabs(items, 'jp');
	assert.equal(tabs.slice(1).reduce((sum, t) => sum + t.count, 0), tabs[0].count);
});

test('every area names a tint token that exists in tokens.css (light and dark)', async () => {
	const { readFileSync } = await import('node:fs');
	const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
	const [light, dark] = css.split('html.dark {');
	for (const area of [...libraryAreas, { id: 'other', tint: 'other' }]) {
		assert.ok(light.includes(`--area-${area.tint}:`), `--area-${area.tint} missing from :root`);
		assert.ok(dark.includes(`--area-${area.tint}:`), `--area-${area.tint} missing from html.dark`);
	}
});

test('monogram: CJK names use their first character, Latin names the first two letters', () => {
	assert.equal(getMonogram('Widget'), 'Wi');
	assert.equal(getMonogram('  sample'), 'Sa');
	assert.equal(getMonogram('X'), 'X');
	assert.equal(getMonogram('한글 도구'), '한');
	assert.equal(getMonogram('3D tools'), '3');
	assert.equal(getMonogram(''), '?');
});
