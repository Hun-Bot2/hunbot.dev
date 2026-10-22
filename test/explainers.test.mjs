import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
	findPaperForExplainer,
	getExplainerUrl,
	getPublishedExplainers,
	isPublishedExplainer,
	normalizeArxivId,
	normalizeDoi,
} from '../src/utils/explainers.ts';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const script = 'scripts/validate-explainers.mjs';

function baseData(overrides = {}) {
	return {
		id: 'case-one',
		title: 'A reviewed explainer',
		dek: 'One sentence standfirst.',
		canonicalLanguage: 'ko',
		publishedAt: '2026-10-20',
		source: { name: 'An English paper', url: 'https://example.com/paper', language: 'en', kind: 'paper' },
		authorship: 'bot',
		review: { status: 'approved', humanReviewed: true, reviewedAt: '2026-10-21', reviewer: 'owner' },
		tags: ['llm-serving'],
		...overrides,
	};
}

// Each case is the base record plus exactly one stated mutation, written to a
// throwaway directory shaped like the repository (test/fixtures/README.md).
function withExplainer(mutate, run, fileName = null) {
	const data = baseData();
	mutate(data);
	const dir = mkdtempSync(join(tmpdir(), 'explainer-fixture-'));
	try {
		const contentDir = join(dir, 'src/content/explainers');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, `${fileName ?? data.id}.md`), `---\n${JSON.stringify(data, null, 2)}\n---\n\nBody text.\n`);
		return run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

test('validate-explainers accepts a reviewed, approved explainer', () => {
	withExplainer(() => {}, (dir) => assertValidatorAccepts(script, dir));
});

test('validate-explainers accepts a Japanese source that is named and linked', () => {
	withExplainer(
		(data) => {
			data.source = { name: 'An example note', url: 'https://example.com/ja/note', language: 'ja', kind: 'article' };
		},
		(dir) => assertValidatorAccepts(script, dir),
	);
});

test('validate-explainers rejects an approved entry that is not human reviewed', () => {
	withExplainer(
		(data) => {
			data.review.humanReviewed = false;
		},
		(dir) => assertValidatorRejects(script, dir, /is approved but review\.humanReviewed is not true/),
	);
});

test('validate-explainers rejects a missing source.url', () => {
	withExplainer(
		(data) => {
			delete data.source.url;
		},
		(dir) => assertValidatorRejects(script, dir, /source\.url is required/),
	);
});

test('validate-explainers rejects a Japanese source without attribution', () => {
	withExplainer(
		(data) => {
			data.source = { name: '', url: 'https://example.com/ja/note', language: 'ja', kind: 'article' };
		},
		(dir) => assertValidatorRejects(script, dir, /source\.language "ja" but no source attribution/),
	);
});

for (const [field, value, reason] of [
	['quotes', ['a quoted sentence'], /quotes from the source are not published/],
	['modelName', 'some-model', /model names, costs and token counts/],
	['cost', 0.12, /model names, costs and token counts/],
	['tokenCount', 1200, /model names, costs and token counts/],
	['verificationChecks', { passed: true }, /verification-check results/],
	['signals', { topicFit: 0.8 }, /private signals and scores/],
	['readingState', 'unread', /a private Research OS field/],
]) {
	test(`validate-explainers rejects the forbidden field "${field}"`, () => {
		withExplainer(
			(data) => {
				data[field] = value;
			},
			(dir) => assertValidatorRejects(script, dir, new RegExp(`\\.${field} is a forbidden field in an explainer: ${reason.source}`)),
		);
	});
}

test('validate-explainers rejects a forbidden field nested inside an allowlisted object', () => {
	withExplainer(
		(data) => {
			data.review.model = 'some-model';
		},
		(dir) => assertValidatorRejects(script, dir, /review\.model is a forbidden field in an explainer/),
	);
});

test('validate-explainers rejects an unknown field (the schema is an allowlist)', () => {
	withExplainer(
		(data) => {
			data.mood = 'cheerful';
		},
		(dir) => assertValidatorRejects(script, dir, /\.mood is not an allowed explainer field/),
	);
});

test('validate-explainers rejects an approved explainer that still has a TEMP: title', () => {
	withExplainer(
		(data) => {
			data.title = 'TEMP: placeholder';
		},
		(dir) => assertValidatorRejects(script, dir, /title is a TEMP: placeholder/),
	);
});

test('validate-explainers rejects an authorship value outside the enum', () => {
	withExplainer(
		(data) => {
			data.authorship = 'owner';
		},
		(dir) => assertValidatorRejects(script, dir, /authorship must be one of: bot/),
	);
});

test('validate-explainers rejects an id that differs from the file name', () => {
	withExplainer(
		() => {},
		(dir) => assertValidatorRejects(script, dir, /id "case-one" must equal the file name "another-name"/),
		'another-name',
	);
});

// ── Pure helpers ──

const approved = { data: { review: { status: 'approved', humanReviewed: true } } };
const draft = { data: { review: { status: 'draft', humanReviewed: true } } };
const pending = { data: { review: { status: 'pending', humanReviewed: false } } };

test('only an approved, human-reviewed explainer is published', () => {
	assert.equal(isPublishedExplainer(approved), true);
	assert.equal(isPublishedExplainer(draft), false);
	assert.equal(isPublishedExplainer(pending), false);
	assert.deepEqual(getPublishedExplainers([approved, draft, pending]), [approved]);
	assert.equal(isPublishedExplainer({ data: { review: { status: 'approved', humanReviewed: false } } }), false);
});

test('explainer detail URLs follow the localized route convention', () => {
	assert.equal(getExplainerUrl('ko', 'my-slug'), '/ko/library/explainers/my-slug/');
	assert.equal(getExplainerUrl('jp', 'my-slug'), '/jp/library/explainers/my-slug/');
});

test('identifier normalization strips resolver prefixes and arXiv versions', () => {
	assert.equal(normalizeDoi('https://doi.org/10.1000/ABC.1'), '10.1000/abc.1');
	assert.equal(normalizeDoi('doi:10.1000/abc.1'), '10.1000/abc.1');
	assert.equal(normalizeArxivId('arXiv:2401.01234v3'), '2401.01234');
	assert.equal(normalizeArxivId('https://arxiv.org/abs/2401.01234v2'), '2401.01234');
});

const papers = [
	{ id: 'p1', data: { title: 'Same Title', source: { externalIds: [{ scheme: 'doi', value: '10.1000/abc.1' }] } } },
	{ id: 'p2', data: { title: 'Other', source: { externalIds: [{ scheme: 'arxiv', value: '2401.01234v2' }] } } },
];

test('a paper card is found by DOI or arXiv id', () => {
	assert.equal(findPaperForExplainer({ data: { ids: { doi: 'https://doi.org/10.1000/ABC.1' } } }, papers)?.id, 'p1');
	assert.equal(findPaperForExplainer({ data: { ids: { arxiv: '2401.01234' } } }, papers)?.id, 'p2');
});

test('a paper card is never matched by title, and ids of different schemes never collide', () => {
	assert.equal(findPaperForExplainer({ data: { title: 'Same Title' } }, papers), null);
	assert.equal(findPaperForExplainer({ data: { ids: {} } }, papers), null);
	assert.equal(findPaperForExplainer({ data: { ids: { arxiv: '10.1000/abc.1' } } }, papers), null);
	assert.equal(findPaperForExplainer({ data: { ids: { doi: '10.1000/zzz' } } }, papers), null);
});
