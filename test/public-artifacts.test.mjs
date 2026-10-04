// Tests for the public artifact contract (contracts/public-artifact/), its
// adapters (src/utils/artifacts/adapters.ts), its validator
// (src/utils/artifacts/validate.ts), and scripts/validate-artifacts.mjs.
//
// Unit tests build exports in memory. The script tests run the real
// validator against the real repo and against a temporary fixture directory
// generated at test time (the same approach as test/helpers/contract-fixture.mjs:
// generated, not committed, so fixtures cannot drift from the real contract).
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { astroEntryId } from '../scripts/lib/read-artifact-sources.mjs';
import { buildHunbotArtifactExport, resolveArtifactDomain } from '../src/utils/artifacts/adapters.ts';
import { checkSchemaMatchesVocabulary, compareDates, validateArtifactExports } from '../src/utils/artifacts/validate.ts';
import { repoRoot } from './helpers/contract-fixture.mjs';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const SCHEMA_PATH = join(repoRoot, 'contracts/public-artifact/public-artifact.schema.json');
const VALIDATOR = 'scripts/validate-artifacts.mjs';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const topics = [
	topic('speech-ai', null),
	topic('asr', 'speech-ai', { aliases: ['speech-recognition'] }),
	topic('agents', null),
	topic('old-agents', null, { status: 'archived', mergedInto: 'agents' }),
];

function topic(id, parent, extra = {}) {
	return { id, data: { id, status: 'active', parent, aliases: [], mergedInto: null, ...extra } };
}

function artifact(overrides = {}) {
	return {
		id: 'writing:devlog/asr-notes',
		kind: 'writing',
		domain: 'build',
		domainsAlso: [],
		title: { ko: 'ASR 노트' },
		summary: null,
		time: { start: '2025-04-02' },
		state: 'published',
		topics: [],
		href: { ko: '/ko/blog/devlog/asr-notes/' },
		externalUrl: null,
		landmark: false,
		addedAt: '2025-04-02',
		origin: 'hunbot',
		sourceRef: null,
		...overrides,
	};
}

const project = (overrides = {}) =>
	artifact({
		id: 'project:asr-pipeline',
		kind: 'project',
		domain: 'build',
		title: { ko: 'ASR 파이프라인' },
		time: { start: '2025-03', end: null },
		state: 'ongoing',
		href: { ko: '/ko/projects/asr-pipeline/' },
		addedAt: '2025-03-01',
		...overrides,
	});

const paper = (overrides = {}) =>
	artifact({
		id: 'paper:whisper',
		kind: 'paper',
		domain: 'learn',
		title: { original: 'Robust Speech Recognition via Large-Scale Weak Supervision' },
		time: { start: '2025-02-10' },
		state: 'studied',
		topics: ['asr'],
		href: { ko: '/ko/research/#paper-whisper', en: '/en/research/#paper-whisper', jp: '/jp/research/#paper-whisper' },
		externalUrl: 'https://arxiv.org/abs/2212.04356',
		addedAt: '2025-02-10',
		...overrides,
	});

function exportOf(producer, { artifacts = [], relations = [], aggregates = [] } = {}) {
	return { contractVersion: 1, producer, generatedAt: '2026-10-04T00:00:00.000Z', artifacts, relations, aggregates };
}

function validate(...exports) {
	return validateArtifactExports(
		exports.map((value, index) => ({ label: `export${index}`, value })),
		{ topics },
	);
}

function assertRejects(result, pattern) {
	assert.ok(
		result.errors.some((error) => pattern.test(error)),
		`Expected an error matching ${pattern}, got:\n${result.errors.join('\n') || '(no errors)'}`,
	);
}

function assertClean(result) {
	assert.deepEqual(result.errors, [], result.errors.join('\n'));
}

const baseSet = () => [paper(), project(), artifact()];

// ---------------------------------------------------------------------------
// domain resolution
// ---------------------------------------------------------------------------

