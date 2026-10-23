import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
	getLatestSignalDay,
	getPublishedSignals,
	getSignalLineage,
	groupSignalsByDay,
	isPublishedRecord,
	sortSignals,
} from '../src/utils/signals.ts';
import { getLibraryTabs, getLibraryTabUrl, reservedLibrarySlugs } from '../src/utils/library-tabs.ts';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const script = 'scripts/validate-signals.mjs';

function baseData(overrides = {}) {
	return {
		id: 'case-one',
		title: 'A kept item',
		url: 'https://example.com/original',
		source: { name: 'An example source', language: 'en', kind: 'paper' },
		sourceDate: '2026-10-10',
		keptAt: '2026-10-12',
		verdict: 'try',
		why: 'One line on why it was kept.',
		authorship: 'bot',
		review: { status: 'approved', humanReviewed: true, reviewedAt: '2026-10-13', reviewer: 'owner' },
		tags: ['llm-serving'],
		...overrides,
	};
}

function withSignal(mutate, run, fileName = null) {
	const data = baseData();
	mutate(data);
	const dir = mkdtempSync(join(tmpdir(), 'signal-fixture-'));
	try {
		const contentDir = join(dir, 'src/content/signals');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, `${fileName ?? data.id}.md`), `---\n${JSON.stringify(data, null, 2)}\n---\n`);
		return run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

test('validate-signals accepts a reviewed signal, with or without a body', () => {
	withSignal(() => {}, (dir) => assertValidatorAccepts(script, dir));
});

test('validate-signals accepts a Japanese source and every verdict', () => {
	for (const verdict of ['confirmed', 'doubt', 'try']) {
		withSignal(
			(data) => {
				data.verdict = verdict;
				data.source = { name: 'An example note', language: 'ja', kind: 'article' };
			},
			(dir) => assertValidatorAccepts(script, dir),
		);
	}
});

for (const [field, value, message] of [
	['quote', 'a sentence', /forbidden field in a signal: quotes from the source/],
	['model', 'x', /model names, costs and token counts/],
	['cost', 1, /model names, costs and token counts/],
	['verificationChecks', { passed: true }, /verification-check results/],
	['score', 0.8, /private signals and scores/],
	['lineage', ['x'], /where a signal led is declared on the later explainer or post/],
	['explainers', ['x'], /where a signal led is declared on the later explainer or post/],
	['related', ['x'], /where a signal led is declared on the later explainer or post/],
	['readingState', 'unread', /a private Research OS field/],
]) {
	test(`validate-signals rejects the forbidden field "${field}"`, () => {
		withSignal(
			(data) => {
				data[field] = value;
			},
			(dir) => assertValidatorRejects(script, dir, message),
		);
	});
}

test('validate-signals rejects an unknown field (the schema is an allowlist)', () => {
	withSignal((data) => (data.summary = 'x'), (dir) => assertValidatorRejects(script, dir, /\.summary is not an allowed signal field/));
});

test('validate-signals rejects a verdict, source kind or source language outside its enum', () => {
	withSignal((data) => (data.verdict = 'maybe'), (dir) => assertValidatorRejects(script, dir, /verdict must be one of/));
	withSignal((data) => (data.source.kind = 'video'), (dir) => assertValidatorRejects(script, dir, /source\.kind must be one of/));
	withSignal((data) => (data.source.language = 'jp'), (dir) => assertValidatorRejects(script, dir, /source\.language must be one of: ko, en, ja/));
});

test('validate-signals rejects a why line over 200 characters or with a line break', () => {
	withSignal((data) => (data.why = 'x'.repeat(201)), (dir) => assertValidatorRejects(script, dir, /why must be one line of at most 200/));
	withSignal((data) => (data.why = 'a\nb'), (dir) => assertValidatorRejects(script, dir, /why must be one line/));
});

test('validate-signals rejects bad dates and a keptAt before the source existed', () => {
	withSignal((data) => (data.keptAt = '2026-13-40'), (dir) => assertValidatorRejects(script, dir, /keptAt must be YYYY-MM-DD/));
	withSignal((data) => (data.keptAt = '2026-10-01'), (dir) => assertValidatorRejects(script, dir, /is before sourceDate/));
});

test('validate-signals rejects an approved signal that is not human reviewed or still TEMP', () => {
	withSignal((data) => (data.review.humanReviewed = false), (dir) => assertValidatorRejects(script, dir, /approved but review\.humanReviewed is not true/));
	withSignal((data) => (data.title = 'TEMP: x'), (dir) => assertValidatorRejects(script, dir, /TEMP: placeholder/));
});

test('validate-signals rejects an id that differs from the file name and a non-http url', () => {
	withSignal(() => {}, (dir) => assertValidatorRejects(script, dir, /must equal the file name/), 'other-name');
	withSignal((data) => (data.url = 'ftp://example.com'), (dir) => assertValidatorRejects(script, dir, /valid http\/https URL/));
});

