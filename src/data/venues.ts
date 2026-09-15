// Venue registry (docs/decisions/research-discovery-system.md#Venue-Registry;
// docs/decisions/research-item-identity.md).
//
// Venues are data, not code: no venue id, acronym, or name may appear in a
// conditional anywhere in this repository or in the (future) Research OS
// pipeline. `papers.venue` and `topics.venues` (src/content.config.ts) store
// references to entries here by canonical `id`; the reference is
// cross-checked by scripts/validate-library.mjs, never enforced with a Zod
// enum — the same pattern src/data/discoverFacets.ts establishes for
// `contentType`. Do not add a Zod enum of venue ids; do not add a venue
// acronym to any conditional.
//
// Coverage is deliberately partial. research-discovery-system.md#Venue-Registry:
// "the registry is authored incrementally and field coverage is explicitly
// partial. A field with no venues is a legitimate registry state, not a gap
// to be filled before shipping." This file authors only the venues actually
// referenced by existing content today (ICLR, ICML, NeurIPS, ACL, EMNLP —
// see the migration of src/content/topics/ai-agents.md and
// src/content/papers/sample-paper-card.md) plus IEEE VIS, named explicitly
// as the MVP addition in the T05 task packet. Authoring more than this is
// the sequencing error the ADR's principle 11 forbids.

export type VenueType = 'conference' | 'journal' | 'workshop' | 'symposium';

// A prior, not a measurement. Capped in ranking so tier can never alone move
// an item into a top slot (research-discovery-system.md#Venue-Registry).
export type VenueTier = 'CORE' | 'EXTENDED';

// Three states, never a boolean. A signal a venue does not produce at all
// ('not-applicable') must never be confused with a signal this registry
// simply has not captured yet ('unavailable') — both are distinct from an
// observed value, and neither may ever be read as zero.
// research-discovery-system.md#Venue-Registry: "a ranking function that
// silently treats 'this venue publishes no review scores' as 'this paper
// had bad reviews' is broken in a way that is nearly invisible."
export type SignalAvailability = 'available' | 'unavailable' | 'not-applicable';

export interface VenueSignalAvailability {
	awards: SignalAvailability;
	orals: SignalAvailability;
	spotlights: SignalAvailability;
	reviewScores: SignalAvailability;
}

const SIGNAL_AVAILABILITY_KEYS = ['awards', 'orals', 'spotlights', 'reviewScores'] as const;
const SIGNAL_AVAILABILITY_VALUES: readonly SignalAvailability[] = ['available', 'unavailable', 'not-applicable'];

// Required and blocks ingestion (research-discovery-system.md#Venue-Registry:
// "a venue whose access status is unverified cannot be ingested, regardless
// of how much its papers are wanted"). Every entry below is `unverified`:
// verifying actual licensing/access terms is an external task, not this one,
// and recording a guess as fact is worse than recording that nobody has
// checked yet. Do not change any entry away from `unverified` without an
// actual verification pass.
export type VenueAccess = 'unverified' | 'open' | 'restricted' | 'mixed';

const VENUE_ACCESS_VALUES: readonly VenueAccess[] = ['unverified', 'open', 'restricted', 'mixed'];

export interface VenueDefinition {
	/** Canonical, stable, lowercase, slug-safe. Never reused once written. */
	id: string;
	/** Full official name. */
	name: string;
	/**
	 * Short display label, usually the acronym. Distinct from `name` (the full
	 * official name, too long for a UI pill) and from `aliases` (spellings to
	 * MATCH during ingestion, whose order carries no display meaning). Render
	 * sites use getVenueDisplayName(); never render a raw venue id.
	 */
	shortName: string;
	/** Historical names, acronym variants, DBLP keys, other systems' identifiers. */
	aliases: string[];
	/** One or more research fields. Multi-valued: venues are not partitioned by field. */
	fields: string[];
	type: VenueType;
	tier: VenueTier;
	/** Authoritative source for what was accepted. */
	acceptanceSource: string;
	/** Authoritative source for published metadata. */
	proceedingsSource: string;
	/** Named tracks, where the venue has them. Empty array is a legitimate state. */
	tracks: string[];
	signalAvailability: VenueSignalAvailability;
	/** Which ingestion adapter handles this venue. `null` until one exists — no adapter is implemented pre-AWS. */
	adapter: string | null;
	access: VenueAccess;
	/** Free text on quirks — renames, merges, years with different processes, open verification items. */
	provenanceNotes: string;
}

