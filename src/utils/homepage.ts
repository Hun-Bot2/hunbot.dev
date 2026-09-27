import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { sortStable } from './ordering.ts';

export type BlogEntry = CollectionEntry<'blog'>;

const briefMarkers = new Set(['brief', 'briefs', 'library-brief', 'library-briefs', 'editorial-brief']);

function normalizeMarker(value: string | undefined): string {
	return value?.trim().toLowerCase().replace(/\s+/g, '-') ?? '';
}

function sortBlogPostsByDate(posts: BlogEntry[]): BlogEntry[] {
	// Date alone is not a total order — several posts share a pubDate, and their
	// relative order then depends on input order. sortStable appends an id tiebreak.
	return sortStable(posts, (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
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

// getHomepageLibraryPicks and getHomepageSectionCounts (papers+resources
// featured picks, per-section counts) are gone: the homepage's "큐레이션"
// panel is replaced by a Useful Feeds panel (src/utils/library.ts's
// getUsefulFeedItems) and the Library block now reads picks directly
// (src/utils/picks.ts's getRecentPicks) — see src/pages/[lang]/index.astro
// and docs/decisions/site-structure.md, revision 2026-09-27.
