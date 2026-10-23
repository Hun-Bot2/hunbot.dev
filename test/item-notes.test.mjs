import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildItemNoteIndex, findPageIdCollisions, getItemUrl, longestSharedRun, parseAbout } from '../src/utils/item-notes.ts';
import { reservedLibrarySlugs } from '../src/utils/reading-tabs.ts';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const script = 'scripts/validate-item-notes.mjs';
const summary = 'Playground of ready-made CSS animations with tweakable timing and keyframe export.';

test('parseAbout accepts resource:<id> and pick:<slug> only', () => {
	assert.deepEqual(parseAbout('resource:animista'), { kind: 'resource', id: 'animista' });
	assert.deepEqual(parseAbout('pick:open-kb'), { kind: 'pick', id: 'open-kb' });
	assert.equal(parseAbout('paper:x'), null);
	assert.equal(parseAbout('resource:'), null);
	assert.equal(parseAbout(undefined), null);
});

test('item URL and the reserved slug', () => {
	assert.equal(getItemUrl('ko', 'animista'), '/ko/library/item/animista/');
	assert.ok(reservedLibrarySlugs.includes('item'));
});

test('a resource id equal to a pick slug is a collision', () => {
	assert.deepEqual(findPageIdCollisions(['a', 'b'], ['b', 'c']), ['b']);
});

const resources = [
	{ data: { id: 'approved', status: 'approved', review: { humanReviewed: true } } },
	{ data: { id: 'pending', status: 'pending', review: { humanReviewed: false } } },
];
const slug = (id) => id.replace(/\.md$/, '');
const note = (about, extra = {}) => ({ data: { about, writtenAt: '2026-10-01', ...extra }, body: 'My own words.' });

test('an item has a page iff it has a published note', () => {
	const picks = [
		{ id: 'with-body.md', data: { addedAt: '2026-09-01' }, body: 'Why I keep it.' },
		{ id: 'no-body.md', data: { addedAt: '2026-09-01' }, body: '  \n' },
		{ id: 'draft-pick.md', data: { addedAt: '2026-09-01', draft: true }, body: 'Hidden.' },
	];
	const index = buildItemNoteIndex({
		notes: [
			note('resource:approved'),
			note('resource:pending'),
			note('resource:approved', { draft: true }),
			note('pick:no-body'),
			note('pick:draft-pick'),
			{ data: { about: 'resource:approved', writtenAt: '2026-10-01' }, body: '   ' },
		],
		picks,
		resources,
		pickSlug: slug,
	});
	assert.deepEqual([...index.keys()].sort(), ['approved', 'no-body', 'with-body']);
	assert.equal(index.get('with-body').origin, 'pick');
	assert.equal(index.get('approved').origin, 'note');
});

test('longestSharedRun finds a verbatim run and ignores short overlaps', () => {
	assert.ok(longestSharedRun(`Mine: ${summary} more`, summary, 40) >= summary.length);
	assert.equal(longestSharedRun('CSS animations are fine.', summary, 40), 0);
});

function withContent(files, run) {
	const dir = mkdtempSync(join(tmpdir(), 'item-notes-'));
	try {
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(join(dir, path, '..'), { recursive: true });
			writeFileSync(join(dir, path), content);
		}
		return run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const resourceFile = (extra = {}) =>
	`---\n${JSON.stringify({ id: 'animista', title: 'Animista', status: 'approved', review: { humanReviewed: true }, summary: { en: summary }, ...extra })}\n---\n`;
const noteFile = (front, body = 'In my own words, how I use it.') => `---\n${front}\n---\n\n${body}\n`;
const baseFront = "about: resource:animista\nwrittenAt: '2026-10-01'";

test('validate-item-notes accepts a note in the owner\'s own words', () => {
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/animista.md': noteFile(baseFront) }, (dir) => assertValidatorAccepts(script, dir));
});

test('validate-item-notes rejects an about that does not resolve', () => {
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/x.md': noteFile("about: resource:missing\nwrittenAt: '2026-10-01'") }, (dir) =>
		assertValidatorRejects(script, dir, /does not match any resource id/));
});

test('validate-item-notes rejects two notes for one item and an empty body', () => {
	withContent(
		{ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(baseFront), 'src/content/item-notes/b.md': noteFile(baseFront) },
		(dir) => assertValidatorRejects(script, dir, /at most one note per item/),
	);
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(baseFront, '') }, (dir) =>
		assertValidatorRejects(script, dir, /body is empty/));
});

test('validate-item-notes rejects TEMP: in a published note but not in a draft', () => {
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(baseFront, 'TEMP: later') }, (dir) =>
		assertValidatorRejects(script, dir, /may not contain TEMP:/));
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(`${baseFront}\ndraft: true`, 'TEMP: later') }, (dir) =>
		assertValidatorAccepts(script, dir));
});

test('validate-item-notes rejects a note that repeats the item summary', () => {
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(baseFront, `It is a ${summary.toLowerCase()} Fine.\n\n${summary}`) }, (dir) =>
		assertValidatorRejects(script, dir, /repeats \d+ characters of the item's en summary/));
});

test('validate-item-notes rejects a note about a pick that already has its own body, and unknown fields', () => {
	const pick = (body) => `---\ntitle: P\nurl: https://p.example\nsection: vibe-coding\nkind: tool\naddedAt: '2026-09-01'\ncheckedAt: '2026-09-01'\n---\n${body}\n`;
	withContent({ 'src/content/picks/p.md': pick('Own note.'), 'src/content/item-notes/a.md': noteFile("about: pick:p\nwrittenAt: '2026-10-01'") }, (dir) =>
		assertValidatorRejects(script, dir, /already has its own Markdown body/));
	withContent({ 'src/content/resources/animista.md': resourceFile(), 'src/content/item-notes/a.md': noteFile(`${baseFront}\nrating: 5`) }, (dir) =>
		assertValidatorRejects(script, dir, /not an allowed item-note field/));
});

test('validate-item-notes rejects a non-draft note about an unpublished resource', () => {
	withContent({ 'src/content/resources/animista.md': resourceFile({ status: 'pending' }), 'src/content/item-notes/a.md': noteFile(baseFront) }, (dir) =>
		assertValidatorRejects(script, dir, /not a published resource/));
});