test('domain: explicit > override > category map > kind default', () => {
	const tables = { overrides: { 'writing:a': 'learn' }, categories: { devlog: 'build' } };

	assert.deepEqual(resolveArtifactDomain({ id: 'writing:a', kind: 'writing', explicit: 'create', category: 'devlog' }, tables), {
		domain: 'create',
		basis: 'explicit',
	});
	assert.deepEqual(resolveArtifactDomain({ id: 'writing:a', kind: 'writing', category: 'devlog' }, tables), {
		domain: 'learn',
		basis: 'override',
	});
	assert.deepEqual(resolveArtifactDomain({ id: 'writing:b', kind: 'writing', category: ' DevLog ' }, tables), {
		domain: 'build',
		basis: 'category',
	});
	// Writing falls back to Learn: Create is reserved for genuinely creative artifacts.
	assert.deepEqual(resolveArtifactDomain({ id: 'writing:c', kind: 'writing', category: 'unknown-cat' }, tables), {
		domain: 'learn',
		basis: 'kind-default',
	});
	// The category map applies to writing only.
	assert.deepEqual(resolveArtifactDomain({ id: 'paper:x', kind: 'paper', category: 'devlog' }, tables), {
		domain: 'learn',
		basis: 'kind-default',
	});
});

// ---------------------------------------------------------------------------
// adapters
// ---------------------------------------------------------------------------

function sourceFixture() {
	const post = (id, data) => ({
		id,
		data: { description: 'A real description', tags: [], papers: [], draft: false, ...data },
	});
	return {
		blog: [
			post('ko/devlog/asr-notes', { title: 'ASR 노트', pubDate: new Date('2025-04-02'), category: 'devlog', papers: ['whisper'] }),
			post('en/devlog/asr-notes', { title: 'ASR notes', pubDate: new Date('2025-04-05'), category: 'devlog' }),
			post('ko/devlog/draft-post', { title: '초안', pubDate: new Date('2025-05-01'), category: 'devlog', draft: true }),
			post('ko/notes/template', { title: '템플릿', pubDate: new Date('2025-05-02'), category: 'category' }),
			post('ko/notes/new-cat', { title: '새 분류', pubDate: new Date('2025-05-03'), category: 'Brand-New', papers: ['pending-paper'] }),
		],
		academicReviews: [
			{ id: 'ko/papers/whisper-review', data: { title: 'Whisper 리뷰', pubDate: new Date('2025-02-20'), draft: false, paperId: 'whisper' } },
			{ id: 'ko/papers/draft-review', data: { title: '초안 리뷰', pubDate: new Date('2025-02-21'), draft: true, paperId: 'whisper' } },
		],
		papers: [
			{
				id: 'whisper',
				data: {
					id: 'whisper',
					itemId: 'itm-01jabcdefghjkmnpqrstvwxyz0',
					title: 'Robust Speech Recognition via Large-Scale Weak Supervision',
					url: 'https://arxiv.org/abs/2212.04356',
					topics: ['speech-recognition', 'old-agents', 'no-such-topic'],
					status: 'approved',
					review: { humanReviewed: true, reviewedAt: '2025-01-15' },
					source: { firstSeenAt: '2025-01-10' },
					summary: { ko: { tldr: '대규모 약지도 음성 인식' } },
					studiedAt: '2025-02-10',
				},
			},
			{
				id: 'pending-paper',
				data: {
					id: 'pending-paper',
					itemId: 'itm-01jabcdefghjkmnpqrstvwxyz1',
					title: 'Pending',
					url: 'https://example.com/p',
					status: 'pending',
					review: { humanReviewed: false },
					source: { firstSeenAt: '2025-01-10' },
					studiedAt: null,
				},
			},
		],
		picks: [
			{ id: 'openkb', data: { title: 'OpenKB', url: 'https://github.com/VectifyAI/OpenKB', section: 'vibe-coding', addedAt: '2026-09-27', draft: false } },
			{ id: 'awwwards', data: { title: 'Awwwards', url: 'https://www.awwwards.com/', section: 'design', addedAt: new Date('2026-09-27'), draft: true } },
		],
		resources: [],
		topics,
	};
}

test('adapters: translations sharing a slug become one writing artifact', () => {
	const { export: result } = buildHunbotArtifactExport(sourceFixture(), { generatedAt: '2026-10-04T00:00:00.000Z' });
	const writing = result.artifacts.find((entry) => entry.id === 'writing:devlog/asr-notes');

	assert.deepEqual(writing.title, { ko: 'ASR 노트', en: 'ASR notes' });
	assert.deepEqual(writing.href, { ko: '/ko/blog/devlog/asr-notes/', en: '/en/blog/devlog/asr-notes/' });
	assert.equal(writing.time.start, '2025-04-02', 'the Korean original sets the date');
	assert.equal(writing.domain, 'build');
	assert.equal('end' in writing.time, false, 'point kinds carry no end');
});

