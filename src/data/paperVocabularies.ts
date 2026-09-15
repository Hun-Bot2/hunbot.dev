// Paper acceptance/honor/presentation vocabularies
// (docs/decisions/research-item-identity.md#C2 — "papers.decision": split into
// acceptanceStatus and honors).
//
// The legacy `papers.decision` enum (accepted/oral/spotlight/poster/preprint/
// workshop/rejected/unknown) conflated four independent facts: acceptance
// status, honor, presentation format, and (implicitly) venue type. It could
// not express "accepted AND oral" at all. These three vocabularies replace
// it, each cross-referenced by scripts/validate-library.mjs — never a Zod
// enum, following the same pattern src/data/discoverFacets.ts established for
// `contentType` and src/data/venues.ts established for venue ids.
//
// DECISION (research-item-identity.md#C2): these vocabularies are registry
// data, not Zod enums, precisely because the evidence for their value lists
// is thin — one sample record and an unused eight-value enum. Adding
// `withdrawn` or `best-paper` when the first real paper needs one is a data
// edit here, not a schema change to a collection that may by then hold
// persisted items.
//
// Do not add a Zod enum for any of these three vocabularies, and do not add
// any of these values to a conditional anywhere else in the repository.

export interface PaperVocabularyEntry {
	/** Canonical, stable, slug-safe. Never reused once written. */
	id: string;
	/** Display label. Render sites use the getXDisplayName() helpers below;
	 * never render a raw vocabulary id. */
	label: string;
	/** Which legacy `decision` value(s) this traces to — audit trail only. */
	derivedFrom: string[];
}

// acceptanceStatus — the work's status at the referenced venue.
// docs/decisions/research-item-identity.md#The-Derived-Value-Lists
export const acceptanceStatuses: PaperVocabularyEntry[] = [
	{ id: 'accepted', label: 'Accepted', derivedFrom: ['accepted', 'oral', 'spotlight', 'poster', 'workshop'] },
	{ id: 'rejected', label: 'Rejected', derivedFrom: ['rejected'] },
	{ id: 'preprint', label: 'Preprint', derivedFrom: ['preprint'] },
	{ id: 'unknown', label: 'Unknown', derivedFrom: ['unknown'] },
];

// honors — array-valued, because "accepted and oral" was unrepresentable
// under the legacy single-enum `decision` field.
export const honors: PaperVocabularyEntry[] = [
	{ id: 'oral', label: 'Oral', derivedFrom: ['oral'] },
	{ id: 'spotlight', label: 'Spotlight', derivedFrom: ['spotlight'] },
];

// presentationFormat — nullable. `oral` legitimately also appears in
// `honors`; they are separate registries describing different facts, and
// that overlap is correct rather than redundant (see the ADR).
export const presentationFormats: PaperVocabularyEntry[] = [
	{ id: 'poster', label: 'Poster', derivedFrom: ['poster'] },
];

export const acceptanceStatusIds: readonly string[] = acceptanceStatuses.map((entry) => entry.id);
export const honorIds: readonly string[] = honors.map((entry) => entry.id);
export const presentationFormatIds: readonly string[] = presentationFormats.map((entry) => entry.id);

export function isValidAcceptanceStatus(value: unknown): value is string {
	return typeof value === 'string' && acceptanceStatusIds.includes(value);
}

export function isValidHonor(value: unknown): value is string {
	return typeof value === 'string' && honorIds.includes(value);
}

export function isValidPresentationFormat(value: unknown): value is string {
	return typeof value === 'string' && presentationFormatIds.includes(value);
}

/**
 * Display label for a stored vocabulary reference. Falls back to the raw
 * string when the value resolves to no registry entry, matching
 * getVenueDisplayName's fallback shape — validation rejects unknown values at
 * build time, so the fallback should be unreachable in practice. A stored id
 * is never a display value; render sites must call these, never read
 * `paper.data.acceptanceStatus` (etc.) straight into a pill.
 */
export function getAcceptanceStatusDisplayName(value: unknown): string | null {
	const entry = acceptanceStatuses.find((candidate) => candidate.id === value);
	if (entry) return entry.label;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function getHonorDisplayName(value: unknown): string | null {
	const entry = honors.find((candidate) => candidate.id === value);
	if (entry) return entry.label;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function getPresentationFormatDisplayName(value: unknown): string | null {
	const entry = presentationFormats.find((candidate) => candidate.id === value);
	if (entry) return entry.label;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function findDuplicateIds(entries: PaperVocabularyEntry[]): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const entry of entries) {
		if (seen.has(entry.id)) duplicates.add(entry.id);
		seen.add(entry.id);
	}
	return [...duplicates];
}

// Registry self-integrity: run at import time, same convention as
// assertValidVenueRegistry(venues) in src/data/venues.ts.
for (const [name, entries] of Object.entries({ acceptanceStatuses, honors, presentationFormats })) {
	const duplicates = findDuplicateIds(entries as PaperVocabularyEntry[]);
	if (duplicates.length > 0) {
		throw new Error(`Invalid ${name} registry: duplicate id(s) ${duplicates.join(', ')}.`);
	}
}
