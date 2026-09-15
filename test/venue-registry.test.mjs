// Regression tests for the venue registry's self-integrity checks
// (src/data/venues.ts#getVenueRegistryErrors). These validate the registry
// array itself — duplicate ids, id/alias collisions, malformed
// signalAvailability — independent of any content that references it.
//
// Unlike scripts/validate-library.mjs's content cross-reference checks
// (test/library-validate.test.mjs), these are NOT exercised through
// test/helpers/validator-harness.mjs's fixture-directory-as-cwd mechanism:
// src/data/venues.ts is a single static data file imported by its real
// repo-relative path (matching src/data/discoverFacets.ts's pattern), not a
// per-file content collection a fixture cwd can swap in its place. So a
// "fixture" for a bad registry is a crafted array passed directly to the
// exported pure validation function, following the same idiom as
// src/lib/decks/validateDeckMeta.ts's getDeckMetaErrors/validateDeckCollection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVenueRegistryErrors, getVenueDisplayName, venues } from '../src/data/venues.ts';

const validSignalAvailability = {
	awards: 'unavailable',
	orals: 'available',
	spotlights: 'not-applicable',
	reviewScores: 'unavailable',
};

function baseVenue(overrides = {}) {
	return {
		id: 'fixture-venue',
		name: 'Fixture Venue',
		shortName: 'FIX',
		aliases: [],
		fields: ['ml-ai'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'fixture-source',
		proceedingsSource: 'fixture-source',
		tracks: [],
		signalAvailability: validSignalAvailability,
		adapter: null,
		access: 'unverified',
		provenanceNotes: '',
		...overrides,
	};
}

test('venue registry rejects a duplicate registry id', () => {
	const errors = getVenueRegistryErrors([
		baseVenue({ id: 'dup-venue' }),
		baseVenue({ id: 'dup-venue', name: 'Fixture Venue Two' }),
	]);

	assert.ok(
		errors.some((error) => /venues\[1\]\.id "dup-venue" duplicates venues\[0\]\.id/.test(error)),
		`Expected a duplicate-id error, got:\n${errors.join('\n')}`,
	);
});

test('venue registry rejects an id that collides with another entry\'s alias', () => {
	const errors = getVenueRegistryErrors([
		baseVenue({ id: 'canonical-venue' }),
		baseVenue({ id: 'other-venue', aliases: ['canonical-venue'] }),
	]);

	assert.ok(
		errors.some((error) =>
			/venues\[1\]\.aliases contains "canonical-venue", which is venues\[0\]'s canonical id/.test(error),
		),
		`Expected an id/alias collision error, got:\n${errors.join('\n')}`,
	);
});

test('venue registry rejects an entry missing signalAvailability entirely', () => {
	const entry = baseVenue();
	delete entry.signalAvailability;

	const errors = getVenueRegistryErrors([entry]);

	assert.ok(
		errors.some((error) => /venues\[0\]\.signalAvailability is required/.test(error)),
		`Expected a missing-signalAvailability error, got:\n${errors.join('\n')}`,
	);
});

test('venue registry rejects an entry with one signal missing from signalAvailability', () => {
	const errors = getVenueRegistryErrors([
		baseVenue({
			signalAvailability: {
				awards: 'unavailable',
				orals: 'available',
				spotlights: 'not-applicable',
				// reviewScores omitted deliberately
			},
		}),
	]);

	assert.ok(
		errors.some((error) =>
			/venues\[0\]\.signalAvailability\.reviewScores is required — a missing signal must never be readable as zero/.test(
				error,
			),
		),
		`Expected a missing-signal error naming reviewScores, got:\n${errors.join('\n')}`,
	);
});

test('venue registry accepts a well-formed registry with no errors', () => {
	const errors = getVenueRegistryErrors([baseVenue()]);
	assert.deepEqual(errors, []);
});

// Added by the coordinator alongside the venue display-name fix: shortName is
// what render sites show, so a missing one must fail like any other required
// field rather than silently degrading a Library pill to a raw id.
test('getVenueRegistryErrors: rejects a venue missing shortName', () => {
	const { shortName, ...withoutShortName } = baseVenue();
	const errors = getVenueRegistryErrors([withoutShortName]);

	assert.ok(
		errors.some((error) => error.includes('shortName')),
		`Expected a shortName error, got:\n${errors.join('\n')}`,
	);
});

test('every registry entry has a shortName, so no Library pill can render a raw id', () => {
	for (const venue of venues) {
		assert.ok(
			typeof venue.shortName === 'string' && venue.shortName.trim() !== '',
			`venue "${venue.id}" is missing a shortName.`,
		);
	}
});

test('getVenueDisplayName: returns the short label for an id, not the raw id', () => {
	assert.equal(getVenueDisplayName('iclr'), 'ICLR');
});

test('getVenueDisplayName: falls back to the raw string for an unknown value', () => {
	assert.equal(getVenueDisplayName('Some Workshop'), 'Some Workshop');
});
