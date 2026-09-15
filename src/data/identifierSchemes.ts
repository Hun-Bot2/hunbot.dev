// External identifier scheme registry
// (docs/decisions/research-item-identity.md#External-Identifier-Map).
//
// Replaces the fixed source.openReviewId / semanticScholarId / arxivId
// columns with a bounded list of typed entries (scheme, value). The scheme
// vocabulary is data, not code: adding OpenAlex, DBLP, ACM DL, or IEEE is a
// data edit here with no code change and no route regression. Cross-checked
// by scripts/validate-library.mjs; never a Zod enum, matching the pattern
// src/data/venues.ts and src/data/discoverFacets.ts establish.
//
// Per-scheme normalization (lowercasing, stripping a `https://doi.org/`
// prefix, stripping an arXiv version suffix, etc.) is T06's function to write
// and test (docs/decisions/research-item-identity.md#External-Identifier-Map:
// "The full normalization table is T06's to write and test; this record
// fixes only that it exists, that it is per-scheme, and that it is applied on
// both write and lookup."). This file fixes only the scheme vocabulary
// itself — id, display label, and whether the scheme is *strong* enough to
// participate in identity resolution — plus the one format check T09 needs
// today: rejecting a structurally malformed DOI value.

export interface IdentifierSchemeDefinition {
	/** Canonical, stable, lowercase, slug-safe. Never reused once written. */
	id: string;
	/** Display label for any future render site. */
	label: string;
	/**
	 * Whether this scheme is *strong* for identity resolution
	 * (docs/decisions/research-item-identity.md#Resolution): only strong
	 * identifiers participate in the private identifier index. `url` is
	 * deliberately not strong — a landing page can be shared by an abstract
	 * page and its PDF, and two distinct works can share a project page.
	 * Not consumed by any code in this repository yet; recorded so T06 does
	 * not have to re-derive it.
	 */
	strong: boolean;
}

export const identifierSchemes: IdentifierSchemeDefinition[] = [
	{ id: 'doi', label: 'DOI', strong: true },
	{ id: 'arxiv', label: 'arXiv', strong: true },
	{ id: 'openreview', label: 'OpenReview', strong: true },
	{ id: 'dblp', label: 'DBLP', strong: true },
	{ id: 'openalex', label: 'OpenAlex', strong: true },
	{ id: 'semanticscholar', label: 'Semantic Scholar', strong: true },
	{ id: 'acmdl', label: 'ACM DL', strong: true },
	{ id: 'ieee', label: 'IEEE', strong: true },
	{ id: 'url', label: 'Canonical URL', strong: false },
];

export const identifierSchemeIds: readonly string[] = identifierSchemes.map((scheme) => scheme.id);

export function isValidIdentifierScheme(value: unknown): value is string {
	return typeof value === 'string' && identifierSchemeIds.includes(value);
}

export function getIdentifierSchemeDisplayName(value: unknown): string | null {
	const entry = identifierSchemes.find((candidate) => candidate.id === value);
	if (entry) return entry.label;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// A minimal structural DOI check — not full normalization (T06's job), just
// enough to catch an obviously malformed value at authoring time. Matches
// the standard `10.<4-9 digit registrant>/<suffix>` DOI shape.
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

export function isWellFormedDoi(value: unknown): boolean {
	return typeof value === 'string' && DOI_PATTERN.test(value);
}

const seenIds = new Set<string>();
for (const scheme of identifierSchemes) {
	if (seenIds.has(scheme.id)) {
		throw new Error(`Invalid identifier scheme registry: duplicate id "${scheme.id}".`);
	}
	seenIds.add(scheme.id);
}