test('adapters: unpublished entries never become artifacts', () => {
	const { export: result } = buildHunbotArtifactExport(sourceFixture());
	const ids = result.artifacts.map((entry) => entry.id);

	assert.ok(!ids.includes('writing:devlog/draft-post'), 'draft post');
	assert.ok(!ids.includes('writing:notes/template'), 'placeholder-category post (getAllPosts quality gate)');
	assert.ok(!ids.includes('review:papers/draft-review'), 'draft review');
	assert.ok(!ids.includes('paper:pending-paper'), 'unapproved paper');
	assert.ok(!ids.includes('resource:awwwards'), 'draft pick');
	assert.deepEqual(ids, ['paper:whisper', 'resource:openkb', 'review:papers/whisper-review', 'writing:devlog/asr-notes', 'writing:notes/new-cat']);
});

test('adapters: paper maps itemId to opaque sourceRef and resolves topics', () => {
	const { export: result, report } = buildHunbotArtifactExport(sourceFixture());
	const mapped = result.artifacts.find((entry) => entry.id === 'paper:whisper');

	assert.equal(mapped.sourceRef, 'itm-01jabcdefghjkmnpqrstvwxyz0');
	assert.deepEqual(mapped.href, {
		ko: '/ko/research/#paper-whisper',
		en: '/en/research/#paper-whisper',
		jp: '/jp/research/#paper-whisper',
	}, 'links straight to the paper row anchor, not the top of the hub');
	assert.deepEqual(mapped.title, { original: 'Robust Speech Recognition via Large-Scale Weak Supervision' });
	assert.equal(mapped.state, 'studied');
	assert.equal(mapped.time.start, '2025-02-10');
	assert.deepEqual(mapped.topics, ['asr', 'agents'], 'alias and merged topic resolve to active ids');
	assert.deepEqual(report.unresolvedTopics, [{ artifact: 'paper:whisper', topic: 'no-such-topic' }]);
});

test('adapters: declared links become relations; links to unpublished items are withheld', () => {
	const { export: result, report } = buildHunbotArtifactExport(sourceFixture());

	assert.deepEqual(result.relations, [
		{ from: 'review:papers/whisper-review', to: 'paper:whisper', rel: 'explains', basis: 'declared' },
		{ from: 'writing:devlog/asr-notes', to: 'paper:whisper', rel: 'explains', basis: 'declared' },
	]);
	assert.equal(report.withheldRelations.length, 1);
	assert.equal(report.withheldRelations[0].to, 'paper:pending-paper');
	assert.match(report.withheldRelations[0].reason, /not a published artifact/);
});

test('adapters: an unmapped category falls back to Learn and is reported', () => {
	const { export: result, report } = buildHunbotArtifactExport(sourceFixture());

	assert.equal(result.artifacts.find((entry) => entry.id === 'writing:notes/new-cat').domain, 'learn');
	assert.deepEqual(report.unmappedCategories, { 'brand-new': 1 });
});

test('reflective blog categories map to Learn, never Create', async () => {
	const { blogCategoryDomains } = await import('../src/data/artifactDomains.ts');
	for (const category of ['thoughts', 'contemplation', 'retrospective', 'career', 'misc']) {
		assert.equal(blogCategoryDomains[category], 'learn', category);
	}
	assert.ok(!Object.values(blogCategoryDomains).includes('create'), 'no blog category maps to Create');
});

test('paper anchors: PaperRow and the adapter share one helper', async () => {
	const { getPaperAnchorId, getPaperUrl } = await import('../src/utils/library.ts');
	assert.equal(getPaperAnchorId('whisper'), 'paper-whisper');
	assert.equal(getPaperUrl('jp', 'whisper'), '/jp/research/#paper-whisper');
	const row = readFileSync(join(repoRoot, 'src/components/research/PaperRow.astro'), 'utf8');
	assert.match(row, /id=\{getPaperAnchorId\(paper\.data\.id\)\}/);
});

