import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { sortStable } from './ordering.ts';

export type ResourceEntry = CollectionEntry<'resources'>;
export type PaperEntry = CollectionEntry<'papers'>;
export type TopicEntry = CollectionEntry<'topics'>;

type LocalizedText = Partial<Record<UILanguage, string>>;

// Deterministic "any available" order for the language resolver below. Every
// UILanguage is listed, so trying requested -> canonical -> this order always
// terminates and matches the old ko ?? en ?? jp tie-break exactly when
// canonicalLanguage is 'ko' (today's default for every existing item).
const FALLBACK_LANGUAGE_ORDER: readonly UILanguage[] = ['ko', 'en', 'jp'];

// Papers moved out of the Library and onto the Research hub
// (docs/decisions/site-structure.md) — "ai-papers" is no longer a Library
// section. The `papers` collection itself is unchanged; see src/utils/research.ts.
//
// The old resources-backed section registry that used to live here
// (librarySections/LibrarySectionId/isLibrarySectionId/getResourcesForLibrarySection)
// is gone: the Library's 외부 링크 tab and homepage are both now picks-backed,
// reading src/data/librarySections.ts instead (docs/decisions/site-structure.md,
// revision 2026-09-27).

/**
 * Stable in-page anchor for a paper row (`#paper-<id>`). PaperRow renders it
 * and the public artifact adapter links to it, so the two cannot drift.
 */
export function getPaperAnchorId(paperId: string): string {
	return `paper-${paperId}`;
}

/** A paper card's place on the Research hub. Paper cards have no page of their own. */
export function getPaperUrl(lang: UILanguage, paperId: string): string {
	return `/${lang}/research/#${getPaperAnchorId(paperId)}`;
}

export function getLibrarySectionPath(lang: UILanguage, slug: string): string {
	return `/${lang}/library/${slug}/`;
}

export function isApprovedResource(resource: ResourceEntry): boolean {
	return resource.data.status === 'approved' && resource.data.review.humanReviewed === true;
}

export function isApprovedPaper(paper: PaperEntry): boolean {
	return paper.data.status === 'approved' && paper.data.review.humanReviewed === true;
}

export function isActiveTopic(topic: TopicEntry): boolean {
	return topic.data.status === 'active';
}

export function getApprovedResources(resources: ResourceEntry[]): ResourceEntry[] {
	return resources.filter(isApprovedResource);
}

export function getApprovedPapers(papers: PaperEntry[]): PaperEntry[] {
	return papers.filter(isApprovedPaper);
}

export function getActiveTopics(topics: TopicEntry[]): TopicEntry[] {
	return topics.filter(isActiveTopic);
}

/**
 * The single Discover/Library language-fallback rule
 * (docs/decisions/discover-direction.md#Language-Policy): requested language
 * -> the item's canonical language -> any available language. This is the
 * one resolver that replaces the two hard-coded `ko ?? en ?? jp` chains that
 * used to live separately in `getLocalizedText` and `getPaperTldr` — both now
 * call through this instead of duplicating the fallback order.
 *
 * `getValue` abstracts over whatever localized shape a caller holds (a flat
 * per-language string, or one field nested inside a per-language summary
 * object), so both call sites can share this single implementation.
 */
function resolveByLanguagePolicy<T>(
	getValue: (lang: UILanguage) => T | undefined,
	requestedLanguage: UILanguage,
	canonicalLanguage: UILanguage,
): T | undefined {
	const requested = getValue(requestedLanguage);
	if (requested) return requested;

	const canonical = getValue(canonicalLanguage);
	if (canonical) return canonical;

	for (const fallbackLanguage of FALLBACK_LANGUAGE_ORDER) {
		const value = getValue(fallbackLanguage);
		if (value) return value;
	}

	return undefined;
}

export function getLocalizedText(
	value: LocalizedText | undefined,
	lang: UILanguage,
	canonicalLanguage: UILanguage = 'ko',
): string {
	if (!value) return '';
	return resolveByLanguagePolicy((language) => value[language], lang, canonicalLanguage) ?? '';
}

export function getResourceSummary(resource: ResourceEntry, lang: UILanguage): string {
	return getLocalizedText(resource.data.summary, lang, resource.data.canonicalLanguage);
}

export function getTopicLabel(topic: TopicEntry, lang: UILanguage): string {
	return getLocalizedText(topic.data.label, lang);
}

