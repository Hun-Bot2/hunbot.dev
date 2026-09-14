import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorRejects } from './helpers/validator-harness.mjs';

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