test('adapters: every emitted artifact carries an explicit domain and the export validates', () => {
	const { export: result } = buildHunbotArtifactExport(sourceFixture());
	for (const entry of result.artifacts) assert.ok(entry.domain, `${entry.id} has a domain`);
	assertClean(validate(result));
});

test('astroEntryId matches the Astro glob loader', () => {
	assert.equal(astroEntryId('ko/devlog/BLOG/Blog_Develop_11.mdx'), 'ko/devlog/blog/blog_develop_11');
	assert.equal(astroEntryId('ko/notes/Hello World!.md'), 'ko/notes/hello-world');
	assert.equal(astroEntryId('ko/notes/index.md'), 'ko/notes');
	assert.equal(astroEntryId('ko/notes/x.md', { slug: 'custom/slug' }), 'custom/slug');
});

// ---------------------------------------------------------------------------
// validator: artifacts
// ---------------------------------------------------------------------------

test('validator accepts a well-formed set', () => {
	assertClean(validate(exportOf('hunbot', { artifacts: baseSet() })));
});

test('validator rejects an artifact without an explicit resolved domain', () => {
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ domain: undefined })] })), /domain must be an explicit, resolved domain/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ domain: 'misc' })] })), /domain must be an explicit, resolved domain/);
});

test('validator rejects unknown fields, bad ids, external hrefs, and unresolved topics', () => {
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ score: 5 })] })), /unknown field "score"/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ id: 'paper:devlog/asr-notes' })] })), /id must be "writing:<local id>"/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ id: 'writing:Devlog/ASR' })] })), /lowercase local id/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ href: { ko: 'https://example.com/' } })] })), /internal path/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ href: { ko: '/ko/research/#' } })] })), /optionally followed by "#<anchor>"/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ href: { ko: '/ko/research/#a#b' } })] })), /optionally followed by "#<anchor>"/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ href: { ko: '/ko/research#paper-x' } })] })), /internal path/);
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [paper({ topics: ['speech-recognition'] })] })),
		/topic "speech-recognition" is not an active topic id/,
	);
});

test('validator enforces point vs span time shapes', () => {
	assertRejects(validate(exportOf('hunbot', { artifacts: [project({ time: { start: '2025-03' } })] })), /time\.end is required on span kinds/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ time: { start: '2025-03-01', end: null } })] })), /only allowed on span kinds/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [project({ time: { start: '2025-03', end: '2025-01' } })] })), /time\.end is before time\.start/);
	assertRejects(validate(exportOf('hunbot', { artifacts: [artifact({ time: { start: '2025-02-30' } })] })), /time\.start must be/);
});

test('validator rejects a producer emitting a kind it does not own, and cross-producer id clashes', () => {
	assertRejects(validate(exportOf('research-os', { artifacts: [artifact({ origin: 'research-os' })] })), /may not emit kind "writing"/);
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [paper()] }), exportOf('research-os', { artifacts: [paper({ origin: 'research-os' })] })),
		/duplicate artifact id — already emitted by export0/,
	);
});

// ---------------------------------------------------------------------------
// validator: relations (invalid and unverified)
// ---------------------------------------------------------------------------

const withRelations = (relations, producer = 'hunbot') => validate(exportOf(producer, { artifacts: baseSet(), relations }));

test('validator rejects relatedTo in every spelling', () => {
	for (const rel of ['relatedTo', 'related_to', 'related-to', 'RelatedTo']) {
		assertRejects(
			withRelations([{ from: 'paper:whisper', to: 'project:asr-pipeline', rel, basis: 'declared' }]),
			/is never public: unverified relatedness does not become a lineage edge/,
		);
	}
});

test('validator rejects unverified bases (candidate, claimed, inferred, …)', () => {
	for (const basis of ['candidate', 'claimed', 'inferred', 'proposed', 'unverified']) {
		assertRejects(
			withRelations([{ from: 'paper:whisper', to: 'project:asr-pipeline', rel: 'informed', basis }]),
			new RegExp(`basis "${basis}" is never public`),
		);
	}
});