export const venues: VenueDefinition[] = [
	{
		id: 'iclr',
		name: 'International Conference on Learning Representations',
		shortName: 'ICLR',
		aliases: ['ICLR'],
		fields: ['ml-ai'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'openreview',
		proceedingsSource: 'openreview',
		tracks: [],
		signalAvailability: {
			awards: 'unavailable',
			orals: 'available',
			spotlights: 'available',
			reviewScores: 'available',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'Reviews, ratings, and decisions are hosted on OpenReview and are public by default. ICLR has no separate proceedings volume — accepted papers are indexed via OpenReview and arXiv. Whether ICLR runs a formal best-paper award in a given year is not verified here, hence "unavailable" rather than "not-applicable" for awards.',
	},
	{
		id: 'icml',
		name: 'International Conference on Machine Learning',
		shortName: 'ICML',
		aliases: ['ICML'],
		fields: ['ml-ai'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'openreview',
		proceedingsSource: 'pmlr',
		tracks: [],
		signalAvailability: {
			awards: 'available',
			orals: 'available',
			spotlights: 'unavailable',
			reviewScores: 'unavailable',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'ICML runs Best Paper and Test of Time awards. Proceedings are published in PMLR. Recent editions use OpenReview for review management, but public review-score availability has not been verified across years, hence "unavailable" rather than "available".',
	},
	{
		id: 'neurips',
		name: 'Conference on Neural Information Processing Systems',
		shortName: 'NeurIPS',
		aliases: ['NeurIPS', 'NIPS'],
		fields: ['ml-ai'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'openreview',
		proceedingsSource: 'neurips-proceedings',
		tracks: ['main', 'datasets-and-benchmarks'],
		signalAvailability: {
			awards: 'available',
			orals: 'available',
			spotlights: 'available',
			reviewScores: 'available',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'Runs Best Paper / Outstanding Paper awards, designates a small fraction of accepted papers as oral and spotlight, and (since moving to OpenReview) publishes reviews. Older editions (pre-OpenReview, "NIPS" branding) may not share all of these; provenance is not year-qualified in this entry.',
	},
	{
		id: 'acl',
		name: 'Annual Meeting of the Association for Computational Linguistics',
		shortName: 'ACL',
		aliases: ['ACL'],
		fields: ['nlp'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'acl-rolling-review',
		proceedingsSource: 'acl-anthology',
		tracks: ['main', 'findings'],
		signalAvailability: {
			awards: 'available',
			orals: 'unavailable',
			spotlights: 'not-applicable',
			reviewScores: 'unavailable',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'Uses ACL Rolling Review (ARR) as the shared review process across most *ACL venues; proceedings are archived on the ACL Anthology. Runs Best Paper / Outstanding Paper awards. Does not use a "spotlight" presentation category, so that signal is marked not-applicable rather than unavailable.',
	},
	{
		id: 'emnlp',
		name: 'Conference on Empirical Methods in Natural Language Processing',
		shortName: 'EMNLP',
		aliases: ['EMNLP'],
		fields: ['nlp'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'acl-rolling-review',
		proceedingsSource: 'acl-anthology',
		tracks: ['main', 'findings'],
		signalAvailability: {
			awards: 'available',
			orals: 'unavailable',
			spotlights: 'not-applicable',
			reviewScores: 'unavailable',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'Same ARR / ACL Anthology process family as ACL. Runs Best Paper / Outstanding Paper awards. No "spotlight" presentation category.',
	},
	{
		id: 'ieee-vis',
		name: 'IEEE Visualization Conference',
		shortName: 'IEEE VIS',
		aliases: ['IEEE VIS', 'VIS'],
		fields: ['visualization'],
		type: 'conference',
		tier: 'CORE',
		acceptanceSource: 'ieee-vis-committee',
		proceedingsSource: 'ieee-xplore',
		tracks: [],
		signalAvailability: {
			awards: 'available',
			orals: 'unavailable',
			spotlights: 'not-applicable',
			reviewScores: 'unavailable',
		},
		adapter: null,
		access: 'unverified',
		provenanceNotes:
			'Historically ran as separate InfoVis / SciVis / VAST conferences before unifying under the single IEEE VIS umbrella; track names are not reconstructed here since no venue reference in this repository needs them yet — see "Coverage" in research-discovery-system.md#Venue-Registry. Accepted papers commonly publish as a special issue of IEEE TVCG via IEEE Xplore. Runs Best Paper and honorable-mention awards.',
	},
];

export const venueIds: readonly string[] = venues.map((venue) => venue.id);

export function isValidVenueId(value: unknown): value is string {
	return typeof value === 'string' && venueIds.includes(value);
}

/**
 * Resolves an id-or-alias string to its canonical registry id, or `null`
 * when nothing matches. Case-sensitive by design: aliases record exact
 * historical spellings (e.g. "ICLR"), and normalizing case is a
 * canonicalization decision reserved for T06, not this registry.
 */
export function resolveVenueId(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const direct = venues.find((venue) => venue.id === value);
	if (direct) return direct.id;

	const byAlias = venues.find((venue) => venue.aliases.includes(value));
	return byAlias ? byAlias.id : null;
}

/**
 * Registry self-integrity checks — these validate the registry array
 * itself (shape, duplicate ids, id/alias collisions), independent of any
 * content that references it. Exported as a pure function so it can be
 * exercised directly against crafted bad registries in tests, the same way
 * `getDeckMetaErrors`/`validateDeckCollection` are tested in
 * src/lib/decks/validateDeckMeta.ts — a single static data file has no
 * content-collection directory a fixture cwd could swap in its place, so
 * registry-integrity regression cases are unit tests against this function
 * rather than fixture directories under test/fixtures/.
 */
/**
 * Display label for a stored venue reference. Falls back to the raw string when
 * the value resolves to no registry entry, so a render site degrades to the old
 * behaviour rather than to a blank pill. Validation rejects unknown ids at build
 * time, so the fallback should be unreachable in practice.
 */
export function getVenueDisplayName(value: unknown): string | null {
	const id = resolveVenueId(value);
	const entry = id === null ? undefined : venues.find((venue) => venue.id === id);
	if (entry) return entry.shortName;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function getVenueRegistryErrors(candidateVenues: unknown): string[] {
	const errors: string[] = [];

	if (!Array.isArray(candidateVenues)) {
		return ['Venue registry must be an array.'];
	}

	const seenIds = new Map<string, number>();
	const aliasOwners = new Map<string, number[]>();

	candidateVenues.forEach((venue, index) => {
		const label = `venues[${index}]`;

		if (!venue || typeof venue !== 'object') {
			errors.push(`${label} must be an object.`);
			return;
		}

		const candidate = venue as Partial<VenueDefinition>;

		if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
			errors.push(`${label}.id must be a non-empty string.`);
		} else {
			if (seenIds.has(candidate.id)) {
				errors.push(`${label}.id "${candidate.id}" duplicates venues[${seenIds.get(candidate.id)}].id.`);
			}
			seenIds.set(candidate.id, index);
		}

		if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
			errors.push(`${label}.name must be a non-empty string.`);
		}

		if (typeof candidate.shortName !== 'string' || candidate.shortName.trim().length === 0) {
			errors.push(`${label}.shortName must be a non-empty string (it is what render sites display).`);
		}

		if (!Array.isArray(candidate.aliases)) {
			errors.push(`${label}.aliases must be an array.`);
		} else {
			for (const alias of candidate.aliases) {
				if (!aliasOwners.has(alias)) {
					aliasOwners.set(alias, []);
				}
				aliasOwners.get(alias)!.push(index);
			}
		}

		if (!Array.isArray(candidate.fields) || candidate.fields.length === 0) {
			errors.push(`${label}.fields must be a non-empty array.`);
		}

		if (!Array.isArray(candidate.tracks)) {
			errors.push(`${label}.tracks must be an array.`);
		}

		if (typeof candidate.acceptanceSource !== 'string' || candidate.acceptanceSource.trim().length === 0) {
			errors.push(`${label}.acceptanceSource must be a non-empty string.`);
		}

		if (typeof candidate.proceedingsSource !== 'string' || candidate.proceedingsSource.trim().length === 0) {
			errors.push(`${label}.proceedingsSource must be a non-empty string.`);
		}

		if (candidate.adapter !== null && typeof candidate.adapter !== 'undefined' && typeof candidate.adapter !== 'string') {
			errors.push(`${label}.adapter must be null or a string.`);
		}

		if (typeof candidate.provenanceNotes !== 'string') {
			errors.push(`${label}.provenanceNotes must be a string (may be empty).`);
		}

		if (!candidate.access || !VENUE_ACCESS_VALUES.includes(candidate.access)) {
			errors.push(`${label}.access must be one of: ${VENUE_ACCESS_VALUES.join(', ')}.`);
		}

		if (!candidate.signalAvailability || typeof candidate.signalAvailability !== 'object') {
			errors.push(`${label}.signalAvailability is required and must be an object with all four signal keys.`);
		} else {
			for (const key of SIGNAL_AVAILABILITY_KEYS) {
				const value = (candidate.signalAvailability as Partial<VenueSignalAvailability>)[key];
				if (typeof value === 'undefined') {
					errors.push(`${label}.signalAvailability.${key} is required — a missing signal must never be readable as zero.`);
				} else if (!SIGNAL_AVAILABILITY_VALUES.includes(value)) {
					errors.push(
						`${label}.signalAvailability.${key} "${value}" must be one of: ${SIGNAL_AVAILABILITY_VALUES.join(', ')}.`,
					);
				}
			}
		}
	});

	// An id may not also be registered as an alias anywhere in the registry —
	// otherwise resolution is ambiguous between "this is the canonical id"
	// and "this is a historical spelling of some other entry".
	for (const [id, ownerIndex] of seenIds) {
		if (aliasOwners.has(id)) {
			const aliasIndexes = aliasOwners.get(id)!.filter((index) => index !== ownerIndex);
			for (const aliasIndex of aliasIndexes) {
				errors.push(`venues[${aliasIndex}].aliases contains "${id}", which is venues[${ownerIndex}]'s canonical id.`);
			}
		}
	}

	// The same alias string may not be claimed by more than one entry.
	for (const [alias, owners] of aliasOwners) {
		const uniqueOwners = [...new Set(owners)];
		if (uniqueOwners.length > 1) {
			errors.push(`Alias "${alias}" is claimed by more than one venue: ${uniqueOwners.map((i) => `venues[${i}]`).join(', ')}.`);
		}
	}

	return errors;
}

export function assertValidVenueRegistry(candidateVenues: unknown) {
	const errors = getVenueRegistryErrors(candidateVenues);

	if (errors.length > 0) {
		throw new Error(`Invalid venue registry:\n- ${errors.join('\n- ')}`);
	}
}

assertValidVenueRegistry(venues);
