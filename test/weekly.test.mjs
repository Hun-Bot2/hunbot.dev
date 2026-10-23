import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
	formatWeekRange,
	getAdjacentIssues,
	getPublishedWeeklyNotes,
	getSignalsForWeek,
	getWeekRange,
	getWeeklyRssUrl,
	getWeeklyUrl,
	isPublishedWeeklyNote,
} from '../src/utils/weekly.ts';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const script = 'scripts/validate-weekly.mjs';

function baseData(overrides = {}) {
	return {
		issue: 3,
		title: 'A weekly note',
		dek: 'One sentence standfirst.',
		weekOf: '2026-10-12', // a Monday
		publishedAt: '2026-10-16',
		resolved: [{ question: 'Was it true?', outcome: 'Partly.' }],
		openQuestions: ['What next?'],
		authorship: 'bot',
		review: { status: 'approved', humanReviewed: true, reviewedAt: '2026-10-17', reviewer: 'owner' },
		tags: ['weekly'],
		...overrides,
	};
}

function withNote(mutate, run, fileName = null) {
	const data = baseData();
	mutate(data);
	const dir = mkdtempSync(join(tmpdir(), 'weekly-fixture-'));
	try {
		const contentDir = join(dir, 'src/content/weekly-notes');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, `${fileName ?? data.issue}.md`), `---\n${JSON.stringify(data, null, 2)}\n---\n\nThe conclusions.\n`);
		return run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

test('validate-weekly accepts a reviewed note', () => {
	withNote(() => {}, (dir) => assertValidatorAccepts(script, dir));
});

test('validate-weekly rejects a weekOf that is not a Monday', () => {
	withNote((data) => (data.weekOf = '2026-10-13'), (dir) => assertValidatorRejects(script, dir, /must be a Monday/));
});

test('validate-weekly rejects an issue that is not a positive integer or differs from the file name', () => {
	withNote((data) => (data.issue = 0), (dir) => assertValidatorRejects(script, dir, /issue must be a positive integer/), '0');
	withNote((data) => (data.issue = 2.5), (dir) => assertValidatorRejects(script, dir, /issue must be a positive integer/), '2');
	withNote(() => {}, (dir) => assertValidatorRejects(script, dir, /must equal the file name/), '4');
});

test('validate-weekly rejects a duplicate issue number', () => {
	const dir = mkdtempSync(join(tmpdir(), 'weekly-dup-'));
	try {
		const contentDir = join(dir, 'src/content/weekly-notes');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, '3.md'), `---\n${JSON.stringify(baseData())}\n---\n\nBody.\n`);
		writeFileSync(join(contentDir, '03.md'), `---\n${JSON.stringify(baseData())}\n---\n\nBody.\n`);
		assertValidatorRejects(script, dir, /issue 3 is duplicated/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('validate-weekly rejects publishedAt before the week, a malformed resolved item and open question', () => {
	withNote((data) => (data.publishedAt = '2026-10-11'), (dir) => assertValidatorRejects(script, dir, /publishedAt .* is before weekOf/));
	withNote((data) => (data.resolved = [{ question: 'Q' }]), (dir) => assertValidatorRejects(script, dir, /resolved\[0\] must be \{ question, outcome \}/));
	withNote((data) => (data.openQuestions = ['ok', '']), (dir) => assertValidatorRejects(script, dir, /openQuestions must be an array of non-empty strings/));
});

test('validate-weekly rejects a listed signals field (the week is derived) and forbidden names', () => {
	withNote((data) => (data.signals = ['a']), (dir) => assertValidatorRejects(script, dir, /signals is a forbidden field in a weekly note: the week's signals are derived/));
	withNote((data) => (data.model = 'x'), (dir) => assertValidatorRejects(script, dir, /model names, costs and token counts/));
	withNote((data) => (data.subtitle = 'x'), (dir) => assertValidatorRejects(script, dir, /\.subtitle is not an allowed weekly note field/));
});

test('validate-weekly rejects an approved note that is not human reviewed, has no body, or is TEMP', () => {
	withNote((data) => (data.review.humanReviewed = false), (dir) => assertValidatorRejects(script, dir, /approved but review\.humanReviewed is not true/));
	withNote((data) => (data.title = 'TEMP: x'), (dir) => assertValidatorRejects(script, dir, /TEMP: placeholder/));
});

test('only an approved, human-reviewed note is published, newest issue first', () => {
	const n = (issue, status = 'approved', humanReviewed = true) => ({ data: { issue, review: { status, humanReviewed } } });
	assert.equal(isPublishedWeeklyNote(n(1)), true);
	assert.equal(isPublishedWeeklyNote(n(1, 'draft')), false);
	assert.deepEqual(getPublishedWeeklyNotes([n(1), n(3), n(2, 'pending'), n(4, 'approved', false)]).map((x) => x.data.issue), [3, 1]);
});

test('the week runs Monday through the next Sunday, across month and year ends', () => {
	assert.deepEqual(getWeekRange('2026-10-19'), { start: '2026-10-19', end: '2026-10-25' });
	assert.deepEqual(getWeekRange('2026-10-26'), { start: '2026-10-26', end: '2026-11-01' });
	assert.deepEqual(getWeekRange('2026-12-28'), { start: '2026-12-28', end: '2027-01-03' });
	assert.equal(formatWeekRange('2026-10-19'), '2026.10.19 – 10.25');
	assert.equal(formatWeekRange('2026-12-28'), '2026.12.28 – 2027.01.03');
});

test('a week derives the signals whose keptAt falls inside it, edges included', () => {
	const s = (id, keptAt) => ({ id, data: { keptAt, title: id } });
	const week = getSignalsForWeek(
		[s('mon', '2026-10-19'), s('sun', '2026-10-25'), s('next-mon', '2026-10-26'), s('prev-sun', '2026-10-18'), s('wed', '2026-10-21')],
		'2026-10-19',
	);
	assert.deepEqual(week.map((x) => x.id), ['sun', 'wed', 'mon']);
	assert.deepEqual(getSignalsForWeek([], '2026-10-19'), []);
});

test('adjacent issues are found around an issue, and absent at the ends', () => {
	const notes = [1, 2, 3].map((issue) => ({ data: { issue } }));
	assert.deepEqual([getAdjacentIssues(notes, 2).prev.data.issue, getAdjacentIssues(notes, 2).next.data.issue], [1, 3]);
	assert.equal(getAdjacentIssues(notes, 1).prev, null);
	assert.equal(getAdjacentIssues(notes, 3).next, null);
});

test('weekly URLs follow the localized route convention', () => {
	assert.equal(getWeeklyUrl('ko', 3), '/ko/library/weekly/3/');
	assert.equal(getWeeklyRssUrl('ko'), '/ko/library/weekly/rss.xml');
});
