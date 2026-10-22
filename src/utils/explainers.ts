import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';

// Explainers: bot-drafted, owner-approved Korean commentary on one external
// paper or article (docs/features/explainers.md). Pure helpers only (no
// `astro:content` runtime import) so Node validators and tests can load them.

export type ExplainerEntry = CollectionEntry<'explainers'>;
export type ExplainerPaperEntry = CollectionEntry<'papers'>;

/**
 * The single definition of a *published* explainer. A draft, pending or
 * rejected entry renders nowhere (listing, detail route, sitemap); nothing
 * unreviewed is ever public. Every route reads explainers through this.
 */
export function isPublishedExplainer(explainer: Pick<ExplainerEntry, 'data'>): boolean {
	return explainer.data.review.status === 'approved' && explainer.data.review.humanReviewed === true;
}

export function getPublishedExplainers<T extends Pick<ExplainerEntry, 'data'>>(explainers: T[]): T[] {
	return explainers.filter(isPublishedExplainer);
}

/** Detail page of an explainer. Same convention as every other localized route. */
export function getExplainerUrl(lang: UILanguage, id: string): string {
	return `/${lang}/library/explainers/${id}/`;
}

/** An entry's slug is its frontmatter `id` (validated to equal the file name). */
export function getExplainerSlug(explainer: Pick<ExplainerEntry, 'id' | 'data'>): string {
	return explainer.data.id ?? explainer.id;
}

/** Normalizes a DOI for comparison: lowercase, without a resolver prefix. */
export function normalizeDoi(value: string): string {
	return value
		.trim()
		.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
		.replace(/^doi:/i, '')
		.toLowerCase();
}

/** Normalizes an arXiv id for comparison: no prefix, no version suffix. */
export function normalizeArxivId(value: string): string {
	return value
		.trim()
		.replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//i, '')
		.replace(/^arxiv:/i, '')
		.replace(/\.pdf$/i, '')
		.replace(/v\d+$/i, '')
		.toLowerCase();
}

type PaperWithIds = {
	data: { source: { externalIds: Array<{ scheme: string; value: string }> } };
};

/**
 * The paper card an explainer is about, joined on identifier only (DOI or
 * arXiv id against the card's `source.externalIds`), never on title. Explainer
 * and paper card stay two records making two different claims; this only finds
 * the card to link to. `papers` must already be the approved set (a draft card
 * has no anchor on the Research hub).
 */
export function findPaperForExplainer<P extends PaperWithIds>(
	explainer: Pick<ExplainerEntry, 'data'>,
	papers: P[],
): P | null {
	const doi = explainer.data.ids?.doi ? normalizeDoi(explainer.data.ids.doi) : null;
	const arxiv = explainer.data.ids?.arxiv ? normalizeArxivId(explainer.data.ids.arxiv) : null;
	if (!doi && !arxiv) return null;

	return (
		papers.find((paper) =>
			paper.data.source.externalIds.some(
				(entry) =>
					(doi !== null && entry.scheme === 'doi' && normalizeDoi(entry.value) === doi) ||
					(arxiv !== null && entry.scheme === 'arxiv' && normalizeArxivId(entry.value) === arxiv),
			),
		) ?? null
	);
}
