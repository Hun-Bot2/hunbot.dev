import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, 'fixtures/validate-library');

test('validate-library rejects an unrecognized contentType', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'unknown-content-type'),
		/contentType "not-a-real-type" is not a recognized content type/,
	);
});

test('validate-library rejects an approved item missing its canonical-language summary', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'missing-canonical-language-summary'),
		/is approved but summary\.en \(its canonical language\) is missing/,
	);
});

test('validate-library rejects a depth value outside the closed four-value enum', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'invalid-depth'),
		/depth "expert" must be one of: beginner, practical, engineering, research/,
	);
});

test('validate-library rejects a venue reference that matches no registry id or alias', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'unknown-venue-id'),
		/venue references unknown venue "not-a-real-venue"\. Add it to src\/data\/venues\.ts/,
	);
});

test('validate-library rejects a venue reference that only matches an alias, not the canonical id', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'venue-alias-reference'),
		/references venue "ICLR", which is an alias, not a registry id\. Use "iclr" instead/,
	);
});

test('validate-library accepts a topic reference that resolves only through an alias', () => {
	// src/content/topics/ai-agents.md was renamed to agents.md with
	// aliases: ["ai-agents"]; sample-paper-card.md and
	// sample-vibe-coding-resource.md still reference "ai-agents" by that
	// alias in the real repo. Alias-aware resolution
	// (scripts/lib/topic-resolution.mjs) must keep accepting that reference.
	assertValidatorAccepts(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'topic-alias-reference-resolves'),
	);
});

test('validate-library rejects a topic reference that resolves through no id, alias, or merge chain', () => {
	// The other direction of alias-aware resolution: accepting aliases must
	// not relax into accepting anything.
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'unresolvable-topic-reference'),
		/relatedTopics references unknown topic "genuinely-unknown-topic"/,
	);
});

// T09 — papers schema migration (docs/decisions/research-item-identity.md).
// Five migration fixtures, per the task packet's minimum: conflated
// provenance/honors, missing canonical id, malformed DOI, an unevidenced
// "VERIFIED" claim standing in for the private-only same_work_as-without-
// evidence case, and an unknown venue id (covered above by the pre-existing
// 'unknown-venue-id' fixture, now migrated to the new schema).

test('validate-library rejects an honors entry that conflates an acceptanceStatus value', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'paper-conflated-honors'),
		/honors contains "accepted", which is not a recognized honor/,
	);
});

test('validate-library rejects a paper missing its canonical itemId', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'paper-missing-item-id'),
		/itemId is required and must match "itm-" followed by 26 lowercase Crockford-base32 characters/,
	);
});

test('validate-library rejects a malformed DOI in source.externalIds', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'paper-malformed-doi'),
		/is not a well-formed DOI/,
	);
});

test('validate-library rejects provenance "VERIFIED" asserted without a resolvable venue', () => {
	// VERIFIED is not assignable by assertion
	// (docs/decisions/research-item-identity.md#Status-History-And-Provenance-Tier):
	// being human-reviewed is not, by itself, evidence. This fixture is a
	// public-projection stand-in for the private-only same_work_as-without-
	// evidence case: sameWorkAs itself belongs only to the private canonical
	// item and must never appear in src/content/papers/ (see the handoff).
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'paper-verified-without-evidence'),
		/has provenance "VERIFIED" but venue "not-a-real-venue-xyz" does not resolve to a venue registry id/,
	);
});

// T10 — boundary validator hardening
// (docs/decisions/research-os-data-contract.md, "Validator Invariants,
// Checkable Today": INV-01, INV-02, INV-03). Field-name lists are read from
// contracts/research-os/research-item.schema.json's x-contract block, not
// retyped here.

test('validate-library still rejects the original five forbidden names (regression)', () => {
	// A silent regression here — the extended forbiddenFieldNames set
	// dropping a legacy name while gaining new ones — would be the worst
	// outcome this task could produce.
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'legacy-name-still-forbidden'),
		/rawHtml is forbidden in public Library content\./,
	);
});

test('validate-library rejects a T01/T02 corpus-only field name, even nested', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'forbidden-corpus-field-in-paper'),
		/source\.fieldSources is forbidden in public Library content — it is corpus-only data \(docs\/decisions\/research-os-data-contract\.md, INV-01\)/,
	);
});

test('validate-library rejects a personal-state field name with a message distinct from a corpus-shaped one', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'forbidden-personal-state-field-in-resource'),
		/readingState is forbidden in public Library content — it is personal-state data \(docs\/decisions\/research-os-data-contract\.md, INV-02\) and belongs only in the private Research OS DynamoDB record/,
	);
});

test('validate-library rejects a removed ranking-score field (INV-03)', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'forbidden-removed-score-field-in-paper'),
		/signals\.totalScore is forbidden in public Library content — it is a removed ranking-input field \(docs\/decisions\/research-os-data-contract\.md, INV-03\)/,
	);
});

test('validate-library rejects mergedInto on a paper', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'forbidden-merged-into-on-paper'),
		/mergedInto is forbidden in public Library content — it is corpus-only data \(docs\/decisions\/research-os-data-contract\.md, INV-01\): mergedInto belongs only to the private Research OS canonical item on papers\/resources/,
	);
});

test('validate-library still accepts mergedInto on a topic (scope note: T03 owns its own mergedInto)', () => {
	// The one place the T02 boundary extension could have broken the build:
	// mergedInto must stay legal on topics even though it is now forbidden
	// on papers/resources.
	assertValidatorAccepts('scripts/validate-library.mjs', join(fixturesRoot, 'topic-merged-into-still-allowed'));
});

test('validate-library rejects a public-collection record over the size guard', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'oversized-resource-record'),
		/over the 8192-byte public-collection record guard/,
	);
});

test('validate-library rejects a removed ranking-score field reappearing in the schema file itself (INV-03)', () => {
	assertValidatorRejects(
		'scripts/validate-library.mjs',
		join(fixturesRoot, 'removed-score-field-in-schema'),
		/src\/content\.config\.ts declares a field named "totalScore", which is a removed ranking-input field \(docs\/decisions\/research-os-data-contract\.md, INV-03\)/,
	);
});
