// Pure logic for the home hero (src/components/home/HomeHero.astro): which
// items become slides, and how a headline is split into the words that reveal
// one by one. No `astro:content` import, so node:test can run it directly.

export const HERO_SLIDE_LIMIT = 4;

type PostLike = {
	id: string;
	data: { title: string; description: string; pubDate: Date; heroImage?: string | undefined };
};

type ReviewLike = {
	id: string;
	data: { title: string; pubDate: Date; paper: { title: string; venue?: string | undefined; year?: number | undefined } };
};

export type HeroSlide<P extends PostLike = PostLike, R extends ReviewLike = ReviewLike> =
	| { kind: 'post'; entry: P; title: string; description: string; date: Date; heroImage: string | undefined }
	| { kind: 'review'; entry: R; title: string; description: string; date: Date; heroImage: undefined };

const newestFirst = <T extends { data: { pubDate: Date } }>(items: readonly T[]): T[] =>
	[...items].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

/**
 * Newest `limit` posts; when a review is published, the newest review replaces
 * the last slot. `posts` and `reviews` are already filtered to published items
 * of the page language (getAllPosts() / getPublishedAcademicReviews()).
 * Fewer than two slides means the hero is a single static slide (the caller
 * decides; this just returns what exists).
 */
export function selectHeroSlides<P extends PostLike, R extends ReviewLike>(
	posts: readonly P[],
	reviews: readonly R[],
	limit = HERO_SLIDE_LIMIT,
): HeroSlide<P, R>[] {
	const newestReview = newestFirst(reviews)[0];
	const postSlots = newestReview ? Math.max(limit - 1, 0) : limit;

	const slides: HeroSlide<P, R>[] = newestFirst(posts)
		.slice(0, postSlots)
		.map((entry) => ({
			kind: 'post' as const,
			entry,
			title: entry.data.title,
			description: entry.data.description,
			date: entry.data.pubDate,
			heroImage: entry.data.heroImage,
		}));

	if (newestReview && limit > 0) {
		const { paper } = newestReview.data;
		const source = [paper.venue, paper.year ? String(paper.year) : null].filter(Boolean).join(' · ');
		slides.push({
			kind: 'review',
			entry: newestReview,
			title: newestReview.data.title,
			description: [paper.title, source].filter(Boolean).join(' — '),
			date: newestReview.data.pubDate,
			heroImage: undefined,
		});
	}
	return slides;
}

export type HeadlineWord = { text: string; spaceAfter: boolean };

/**
 * Split a headline into reveal units. Uses the word segmenter of the page
 * language (Japanese has no spaces, so it uses a word segmenter); spaces become
 * `spaceAfter`, and punctuation sticks to the word before it so a line never
 * starts with a closing mark.
 */
export function splitHeadline(title: string, lang: string): HeadlineWord[] {
	const words: HeadlineWord[] = [];
	// Only Japanese needs a dictionary segmenter; ko and en words are space-separated
	// (a Latin word glued to a Hangul particle, like "Boot와", must stay one unit).
	const segments: Array<{ segment: string; isWordLike?: boolean }> =
		lang === 'jp' && typeof Intl.Segmenter === 'function'
			? Array.from(new Intl.Segmenter('ja', { granularity: 'word' }).segment(title))
			: title
					.split(/(\s+)/)
					.filter(Boolean)
					.map((segment) => ({ segment, isWordLike: !/^\s+$/.test(segment) }));

	for (const { segment, isWordLike } of segments) {
		const last = words[words.length - 1];
		if (/^\s+$/.test(segment)) {
			if (last) last.spaceAfter = true;
		} else if (!isWordLike && last && !last.spaceAfter) {
			last.text += segment;
		} else {
			words.push({ text: segment, spaceAfter: false });
		}
	}
	return words;
}

/** The big word on the typographic plate used when a slide has no image. */
export function plateWord(title: string, lang: string): string {
	return splitHeadline(title, lang)[0]?.text ?? title;
}
