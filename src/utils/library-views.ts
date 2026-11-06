import { getCollection } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { buildItemNoteIndex } from './item-notes';
import { getPickSlug } from './picks';
import { getLibraryItems } from './library';

// The Library's one list (docs/decisions/site-structure.md, Revision
// 2026-10-23c): the curated external resources and picks. An item with an owner
// note links to its own page (docs/content/item-notes.md). Explainers, signals
// and weekly notes live in the Reading section (src/utils/reading-views.ts).
export async function getLibraryViewData(lang: UILanguage) {
	const [resources, picks, itemNotes] = await Promise.all([
		getCollection('resources'),
		getCollection('picks'),
		getCollection('itemNotes'),
	]);
	const noteIndex = buildItemNoteIndex({ notes: itemNotes, picks, resources, pickSlug: getPickSlug });
	const items = getLibraryItems(resources, picks, lang, [], noteIndex);
	return { items, noteIndex };
}
