import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import type { DeckMeta } from '../lib/decks/validateDeckMeta';
import {
	getApprovedPapers,
	getApprovedResources,
	getFeaturedResources,
	librarySections,
	type LibrarySectionId,
	type PaperEntry,
	type ResourceEntry,
} from './library.ts';

export type BlogEntry = CollectionEntry<'blog'>;

export type HomepageLibraryPick =
	| {
			kind: 'resource';
			id: string;
			resource: ResourceEntry;
	  }
	| {
			kind: 'paper';
			id: string;
			paper: PaperEntry;
	  };

export type HomepageSectionCounts = Record<LibrarySectionId, number>;

const briefMarkers = new Set(['brief', 'briefs', 'library-brief', 'library-briefs', 'editorial-brief']);

function normalizeMarker(value: string | undefined): string {
	return value?.trim().toLowerCase().replace(/\s+/g, '-') ?? '';
}

function sortBlogPostsByDate(posts: BlogEntry[]): BlogEntry[] {
	return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

function sortPapersByFreshness(papers: PaperEntry[]): PaperEntry[] {
	return [...papers].sort((a, b) => {
		const yearComparison = (b.data.year ?? 0) - (a.data.year ?? 0);
		if (yearComparison !== 0) return yearComparison;

		const aDate = a.data.review.reviewedAt ?? a.data.source.lastCheckedAt ?? a.data.source.firstSeenAt;
		const bDate = b.data.review.reviewedAt ?? b.data.source.lastCheckedAt ?? b.data.source.firstSeenAt;
		const dateComparison = bDate.localeCompare(aDate);
		if (dateComparison !== 0) return dateComparison;

		return a.data.title.localeCompare(b.data.title);
	});
}

export function getPostsForLanguage(posts: BlogEntry[], lang: UILanguage): BlogEntry[] {
	return sortBlogPostsByDate(posts.filter((post) => post.id.startsWith(`${lang}/`)));
}

export function isBriefPost(post: BlogEntry): boolean {
	const tags = post.data.tags ?? [];
	const category = post.data.category;
	return [...tags, category].some((value) => briefMarkers.has(normalizeMarker(value)));
}

export function getLatestBriefPosts(posts: BlogEntry[], limit = 3): BlogEntry[] {
	return sortBlogPostsByDate(posts.filter(isBriefPost)).slice(0, limit);
}

export function getLatestBlogPosts(posts: BlogEntry[], limit = 6): BlogEntry[] {
	return sortBlogPostsByDate(posts.filter((post) => !isBriefPost(post))).slice(0, limit);
}

export function getHomepageLibraryPicks(
	resources: ResourceEntry[],
	papers: PaperEntry[],
	limit = 4,
): HomepageLibraryPick[] {
	const approvedResources = getApprovedResources(resources);
	const approvedPapers = getApprovedPapers(papers);
	const featuredResources = getFeaturedResources(approvedResources, Math.min(limit, 3));
	const paperLimit = Math.max(0, limit - featuredResources.length);
	const featuredPapers = sortPapersByFreshness(approvedPapers).slice(0, paperLimit);

	return [
		...featuredResources.map((resource) => ({
			kind: 'resource' as const,
			id: resource.data.id,
			resource,
		})),
		...featuredPapers.map((paper) => ({
			kind: 'paper' as const,
			id: paper.data.id,
			paper,
		})),
	].slice(0, limit);
}

export function getHomepageSectionCounts(
	resources: ResourceEntry[],
	papers: PaperEntry[],
	decks: DeckMeta[],
): HomepageSectionCounts {
	const approvedResources = getApprovedResources(resources);
	const approvedPapers = getApprovedPapers(papers);

	return Object.fromEntries(
		librarySections.map((section) => {
			if (section.kind === 'papers') return [section.id, approvedPapers.length];
			if (section.kind === 'decks') return [section.id, decks.length];

			return [
				section.id,
				approvedResources.filter((resource) => resource.data.section === section.resourceSection).length,
			];
		}),
	) as HomepageSectionCounts;
}