test('validator enforces which basis each relation may have and who may verify', () => {
	assertRejects(
		withRelations([{ from: 'paper:whisper', to: 'project:asr-pipeline', rel: 'informed', basis: 'verified' }]),
		/"informed" relations must be declared, not verified/,
	);
	// cites is bibliographic: never hand-declared, and Hun-Bot cannot attest it.
	const second = paper({ id: 'paper:wav2vec', title: { original: 'wav2vec 2.0' } });
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [paper(), second], relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'cites', basis: 'declared' }] })),
		/"cites" relations must be verified, not declared/,
	);
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [paper(), second], relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'cites', basis: 'verified' }] })),
		/producer "hunbot" cannot attest a verified "cites" relation/,
	);
	assertClean(
		validate(
			exportOf('research-os', {
				artifacts: [paper({ origin: 'research-os' }), { ...second, origin: 'research-os' }],
				relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'cites', basis: 'verified' }],
			}),
		),
	);
});

test('validator rejects unknown relations, dangling endpoints, wrong kind pairs, and self-loops', () => {
	assertRejects(withRelations([{ from: 'paper:whisper', to: 'project:asr-pipeline', rel: 'inspired', basis: 'declared' }]), /unknown relation "inspired"/);
	assertRejects(withRelations([{ from: 'paper:missing', to: 'project:asr-pipeline', rel: 'informed', basis: 'declared' }]), /from "paper:missing" is not a public artifact/);
	assertRejects(withRelations([{ from: 'paper:whisper', to: 'writing:devlog/asr-notes', rel: 'explains', basis: 'declared' }]), /"explains" cannot start at a paper/);
	assertRejects(withRelations([{ from: 'project:asr-pipeline', to: 'project:asr-pipeline', rel: 'developedInto', basis: 'declared' }]), /cannot point at its own artifact/);
});

test('validator enforces time order per relation', () => {
	// A writing dated 2025-04-02 cannot have "informed" a project that ended in 2025-03.
	const ended = project({ time: { start: '2025-01', end: '2025-03' }, state: 'finished' });
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [ended, artifact()], relations: [{ from: 'writing:devlog/asr-notes', to: 'project:asr-pipeline', rel: 'informed', basis: 'declared' }] })),
		/time order: writing:devlog\/asr-notes \(2025-04-02\) starts after project:asr-pipeline ended \(2025-03\)/,
	);
	// …but it can inform an ongoing one.
	assertClean(withRelations([{ from: 'writing:devlog/asr-notes', to: 'project:asr-pipeline', rel: 'informed', basis: 'declared' }]));
	// resultedIn: the result cannot predate its source.
	const late = project({ time: { start: '2025-06', end: null } });
	assertRejects(
		validate(exportOf('hunbot', { artifacts: [late, artifact()], relations: [{ from: 'project:asr-pipeline', to: 'writing:devlog/asr-notes', rel: 'resultedIn', basis: 'declared' }] })),
		/time order: writing:devlog\/asr-notes \(2025-04-02\) starts before project:asr-pipeline \(2025-06\)/,
	);
	// explains has no time rule: a post can explain a later project.
	assertClean(withRelations([{ from: 'writing:devlog/asr-notes', to: 'project:asr-pipeline', rel: 'explains', basis: 'declared' }]));
});

test('validator rejects duplicate relations', () => {
	const edge = { from: 'paper:whisper', to: 'project:asr-pipeline', rel: 'informed', basis: 'declared' };
	assertRejects(withRelations([edge, { ...edge }]), /duplicate relation/);
});

// ---------------------------------------------------------------------------
// validator: aggregates
// ---------------------------------------------------------------------------

const aggregate = (overrides = {}) => ({ period: '2025-03', topic: 'speech-ai', stage: 'selected', count: 38, coverage: 'complete', ...overrides });
const withAggregates = (aggregates) => validate(exportOf('research-os', { aggregates }));

test('aggregates: top-level topics or null only', () => {
	assertClean(withAggregates([aggregate(), aggregate({ topic: null, stage: 'discovered', count: 1240 })]));
	assertRejects(withAggregates([aggregate({ topic: 'asr' })]), /not top-level: aggregates are published for top-level topics only/);
	assertRejects(withAggregates([aggregate({ topic: 'no-such' })]), /not an active topic id/);
});

