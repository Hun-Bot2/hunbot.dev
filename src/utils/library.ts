import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';

export type ResourceEntry = CollectionEntry<'resources'>;
export type PaperEntry = CollectionEntry<'papers'>;
export type TopicEntry = CollectionEntry<'topics'>;

type LocalizedText = Partial<Record<UILanguage, string>>;
type ResourceSection = ResourceEntry['data']['section'];

export const librarySections = [
	{ id: 'design', translationKey: 'design', kind: 'resources', resourceSection: 'design' },
	{ id: 'vibe-coding', translationKey: 'vibe-coding', kind: 'resources', resourceSection: 'vibe-coding' },
	{ id: 'dev-docs', translationKey: 'dev-docs', kind: 'resources', resourceSection: 'dev-docs' },
	{ id: 'ai-papers', translationKey: 'ai-papers', kind: 'papers' },
	{ id: 'useful-feeds', translationKey: 'useful-feeds', kind: 'resources', resourceSection: 'useful-feeds' },
	{ id: 'decks', translationKey: 'decks', kind: 'decks' },
] as const satisfies readonly {
	id: string;
	translationKey: string;
	kind: 'resources' | 'papers' | 'decks';
	resourceSection?: ResourceSection;
}[];

export type LibrarySectionId = (typeof librarySections)[number]['id'];

export function isLibrarySectionId(value: string | undefined): value is LibrarySectionId {
	return librarySections.some((section) => section.id === value);
}

export function getLibrarySectionPath(lang: UILanguage, sectionId: LibrarySectionId): string {
	return `/${lang}/library/${sectionId}/`;
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

export function getLocalizedText(value: LocalizedText | undefined, lang: UILanguage): string {
	if (!value) return '';
	return value[lang] ?? value.ko ?? value.en ?? value.jp ?? '';
}

export function getResourceSummary(resource: ResourceEntry, lang: UILanguage): string {
	return getLocalizedText(resource.data.summary, lang);
}

export function getTopicLabel(topic: TopicEntry, lang: UILanguage): string {
	return getLocalizedText(topic.data.label, lang);
}

export function getTopicDescription(topic: TopicEntry, lang: UILanguage): string {
	return getLocalizedText(topic.data.description, lang);
}

export function getPaperTldr(paper: PaperEntry, lang: UILanguage): string {
	const summary = paper.data.summary;
	return summary[lang]?.tldr ?? summary.ko?.tldr ?? summary.en?.tldr ?? summary.jp?.tldr ?? '';
}

export function getResourcesForLibrarySection(
	resources: ResourceEntry[],
	sectionId: LibrarySectionId,
): ResourceEntry[] {
	const section = librarySections.find((item) => item.id === sectionId);
	if (section?.kind !== 'resources' || !section.resourceSection) return [];

	return resources.filter((resource) => resource.data.section === section.resourceSection);
}

export function getFeaturedResources(resources: ResourceEntry[], limit = 3): ResourceEntry[] {
	return [...resources]
		.sort((a, b) => {
			if (a.data.featured !== b.data.featured) {
				return a.data.featured ? -1 : 1;
			}

			const aDate = a.data.review.reviewedAt ?? a.data.source.lastCheckedAt ?? a.data.source.firstSeenAt;
			const bDate = b.data.review.reviewedAt ?? b.data.source.lastCheckedAt ?? b.data.source.firstSeenAt;
			const dateComparison = bDate.localeCompare(aDate);
			if (dateComparison !== 0) return dateComparison;

			return a.data.title.localeCompare(b.data.title);
		})
		.slice(0, limit);
}
