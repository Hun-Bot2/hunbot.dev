import { ui, type UILanguage } from '../i18n/ui.ts';
import { getLibraryArea, libraryAreas, otherLibraryArea } from '../data/libraryAreas.ts';

// The Library's category tabs (docs/decisions/site-structure.md, Revision
// 2026-10-23c): 전체 first, then one tab per 분야 that has at least one item, in
// registry order with 기타 last. Pure, so the counts are unit-tested.

export interface AreaTab {
	/** `all`, or an area id from src/data/libraryAreas.ts. */
	id: string;
	label: string;
	count: number;
	/** Suffix of the `--area-<tint>` token; null for 전체. */
	tint: string | null;
}

export function getAreaTabs(items: ReadonlyArray<{ area: string }>, lang: UILanguage): AreaTab[] {
	const counts = new Map<string, number>();
	for (const item of items) counts.set(item.area, (counts.get(item.area) ?? 0) + 1);
	const order = [...libraryAreas.map((area) => area.id), otherLibraryArea.id];
	const tabs: AreaTab[] = order
		.filter((id) => (counts.get(id) ?? 0) > 0)
		.map((id) => ({ id, label: getLibraryArea(id).label[lang], count: counts.get(id)!, tint: getLibraryArea(id).tint }));
	return [{ id: 'all', label: ui[lang]['library.tab.all'], count: items.length, tint: null }, ...tabs];
}

/**
 * The letters of a card's monogram tile. CJK names use their first character;
 * a Latin name uses the first two letters of its first word (one when the word
 * is a single letter), the first capitalized: "Widget" -> "Wi".
 */
export function getMonogram(title: string): string {
	const trimmed = title.trim();
	const first = Array.from(trimmed)[0] ?? '?';
	if (!/^[A-Za-z]/.test(first)) return first.toUpperCase();
	const word = trimmed.match(/^[A-Za-z]+/)?.[0] ?? first;
	const letters = word.slice(0, 2).toLowerCase();
	return letters.charAt(0).toUpperCase() + letters.slice(1);
}