test('aggregates: unknown is null, never zero, and never "complete"', () => {
	assertClean(withAggregates([aggregate({ count: null, coverage: 'unknown' })]));
	assertRejects(withAggregates([aggregate({ count: null, coverage: 'complete' })]), /null \(unknown\) count cannot have complete coverage/);
	assertRejects(withAggregates([aggregate({ count: -1 })]), /non-negative integer/);
	assertRejects(withAggregates([aggregate({ period: '2025-3' })]), /period must be YYYY-MM/);
});

test('aggregates: unknown stages are ignored with a warning (extensible), duplicates rejected', () => {
	const result = withAggregates([aggregate({ stage: 'annotated' })]);
	assertClean(result);
	assert.equal(result.aggregates.length, 0);
	assert.match(result.warnings[0], /stage "annotated" is not known to this build and is ignored/);
	assertRejects(withAggregates([aggregate(), aggregate()]), /duplicate \(period, topic, stage\) cell/);
});

test('envelope: unsupported contract version is rejected', () => {
	assertRejects(validate({ ...exportOf('hunbot'), contractVersion: 2 }), /contractVersion 2 is not supported/);
});

test('compareDates compares at the coarser precision', () => {
	assert.equal(compareDates('2025-03', '2025-03-31'), 0);
	assert.equal(compareDates('2025-03-01', '2025-04'), -1);
});

// ---------------------------------------------------------------------------
// schema ⇄ vocabulary
// ---------------------------------------------------------------------------

test('the JSON Schema matches the vocabulary registry', () => {
	assert.deepEqual(checkSchemaMatchesVocabulary(JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))), []);
});

test('schema drift is detected, including a relatedTo slipped into the relation enum', () => {
	const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
	schema.$defs.relation.properties.rel.enum.push('relatedTo');
	const errors = checkSchemaMatchesVocabulary(schema);
	assert.ok(errors.some((error) => /rel\.enum/.test(error)));
	assert.ok(errors.some((error) => /contains the value "relatedTo"/.test(error)));
});

// ---------------------------------------------------------------------------
// scripts/validate-artifacts.mjs end to end
// ---------------------------------------------------------------------------

test('validate-artifacts accepts the real repository', () => {
	assertValidatorAccepts(VALIDATOR, repoRoot);
});

function withResearchOsExport(exportValue, run) {
	const dir = mkdtempSync(join(tmpdir(), 'public-artifacts-'));
	try {
		mkdirSync(join(dir, 'contracts/public-artifact'), { recursive: true });
		cpSync(SCHEMA_PATH, join(dir, 'contracts/public-artifact/public-artifact.schema.json'));
		mkdirSync(join(dir, 'src/content/topics'), { recursive: true });
		writeFileSync(
			join(dir, 'src/content/topics/speech-ai.md'),
			`---\n${JSON.stringify({ id: 'speech-ai', status: 'active', parent: null, aliases: [] })}\n---\n`,
		);
		mkdirSync(join(dir, 'src/data/research-os-export'), { recursive: true });
		writeFileSync(join(dir, 'src/data/research-os-export/public-artifacts.json'), JSON.stringify(exportValue));
		run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

test('validate-artifacts accepts a valid Research OS export', () => {
	const second = paper({ id: 'paper:wav2vec', title: { original: 'wav2vec 2.0' }, topics: [], origin: 'research-os' });
	withResearchOsExport(
		exportOf('research-os', {
			artifacts: [paper({ topics: [], origin: 'research-os' }), second],
			relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'cites', basis: 'verified' }],
			aggregates: [aggregate()],
		}),
		(dir) => assertValidatorAccepts(VALIDATOR, dir),
	);
});

test('validate-artifacts fails the build on a Research OS export carrying relatedTo or a candidate edge', () => {
	const artifacts = [paper({ topics: [], origin: 'research-os' }), paper({ id: 'paper:wav2vec', topics: [], origin: 'research-os' })];
	withResearchOsExport(
		exportOf('research-os', { artifacts, relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'relatedTo', basis: 'declared' }] }),
		(dir) => assertValidatorRejects(VALIDATOR, dir, /relation "relatedTo" is never public/),
	);
	withResearchOsExport(
		exportOf('research-os', { artifacts, relations: [{ from: 'paper:whisper', to: 'paper:wav2vec', rel: 'cites', basis: 'candidate' }] }),
		(dir) => assertValidatorRejects(VALIDATOR, dir, /basis "candidate" is never public/),
	);
});
