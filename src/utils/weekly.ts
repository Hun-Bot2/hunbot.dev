import type { CollectionEntry } from 'astro:content';
import type { UILanguage } from '../i18n/ui';

// Weekly notes (docs/features/signals-and-weekly.md): the owner's conclusions
// for one week. Web and RSS only. Pure helpers (no `astro:content` runtime
// import) so validators and tests load them.

export type WeeklyNoteEntry = CollectionEntry<'weeklyNotes'>;

type PublishedLike = { data: { review: { status: string; humanReviewed: boolean } } };

export function isPublishedWeeklyNote(note: PublishedLike): boolean {
	return note.data.review.status === 'approved' && note.data.review.humanReviewed === true;
}

/** Published notes, newest issue first. */
export function getPublishedWeeklyNotes<T extends PublishedLike & { data: { issue: number } }>(notes: T[]): T[] {
	return notes.filter(isPublishedWeeklyNote).sort((a, b) => b.data.issue - a.data.issue);
}

export function getWeeklyUrl(lang: UILanguage, issue: number): string {
	return `/${lang}/reading/weekly/${issue}/`;
}

export function getWeeklyIndexUrl(lang: UILanguage): string {
	return `/${lang}/reading/weekly/`;
}

export function getWeeklyRssUrl(lang: UILanguage): string {
	return `/${lang}/reading/weekly/rss.xml`;
}

function toUtcDays(day: string): number {
	const [year, month, date] = day.split('-').map(Number);
	return Date.UTC(year, month - 1, date) / 86_400_000;
}

function fromUtcDays(days: number): string {
	return new Date(days * 86_400_000).toISOString().slice(0, 10);
}

/** The Monday-to-Sunday span a note covers: `weekOf` through `weekOf + 6` days. */
export function getWeekRange(weekOf: string): { start: string; end: string } {
	return { start: weekOf, end: fromUtcDays(toUtcDays(weekOf) + 6) };
}

/** Signals whose `keptAt` falls inside the note's week, newest first. */
export function getSignalsForWeek<T extends { data: { keptAt: string; title: string } }>(signals: T[], weekOf: string): T[] {
	const { start, end } = getWeekRange(weekOf);
	return signals
		.filter((signal) => signal.data.keptAt >= start && signal.data.keptAt <= end)
		.sort((a, b) => b.data.keptAt.localeCompare(a.data.keptAt) || a.data.title.localeCompare(b.data.title));
}

/** `2026.10.12` to `10.18`: the week as one mono line. */
export function formatWeekRange(weekOf: string): string {
	const { start, end } = getWeekRange(weekOf);
	const sameYear = start.slice(0, 4) === end.slice(0, 4);
	return `${start.replaceAll('-', '.')} – ${(sameYear ? end.slice(5) : end).replaceAll('-', '.')}`;
}

/** Previous and next published issue around `issue` (notes: published, any order). */
export function getAdjacentIssues<T extends { data: { issue: number } }>(notes: T[], issue: number): { prev: T | null; next: T | null } {
	const ordered = [...notes].sort((a, b) => a.data.issue - b.data.issue);
	const index = ordered.findIndex((note) => note.data.issue === issue);
	return {
		prev: index > 0 ? ordered[index - 1] : null,
		next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
	};
}
