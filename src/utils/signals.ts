import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';

// Signals: items that passed the owner's filter, each with a verdict and a
// one-line reason (docs/features/signals-and-weekly.md). Pure helpers only (no
// `astro:content` runtime import) so Node validators and tests can load them.

export type SignalEntry = CollectionEntry<'signals'>;

export const signalVerdicts = ['confirmed', 'doubt', 'try'] as const;
export type SignalVerdict = (typeof signalVerdicts)[number];

type PublishedLike = { data: { review: { status: string; humanReviewed: boolean } } };

/**
 * The single definition of a *published* signal (and of any reviewed record in
 * this family): approved by the owner and human reviewed. Everything else
 * renders nowhere.
 */
export function isPublishedRecord(record: PublishedLike): boolean {
	return record.data.review.status === 'approved' && record.data.review.humanReviewed === true;
}

export function getPublishedSignals<T extends PublishedLike>(signals: T[]): T[] {
	return signals.filter(isPublishedRecord);
}

/** Entry slug is the frontmatter `id` (validated to equal the file name). */
export function getSignalSlug(signal: { id: string; data: { id?: string } }): string {
	return signal.data.id ?? signal.id;
}

type SignalLike = { id: string; data: { id?: string; keptAt: string; title: string } };

/** Newest `keptAt` first; ties by title so the order never depends on input order. */
export function sortSignals<T extends SignalLike>(signals: T[]): T[] {
	return [...signals].sort((a, b) => b.data.keptAt.localeCompare(a.data.keptAt) || a.data.title.localeCompare(b.data.title));
}

export type SignalDay<T> = { day: string; signals: T[] };

/** Groups (already sorted) signals by `keptAt` day, newest day first. */
export function groupSignalsByDay<T extends SignalLike>(signals: T[]): SignalDay<T>[] {
	const days: SignalDay<T>[] = [];
	for (const signal of sortSignals(signals)) {
		const last = days[days.length - 1];
		if (last && last.day === signal.data.keptAt) last.signals.push(signal);
		else days.push({ day: signal.data.keptAt, signals: [signal] });
	}
	return days;
}

type ExplainerLike = { id: string; data: { id?: string; title: string; publishedAt: string; signals?: string[]; review: { status: string; humanReviewed: boolean } } };
type PostLike = { id: string; data: { title: string; pubDate: Date; signals?: string[] } };

export type SignalLineage = {
	explainers: Array<{ id: string; title: string }>;
	posts: Array<{ id: string; title: string }>;
};

/**
 * "Where it led": derived from the later artifacts' declarations, never from
 * the signal. A declaration pointing at an unpublished explainer is withheld.
 * `posts` must already be the published posts of the page language.
 */
export function getSignalLineage(
	signalId: string,
	explainers: ExplainerLike[],
	posts: PostLike[],
): SignalLineage {
	return {
		explainers: explainers
			.filter((explainer) => isPublishedRecord(explainer) && (explainer.data.signals ?? []).includes(signalId))
			.sort((a, b) => b.data.publishedAt.localeCompare(a.data.publishedAt))
			.map((explainer) => ({ id: explainer.data.id ?? explainer.id, title: explainer.data.title })),
		posts: posts
			.filter((post) => (post.data.signals ?? []).includes(signalId))
			.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
			.map((post) => ({ id: post.id, title: post.data.title })),
	};
}

export function getSignalsUrl(lang: UILanguage): string {
	return `/${lang}/reading/signals/`;
}

/** The most recent `keptAt` day and its signals (the hero's "today's signals"). */
export function getLatestSignalDay<T extends SignalLike>(signals: T[]): SignalDay<T> | null {
	return groupSignalsByDay(signals)[0] ?? null;
}