export function getTopicDescription(topic: TopicEntry, lang: UILanguage): string {
	return getLocalizedText(topic.data.description, lang);
}

export function getPaperTldr(paper: PaperEntry, lang: UILanguage): string {
	const summary = paper.data.summary;
	return (
		resolveByLanguagePolicy((language) => summary[language]?.tldr, lang, paper.data.canonicalLanguage) ?? ''
	);
}

export interface UsefulFeedItem {
	id: string;
	title: string;
	url: string;
	source: string;
	date: string;
	summary: string;
}

/**
 * Useful Feeds items exactly as delivered (docs/decisions/site-structure.md#3):
 * approved `resources`, newest first by `publishedAt` (falling back to
 * `source.firstSeenAt` when a resource predates that facet) — the one
 * editorial choice made here. Everything else renders as-is: this site never
 * enriches, summarizes, or translates a Useful Feeds item. Shared by
 * `src/pages/[lang]/library/useful-feeds.astro` and the homepage's Useful
 * Feeds panel so the two surfaces cannot silently disagree about ordering.
 */
export function getUsefulFeedItems(resources: ResourceEntry[], lang: UILanguage): UsefulFeedItem[] {
	const approved = getApprovedResources(resources);

	return sortStable(approved, (a, b) => {
		const aDate = a.data.publishedAt ?? a.data.source.firstSeenAt;
		const bDate = b.data.publishedAt ?? b.data.source.firstSeenAt;
		return bDate.localeCompare(aDate);
	}).map((resource) => ({
		id: resource.id,
		title: resource.data.title,
		url: resource.data.url,
		source: new URL(resource.data.url).hostname.replace(/^www\./, ''),
		date: resource.data.publishedAt ?? resource.data.source.firstSeenAt,
		summary: getResourceSummary(resource, lang),
	}));
}

export function getFeaturedResources(resources: ResourceEntry[], limit = 3): ResourceEntry[] {
	return sortStable(resources, (a, b) => {
		if (a.data.featured !== b.data.featured) {
			return a.data.featured ? -1 : 1;
		}

		const aDate = a.data.review.reviewedAt ?? a.data.source.lastCheckedAt ?? a.data.source.firstSeenAt;
		const bDate = b.data.review.reviewedAt ?? b.data.source.lastCheckedAt ?? b.data.source.firstSeenAt;
		const dateComparison = bDate.localeCompare(aDate);
		if (dateComparison !== 0) return dateComparison;

		return a.data.title.localeCompare(b.data.title);
	}).slice(0, limit);
}

/**
 * Topics for display, in a deterministic order.
 *
 * `order` is the field the taxonomy lifecycle added for exactly this purpose
 * (docs/decisions/discover-direction.md#Taxonomy) — it is a display weight, so
 * display is where it should be honoured. Before this existed the Library hub
 * sliced the first six topics out of whatever order the filesystem produced,
 * which was harmless with one topic and arbitrary with thirty-two.
 */
export function getFeaturedTopics(topics: TopicEntry[], limit = 6): TopicEntry[] {
	return sortStable(topics, (a, b) => {
		const orderComparison = (a.data.order ?? 0) - (b.data.order ?? 0);
		if (orderComparison !== 0) return orderComparison;
		// Topics carry `label` per language, not a flat `title`. Korean is the
		// canonical label and the only one the schema requires.
		return a.data.label.ko.localeCompare(b.data.label.ko);
	}).slice(0, limit);
}

/**
 * Papers for display, newest and most recently reviewed first.
 *
 * Mirrors the homepage's freshness ordering so the same paper set does not
 * appear in two different orders on two pages of the same site.
 */
export function getFeaturedPapers(papers: PaperEntry[], limit = 3): PaperEntry[] {
	return sortStable(papers, (a, b) => {
		const yearComparison = (b.data.year ?? 0) - (a.data.year ?? 0);
		if (yearComparison !== 0) return yearComparison;

		const aDate = a.data.review.reviewedAt ?? a.data.source.lastCheckedAt ?? a.data.source.firstSeenAt;
		const bDate = b.data.review.reviewedAt ?? b.data.source.lastCheckedAt ?? b.data.source.firstSeenAt;
		const dateComparison = bDate.localeCompare(aDate);
		if (dateComparison !== 0) return dateComparison;

		return a.data.title.localeCompare(b.data.title);
	}).slice(0, limit);
}
