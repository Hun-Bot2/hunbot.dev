import { getCollection } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { getAllPosts, getPostsByLanguage } from './blog';
import { getPublishedExplainers } from './explainers';
import { getReadingTabs, type ReadingTabId } from './reading-tabs';
import { getPublishedSignals, sortSignals } from './signals';
import { getPublishedWeeklyNotes } from './weekly';

// What the Reading views share (docs/decisions/site-structure.md, Revision
// 2026-10-23c): the published records of each kind and the tab list derived
// from their counts. Pages only; validators and tests use the pure helpers it
// composes. Every route reads these kinds through the `getPublished*` helpers,
// never `getCollection` alone.
export async function getReadingViewData(lang: UILanguage, current?: ReadingTabId) {
	const [explainers, signals, weeklyNotes, allPosts] = await Promise.all([
		getCollection('explainers'),
		getCollection('signals'),
		getCollection('weeklyNotes'),
		getAllPosts(),
	]);
	const publishedExplainers = getPublishedExplainers(explainers);
	const publishedSignals = sortSignals(getPublishedSignals(signals));
	const publishedNotes = getPublishedWeeklyNotes(weeklyNotes);

	return {
		explainers: publishedExplainers,
		signals: publishedSignals,
		weeklyNotes: publishedNotes,
		/** Published posts of the page language, for the signals' lineage links. */
		posts: getPostsByLanguage(allPosts, lang),
		tabs: getReadingTabs(
			lang,
			{ explainers: publishedExplainers.length, signals: publishedSignals.length, weekly: publishedNotes.length },
			current,
		),
		isEmpty: publishedExplainers.length + publishedSignals.length + publishedNotes.length === 0,
	};
}
