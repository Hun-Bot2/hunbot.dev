import type { UILanguage } from '../i18n/ui';

// The Library's four views (docs/decisions/site-structure.md, Revision
// 2026-10-23). Pure, so the "hidden when empty" rule is unit-tested.

export const libraryTabIds = ['signals', 'explainers', 'weekly', 'resources'] as const;
export type LibraryTabId = (typeof libraryTabIds)[number];

/**
 * Slugs under /{lang}/library/ that belong to a tab. A pick section may never
 * use one (src/pages/[lang]/library/[section].astro would collide);
 * scripts/validate-picks.mjs enforces it.
 */
export const reservedLibrarySlugs = ['signals', 'explainers', 'weekly'] as const;

export function getLibraryTabUrl(lang: UILanguage, tab: LibraryTabId): string {
	return tab === 'resources' ? `/${lang}/library/` : `/${lang}/library/${tab}/`;
}

export type LibraryTab = { id: LibraryTabId; href: string; count: number };

/**
 * The tabs to show, in fixed order. A tab with no published items is omitted;
 * 자료 (resources) always exists, so the Library is never without a view.
 */
export function getLibraryTabs(lang: UILanguage, counts: Record<LibraryTabId, number>): LibraryTab[] {
	return libraryTabIds
		.filter((id) => id === 'resources' || counts[id] > 0)
		.map((id) => ({ id, href: getLibraryTabUrl(lang, id), count: counts[id] }));
}
