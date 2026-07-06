import type { CollectionEntry } from 'astro:content';

export const ACADEMIC_REVIEW_LANGUAGES = ['ko', 'jp', 'en'] as const;

export type AcademicReviewLanguage = (typeof ACADEMIC_REVIEW_LANGUAGES)[number];
export type AcademicReviewEntry = CollectionEntry<'academicReviews'>;

type AcademicReviewLike = {
	id: string;
	filePath?: string;
};

function normalizeAcademicReviewId(reviewId: string): string {
	const normalized = reviewId
		.trim()
		.replace(/\\/g, '/')
		.replace(/^\/+|\/+$/g, '')
		.replace(/\.(md|mdx)$/i, '')
		.toLowerCase();

	if (!normalized) {
		throw new Error(`Invalid academic review content id: ${reviewId}`);
	}

	return normalized;
}

function normalizeLanguage(lang: string | null | undefined, context: string): AcademicReviewLanguage {
	if (isAcademicReviewLanguage(lang)) {
		return lang;
	}

	throw new Error(`Invalid academic review language for ${context}: ${String(lang)}`);
}

export function isAcademicReviewLanguage(value: unknown): value is AcademicReviewLanguage {
	return typeof value === 'string' && ACADEMIC_REVIEW_LANGUAGES.includes(value as AcademicReviewLanguage);
}

export function getAcademicReviewLanguageFromId(
	reviewId: string,
	fallbackLang?: string | null,
): AcademicReviewLanguage {
	const [lang] = normalizeAcademicReviewId(reviewId).split('/');
	if (isAcademicReviewLanguage(lang)) {
		return lang;
	}

	if (fallbackLang !== undefined && fallbackLang !== null) {
		return normalizeLanguage(fallbackLang, `fallback for ${reviewId}`);
	}

	throw new Error(`Invalid academic review content id: ${reviewId}`);
}

export function getAcademicReviewSlugFromId(reviewId: string): string {
	const segments = normalizeAcademicReviewId(reviewId).split('/');
	const slugSegments = isAcademicReviewLanguage(segments[0]) ? segments.slice(1) : segments;
	const slug = slugSegments.join('/');
	if (!slug) {
		throw new Error(`Invalid academic review content id: ${reviewId}`);
	}

	return slug;
}

export function getAcademicReviewLanguageFromRouteParam(
	lang: string | null | undefined,
): AcademicReviewLanguage {
	return normalizeLanguage(lang, 'route param');
}

export function getAcademicReviewLanguageFromContentPath(contentPath: string): AcademicReviewLanguage {
	const segments = contentPath
		.replace(/\\/g, '/')
		.split('/')
		.filter(Boolean);

	for (let index = 0; index < segments.length - 1; index += 1) {
		if (segments[index] === 'academic-reviews' && isAcademicReviewLanguage(segments[index + 1])) {
			return segments[index + 1];
		}
	}

	throw new Error(`Invalid academic review content path: ${contentPath}`);
}

export function getAcademicReviewLanguageFromEntry(review: AcademicReviewLike): AcademicReviewLanguage {
	try {
		return getAcademicReviewLanguageFromId(review.id);
	} catch (error) {
		if (review.filePath) {
			return getAcademicReviewLanguageFromContentPath(review.filePath);
		}

		throw error;
	}
}

export function getAcademicReviewUrlFromId(reviewId: string, fallbackLang?: string | null): string {
	const lang = getAcademicReviewLanguageFromId(reviewId, fallbackLang);
	const slug = getAcademicReviewSlugFromId(reviewId);
	return `/${lang}/reviews/${slug}/`;
}

export function getAcademicReviewUrlFromEntry(review: AcademicReviewLike): string {
	return getAcademicReviewUrlFromId(review.id, getAcademicReviewLanguageFromEntry(review));
}

export function sortAcademicReviewsByDateDesc(reviews: AcademicReviewEntry[]): AcademicReviewEntry[] {
	return [...reviews].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function filterAcademicReviewsByLanguage(
	reviews: AcademicReviewEntry[],
	lang: AcademicReviewLanguage,
): AcademicReviewEntry[] {
	return reviews.filter((review) => {
		try {
			return getAcademicReviewLanguageFromEntry(review) === lang;
		} catch {
			return false;
		}
	});
}

export function getAcademicReviewsByLanguage(
	reviews: AcademicReviewEntry[],
	lang: AcademicReviewLanguage,
): AcademicReviewEntry[] {
	return sortAcademicReviewsByDateDesc(filterAcademicReviewsByLanguage(reviews, lang));
}

export function formatPaperAuthors(authors: string[], visibleCount = 3): string {
	if (authors.length <= visibleCount) return authors.join(', ');
	return `${authors.slice(0, visibleCount).join(', ')} et al.`;
}

export function getAcademicReviewDescription(review: AcademicReviewEntry): string {
	const { paper } = review.data;
	const sourceParts = [paper.venue, paper.year ? String(paper.year) : null].filter(Boolean);
	const source = sourceParts.length > 0 ? ` (${sourceParts.join(', ')})` : '';
	return `Academic review of "${paper.title}"${source}.`;
}
