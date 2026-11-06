import { ui, type UILanguage } from '../i18n/ui.ts';

// The Reading section's views (docs/decisions/site-structure.md, Revision
// 2026-10-23c): 해설 is the section's front page, 신호 and 주간 노트 follow.
// Pure, so the "hidden when empty" rule is unit-tested.

export const readingTabIds = ['explainers', 'signals', 'weekly'] as const;
export type ReadingTabId = (typeof readingTabIds)[number];

/**
 * Slugs under /{lang}/library/ that may never be a pick section: the item
 * pages (`item`) and the three paths that used to be Library views and now
 * redirect to /{lang}/reading/ (vercel.json). Kept reserved so a pick section
 * can never shadow those redirects. scripts/validate-picks.mjs enforces it.
 */
export const reservedLibrarySlugs = ['signals', 'explainers', 'weekly', 'item'] as const;

export function getReadingTabUrl(lang: UILanguage, tab: ReadingTabId): string {
	return tab === 'explainers' ? `/${lang}/reading/` : `/${lang}/reading/${tab}/`;
}

export type ReadingTab = { id: ReadingTabId; href: string; label: string; count: number };

/**
 * The tabs to show, in fixed order. A tab with no published items is omitted,
 * and so is the whole bar while nothing at all is published (the page then
 * shows one empty line). `current` is always kept once the bar shows, so the
 * reader never stands on a view that is missing from it.
 */
export function getReadingTabs(lang: UILanguage, counts: Record<ReadingTabId, number>, current?: ReadingTabId): ReadingTab[] {
	if (readingTabIds.every((id) => counts[id] === 0)) return [];
	return readingTabIds
		.filter((id) => counts[id] > 0 || id === current)
		.map((id) => ({ id, href: getReadingTabUrl(lang, id), label: ui[lang][`reading.tab.${id}` as const], count: counts[id] }));
}