test('only an approved, human-reviewed signal is published', () => {
	const make = (status, humanReviewed) => ({ data: { review: { status, humanReviewed } } });
	assert.equal(isPublishedRecord(make('approved', true)), true);
	assert.equal(isPublishedRecord(make('approved', false)), false);
	assert.equal(isPublishedRecord(make('draft', true)), false);
	assert.equal(getPublishedSignals([make('approved', true), make('pending', true)]).length, 1);
});

test('signals sort newest keptAt first, ties by title, and group by day', () => {
	const s = (id, keptAt, title = id) => ({ id, data: { id, keptAt, title } });
	const list = [s('b', '2026-10-20'), s('c', '2026-10-22'), s('a', '2026-10-20'), s('d', '2026-10-22', 'a-first')];
	assert.deepEqual(sortSignals(list).map((x) => x.id), ['d', 'c', 'a', 'b']);
	const days = groupSignalsByDay(list);
	assert.deepEqual(days.map((d) => [d.day, d.signals.length]), [['2026-10-22', 2], ['2026-10-20', 2]]);
	assert.equal(getLatestSignalDay(list).day, '2026-10-22');
	assert.equal(getLatestSignalDay([]), null);
});

test('lineage is derived from the later artifacts and withholds unpublished ones', () => {
	const explainer = (id, signals, status = 'approved', humanReviewed = true, publishedAt = '2026-10-20') => ({
		id,
		data: { id, title: `e-${id}`, publishedAt, signals, review: { status, humanReviewed } },
	});
	const post = (id, signals, date) => ({ id, data: { title: `p-${id}`, pubDate: new Date(date), signals } });
	const lineage = getSignalLineage(
		'sig-1',
		[explainer('one', ['sig-1']), explainer('two', ['sig-2']), explainer('draft', ['sig-1'], 'draft'), explainer('unreviewed', ['sig-1'], 'approved', false), explainer('newer', ['sig-1'], 'approved', true, '2026-10-22')],
		[post('ko/a', ['sig-1'], '2026-10-01'), post('ko/b', [], '2026-10-02'), post('ko/c', ['sig-1'], '2026-10-05')],
	);
	assert.deepEqual(lineage.explainers.map((e) => e.id), ['newer', 'one']);
	assert.deepEqual(lineage.posts.map((p) => p.id), ['ko/c', 'ko/a']);
	assert.deepEqual(getSignalLineage('nothing', [], []), { explainers: [], posts: [] });
});

test('the signal row never stores its own lineage: the schema has no such field', () => {
	const config = readConfig();
	const block = config.slice(config.indexOf('const signals = defineCollection'), config.indexOf('const weeklyNotes'));
	assert.doesNotMatch(block, /lineage|ledTo|explainers:|posts:/);
});

test('validate-explainers and blog content reject a signals reference to a missing signal', () => {
	const dir = mkdtempSync(join(tmpdir(), 'lineage-fixture-'));
	try {
		mkdirSync(join(dir, 'src/content/blog/ko/devlog'), { recursive: true });
		writeFileSync(
			join(dir, 'src/content/blog/ko/devlog/post.md'),
			`---\ntitle: A post\ndescription: A description long enough.\npubDate: 2026-10-01\nsignals: [missing-signal]\n---\n\nBody.\n`,
		);
		assertValidatorRejects('scripts/validate-blog-content.mjs', dir, /signals references unknown signal "missing-signal"/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('library tabs: a view with nothing published is omitted, 자료 always stays', () => {
	assert.deepEqual(getLibraryTabs('ko', { signals: 0, explainers: 0, weekly: 0, resources: 0 }).map((t) => t.id), ['resources']);
	assert.deepEqual(getLibraryTabs('ko', { signals: 3, explainers: 0, weekly: 1, resources: 40 }).map((t) => t.id), ['signals', 'weekly', 'resources']);
	assert.deepEqual(getLibraryTabs('en', { signals: 1, explainers: 2, weekly: 3, resources: 4 }).map((t) => [t.id, t.href, t.count]), [
		['signals', '/en/library/signals/', 1],
		['explainers', '/en/library/explainers/', 2],
		['weekly', '/en/library/weekly/', 3],
		['resources', '/en/library/', 4],
	]);
	assert.equal(getLibraryTabUrl('jp', 'resources'), '/jp/library/');
});

test('the tab route slugs are reserved against pick sections', async () => {
	assert.deepEqual([...reservedLibrarySlugs].sort(), ['explainers', 'item', 'signals', 'weekly']);
	const { librarySections } = await import('../src/data/librarySections.ts');
	for (const section of librarySections) assert.ok(!reservedLibrarySlugs.includes(section.slug), `${section.slug} collides with a tab route`);
});

import { readFileSync } from 'node:fs';
function readConfig() {
	return readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
}
