// Discover Phase 2 facet registry (docs/decisions/discover-direction.md#Facets).
//
// `contentType` is data, not code: it is a registry here, never a Zod enum
// or a TypeScript union. Adding, renaming, or retiring a content type is a
// one-line change to `contentTypes` below, cross-referenced at build time by
// `scripts/validate-library.mjs` — no schema or route change required.
//
// `depth` is the deliberate, documented exception to this rule (see
// src/content.config.ts and shared-context.md §4): it stays a closed,
// ordered four-value enum because it is a scale used for range filtering,
// not a taxonomy. It is intentionally not modeled in this file.

export interface ContentTypeDefinition {
	id: string;
	label: string;
}

export const contentTypes: ContentTypeDefinition[] = [
	{ id: 'paper', label: 'Paper' },
	{ id: 'repo', label: 'Repository' },
	{ id: 'engineering-blog', label: 'Engineering Blog' },
	{ id: 'tool', label: 'Tool' },
	{ id: 'benchmark', label: 'Benchmark' },
	{ id: 'product-release', label: 'Product Release' },
	{ id: 'discussion', label: 'Discussion' },
	{ id: 'news', label: 'News' },
];

export const contentTypeIds: readonly string[] = contentTypes.map((entry) => entry.id);

export type ContentTypeId = (typeof contentTypes)[number]['id'];

export function isValidContentType(value: unknown): value is ContentTypeId {
	return typeof value === 'string' && contentTypeIds.includes(value);
}
