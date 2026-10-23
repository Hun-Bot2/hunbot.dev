// Pure logic for the Library hero (src/components/library/LibraryHero.astro):
// which items become slides, and how a headline is split into the words that
// reveal one by one. No `astro:content` import, so node:test can run it.

import { getSignalsForWeek } from './weekly.ts';

export const HERO_SLIDE_LIMIT = 4;
export const HERO_SIGNAL_TITLES = 3;

type Dated = { data: { keptAt: string; title: string; verdict: string } };
type SignalInput = Dated & { id: string };

type ExplainerInput = {
	id: string;
	data: {
		id?: string;
		title: string;
		dek: string;
		publishedAt: string;
		source: { language: 'ko' | 'en' | 'ja'; kind: 'paper' | 'article' };
		image?: { kind: string; src?: string; width?: number; height?: number };
	};
};

type WeeklyInput = {
	id: string;
	data: { issue: number; title: string; dek: string; weekOf: string; publishedAt: string };
};

type ItemInput = {
	id: string;
	title: string;
	url: string;
	kind: string;
	date: string;
	description?: string;
	image: { kind: string; src?: string; width?: number; height?: number };
};

export type HeroImage = { src: string; width?: number; height?: number };

export type HeroSlide =
	| { kind: 'explainer'; key: string; slug: string; title: string; description: string; date: string; sourceLanguage: 'ko' | 'en' | 'ja'; sourceKind: 'paper' | 'article'; image: HeroImage | null }
	| { kind: 'weekly'; key: string; issue: number; title: string; description: string; date: string; signalCount: number; image: null }
	| { kind: 'signals'; key: string; day: string; title: string; count: number; items: Array<{ title: string; verdict: string }>; image: null }
	| { kind: 'item'; key: string; url: string; itemKind: string; title: string; description: string; date: string; image: HeroImage | null };

function toImage(image: { kind: string; src?: string; width?: number; height?: number } | undefined): HeroImage | null {
	if (!image || image.kind === 'typographic' || !image.src) return null;
	return { src: image.src, width: image.width, height: image.height };
}

const newest = <T>(items: readonly T[], date: (item: T) => string, tie: (item: T) => string): T[] =>
	[...items].sort((a, b) => date(b).localeCompare(date(a)) || tie(a).localeCompare(tie(b)));

export type HeroInput = {
	/** Published only. */
	explainers: readonly ExplainerInput[];
	/** Published only. */
	weeklyNotes: readonly WeeklyInput[];
	/** Published only. */
	signals: readonly SignalInput[];
	/** The 자료 list (resources and picks), newest first or not: sorted here. */
	items: readonly ItemInput[];
	/** The headline of the signals slide (a translated label). */
	signalsTitle: string;
	limit?: number;
};

/**
 * At most `limit` slides: the latest published explainer, the latest weekly
 * note, "today's signals" (the most recent keptAt day), then the newest 자료
 * items to fill the rest, so the hero exists before any of the new kinds are
 * published. Items with a preview image come first. Fewer than two slides means
 * a single static slide (the caller decides; this returns what exists).
 */
export function selectHeroSlides(input: HeroInput): HeroSlide[] {
	const limit = input.limit ?? HERO_SLIDE_LIMIT;
	const slides: HeroSlide[] = [];

	const explainer = newest(input.explainers, (e) => e.data.publishedAt, (e) => e.data.title)[0];
	if (explainer) {
		slides.push({
			kind: 'explainer',
			key: `explainer-${explainer.data.id ?? explainer.id}`,
			slug: explainer.data.id ?? explainer.id,
			title: explainer.data.title,
			description: explainer.data.dek,
			date: explainer.data.publishedAt,
			sourceLanguage: explainer.data.source.language,
			sourceKind: explainer.data.source.kind,
			image: toImage(explainer.data.image),
		});
	}

	const note = [...input.weeklyNotes].sort((a, b) => b.data.issue - a.data.issue)[0];
	if (note) {
		slides.push({
			kind: 'weekly',
			key: `weekly-${note.data.issue}`,
			issue: note.data.issue,
			title: note.data.title,
			description: note.data.dek,
			date: note.data.publishedAt,
			signalCount: getSignalsForWeek([...input.signals], note.data.weekOf).length,
			image: null,
		});
	}

	const sortedSignals = newest(input.signals, (s) => s.data.keptAt, (s) => s.data.title);
	if (sortedSignals.length > 0) {
		const day = sortedSignals[0].data.keptAt;
		const ofDay = sortedSignals.filter((s) => s.data.keptAt === day);
		slides.push({
			kind: 'signals',
			key: `signals-${day}`,
			day,
			title: input.signalsTitle,
			count: ofDay.length,
			items: ofDay.slice(0, HERO_SIGNAL_TITLES).map((s) => ({ title: s.data.title, verdict: s.data.verdict })),
			image: null,
		});
	}

	if (slides.length < limit) {
		const withImage = (item: ItemInput) => toImage(item.image) !== null;
		const ordered = newest(input.items, (item) => item.date, (item) => item.title);
		const fill = [...ordered.filter(withImage), ...ordered.filter((item) => !withImage(item))];
		for (const item of fill.slice(0, limit - slides.length)) {
			slides.push({
				kind: 'item',
				key: `item-${item.id}`,
				url: item.url,
				itemKind: item.kind,
				title: item.title,
				description: item.description ?? '',
				date: item.date,
				image: toImage(item.image),
			});
		}
	}

	return slides.slice(0, limit);
}

export type HeadlineWord = { text: string; spaceAfter: boolean };

/**
 * Split a headline into reveal units. Japanese has no spaces, so it uses a word
 * segmenter; ko and en split on spaces (a Latin word glued to a Hangul
 * particle, like "Boot와", stays one unit). Spaces become `spaceAfter`, and
 * punctuation sticks to the word before it so a line never starts with a
 * closing mark.
 */
export function splitHeadline(title: string, lang: string): HeadlineWord[] {
	const words: HeadlineWord[] = [];
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
