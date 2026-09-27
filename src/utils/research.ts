import type { CollectionEntry } from 'astro:content';
import { getApprovedPapers, getFeaturedPapers, type PaperEntry, type TopicEntry } from './library.ts';
import { sortStable } from './ordering.ts';
import { buildTopicIndex, resolveToActiveTopicId } from '../../scripts/lib/topic-resolution.mjs';

export type AcademicReviewEntry = CollectionEntry<'academicReviews'>;
export type BlogEntry = CollectionEntry<'blog'>;

/**
 * The Research hub's "Study log" section (docs/decisions/site-structure.md):
 * approved paper cards with a non-null `studiedAt`, newest study first. The
 * public face of C4 (docs/decisions/research-item-identity.md) — a verified
 * bibliographic record plus a dated statement that the paper was studied.
 */
export function getStudyLog(papers: PaperEntry[]): PaperEntry[] {
	const studied = getApprovedPapers(papers).filter(
		(paper): paper is PaperEntry & { data: { studiedAt: string } } => paper.data.studiedAt !== null,
	);

	// studiedAt is a YYYY-MM-DD string; lexical order is chronological order.
	return sortStable(studied, (a, b) => {
		const dateComparison = b.data.studiedAt.localeCompare(a.data.studiedAt);
		if (dateComparison !== 0) return dateComparison;
		return a.data.title.localeCompare(b.data.title);
	});
}

/**
 * The Research hub's "Selected, not yet studied" section: approved paper
 * cards with `studiedAt: null`. A reading *log*, never a queue —
 * `readingState` stays forbidden in this projection (site-structure.md).
 * Ordered by the same freshness rule the Library hub used to show these
 * under (getFeaturedPapers), so the same paper set never appears in two
 * different orders on two pages of the same site.
 */
export function getSelectedNotYetStudied(papers: PaperEntry[]): PaperEntry[] {
	const selected = getApprovedPapers(papers).filter((paper) => paper.data.studiedAt === null);
	return getFeaturedPapers(selected, selected.length);
}

/**
 * The one review linking to this paper card, if any. Links are declared on
 * the review (`paperId`) and derived here on the paper — a paper card never
 * lists its own reviews (site-structure.md#Linking-reviews-and-posts-to-paper-cards).
 */
export function getReviewForPaper(reviews: AcademicReviewEntry[], paperId: string): AcademicReviewEntry | null {
	return reviews.find((review) => review.data.paperId === paperId) ?? null;
}

/**
 * Every post linking to this paper card via its `papers` frontmatter field.
 * Same derived-not-declared direction as getReviewForPaper.
 */
export function getPostsForPaper(posts: BlogEntry[], paperId: string): BlogEntry[] {
	return posts.filter((post) => post.data.papers.includes(paperId));
}

export type TopicWithLinkedPapers = { topic: TopicEntry; papers: PaperEntry[] };

/**
 * Active topics with at least one linked approved paper card, grouped by the
 * *current* active topic a paper's `topics` entry resolves to (an id, an
 * owned alias, or a bounded mergedInto chain — scripts/lib/topic-resolution.mjs,
 * the same implementation the validators use). This is both
 * the Research hub's "Topics" section list and the gate for which topic
 * pages get built (docs/decisions/site-structure.md#Topic-pages): a topic
 * with zero linked papers renders neither.
 */
export function getTopicsWithLinkedPapers(topics: TopicEntry[], papers: PaperEntry[]): TopicWithLinkedPapers[] {
	const topicIndex = buildTopicIndex(topics);
	const approvedPapers = getApprovedPapers(papers);

	const papersByActiveTopicId = new Map<string, PaperEntry[]>();
	for (const paper of approvedPapers) {
		// A paper counts once per topic even if two of its stored references
		// resolve to the same active topic (e.g. a current id and a stale alias
		// both written down).
		const resolvedIds = new Set(
			paper.data.topics
				.map((topicRef) => resolveToActiveTopicId(topicRef, topicIndex))
				.filter((id): id is string => id !== null),
		);

		for (const topicId of resolvedIds) {
			const existing = papersByActiveTopicId.get(topicId) ?? [];
			existing.push(paper);
			papersByActiveTopicId.set(topicId, existing);
		}
	}

	return topics
		.filter((topic) => topic.data.status === 'active')
		.map((topic) => ({ topic, papers: papersByActiveTopicId.get(topic.data.id) ?? [] }))
		.filter((entry) => entry.papers.length > 0);
}

/** Reviews linked to any paper in the given set (a topic page's content). */
export function getReviewsForPapers(reviews: AcademicReviewEntry[], paperIds: readonly string[]): AcademicReviewEntry[] {
	const idSet = new Set(paperIds);
	return reviews.filter((review) => review.data.paperId !== undefined && idSet.has(review.data.paperId));
}

/** Posts linked to any paper in the given set (a topic page's content). */
export function getPostsForPapers(posts: BlogEntry[], paperIds: readonly string[]): BlogEntry[] {
	const idSet = new Set(paperIds);
	return posts.filter((post) => post.data.papers.some((paperId) => idSet.has(paperId)));
}
