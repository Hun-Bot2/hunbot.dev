import { getCollection } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { getAllPosts, getPostsByLanguage } from './blog';
import { getPublishedExplainers } from './explainers';
import { buildItemNoteIndex } from './item-notes';
import { getPickSlug } from './picks';
import { getLibraryItems } from './library';
import { getLibraryTabs } from './library-tabs';
import { getPublishedSignals, sortSignals } from './signals';
import { getPublishedWeeklyNotes } from './weekly';

// What the four Library views share (docs/decisions/site-structure.md,
// Revision 2026-10-23): the published records of each kind and the tab list
// derived from their counts. Pages only; validators and tests use the pure
// helpers it composes. Every route reads the new kinds through the
// `getPublished*` helpers, never `getCollection` alone.
export async function getLibraryViewData(lang: UILanguage) {
	const [resources, picks, explainers, signals, weeklyNotes, itemNotes, allPosts] = await Promise.all([
		getCollection('resources'),
		getCollection('picks'),
		getCollection('explainers'),
		getCollection('signals'),
		getCollection('weeklyNotes'),
		getCollection('itemNotes'),
		getAllPosts(),
	]);

	// 자료: the external list only (explainers have their own view now).
	// An item with an owner note links to its own page (docs/content/item-notes.md).
	const noteIndex = buildItemNoteIndex({ notes: itemNotes, picks, resources, pickSlug: getPickSlug });
	const items = getLibraryItems(resources, picks, lang, [], noteIndex);
	const publishedExplainers = getPublishedExplainers(explainers);
	const publishedSignals = sortSignals(getPublishedSignals(signals));
	const publishedNotes = getPublishedWeeklyNotes(weeklyNotes);

	return {
		items,
		noteIndex,
		explainers: publishedExplainers,
		signals: publishedSignals,
		weeklyNotes: publishedNotes,
		/** Published posts of the page language, for the signals' lineage links. */
		posts: getPostsByLanguage(allPosts, lang),
		tabs: getLibraryTabs(lang, {
			signals: publishedSignals.length,
			explainers: publishedExplainers.length,
			weekly: publishedNotes.length,
			resources: items.length,
		}),
	};
}
