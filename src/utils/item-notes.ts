import type { UILanguage } from '../i18n/ui';

// Item notes (docs/content/item-notes.md): the owner's own commentary on one
// 자료 item. Every published item has an on-site page; a note fills it. Pure
// helpers only (no `astro:content` runtime import) so Node validators and tests
// can load them.

export type ItemRef = { kind: 'resource' | 'pick'; id: string };

/** Parses `resource:<id>` / `pick:<slug>`; anything else is null. */
export function parseAbout(about: unknown): ItemRef | null {
	if (typeof about !== 'string') return null;
	const match = about.match(/^(resource|pick):([a-z0-9][a-z0-9-]*)$/);
	return match ? { kind: match[1] as ItemRef['kind'], id: match[2] } : null;
}

/** `resource:<id>` / `pick:<slug>`: the one key an item and its note share. */
export function itemKey(ref: ItemRef): string {
	return `${ref.kind}:${ref.id}`;
}

/** The item page: `/{lang}/library/item/{id}/`, id = resource id or pick slug. */
export function getItemUrl(lang: UILanguage, pageId: string): string {
	return `/${lang}/library/item/${pageId}/`;
}

/** A resource id and a pick slug share one URL space; a collision would hide a page. */
export function findPageIdCollisions(resourceIds: string[], pickSlugs: string[]): string[] {
	const resources = new Set(resourceIds);
	return pickSlugs.filter((slug) => resources.has(slug));
}

/**
 * A note body without HTML comments. `npm run note:new` writes a draft whose
 * body is only a placeholder comment; that is an empty note until the owner
 * writes something, so it never counts as published.
 */
export function noteBodyText(body: string | undefined): string {
	return (body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Every published 자료 item has a page, with or without a note
 * (docs/decisions/site-structure.md, Revision 2026-10-23c): the page id of each
 * approved resource and each non-draft pick (resource id / pick slug).
 */
export function getPublishedItemPageIds(input: {
	picks: Pick<PickLike, 'id' | 'data'>[];
	resources: ResourceLike[];
	pickSlug: (id: string) => string;
}): string[] {
	const resourceIds = input.resources
		.filter((r) => r.data.status === 'approved' && r.data.review.humanReviewed === true)
		.map((r) => r.data.id);
	const pickSlugs = input.picks.filter((p) => p.data.draft !== true).map((p) => input.pickSlug(p.id));
	return [...resourceIds, ...pickSlugs];
}

export interface ItemNote {
	/** URL id: the resource id or the pick slug. */
	pageId: string;
	ref: ItemRef;
	/** Where the note comes from: an `item-notes` file, or the pick's own body. */
	origin: 'note' | 'pick';
	body: string;
	writtenAt: string;
	updatedAt: string | null;
	tags: string[];
	/** 'bot': a draft written from public sources and reviewed by the owner. */
	authorship: 'owner' | 'bot';
	sources: string[];
	reviewedAt: string | null;
}

type NoteLike = {
	data: { about: string; writtenAt: string; updatedAt?: string; draft?: boolean; tags?: string[]; authorship?: 'owner' | 'bot'; sources?: string[]; reviewedAt?: string };
	body?: string;
};
type PickLike = { id: string; data: { draft?: boolean; addedAt: unknown; tags?: never }; body?: string };
type ResourceLike = { data: { id: string; status: string; review: { humanReviewed: boolean } } };

const isDate = (value: unknown) => String(value).slice(0, 10);

/**
 * The published notes, keyed by page id. A note counts when it is not a draft,
 * its `about` resolves to a published item (an approved resource, a non-draft
 * pick) and its body is not empty. A pick with a non-empty body is its own note.
 * If an item somehow has both, the explicit note wins (the validator forbids it).
 */
export function buildItemNoteIndex(input: {
	notes: NoteLike[];
	picks: PickLike[];
	resources: ResourceLike[];
	pickSlug: (id: string) => string;
}): Map<string, ItemNote> {
	const index = new Map<string, ItemNote>();
	const approved = new Set(
		input.resources.filter((r) => r.data.status === 'approved' && r.data.review.humanReviewed === true).map((r) => r.data.id),
	);
	const publishedPicks = new Map(input.picks.filter((p) => p.data.draft !== true).map((p) => [input.pickSlug(p.id), p]));

	for (const pick of publishedPicks.values()) {
		const body = noteBodyText(pick.body);
		if (!body) continue;
		const slug = input.pickSlug(pick.id);
		index.set(slug, { pageId: slug, ref: { kind: 'pick', id: slug }, origin: 'pick', body, writtenAt: isDate(pick.data.addedAt), updatedAt: null, tags: [], authorship: 'owner', sources: [], reviewedAt: null });
	}

	for (const note of input.notes) {
		if (note.data.draft === true) continue;
		const ref = parseAbout(note.data.about);
		const body = noteBodyText(note.body);
		if (!ref || !body) continue;
		if (ref.kind === 'resource' ? !approved.has(ref.id) : !publishedPicks.has(ref.id)) continue;
		const authorship = note.data.authorship ?? 'owner';
		// A bot note is never shown before the owner has reviewed it.
		if (authorship === 'bot' && !note.data.reviewedAt) continue;
		index.set(ref.id, {
			pageId: ref.id,
			ref,
			origin: 'note',
			body,
			writtenAt: isDate(note.data.writtenAt),
			updatedAt: note.data.updatedAt ? isDate(note.data.updatedAt) : null,
			tags: note.data.tags ?? [],
			authorship,
			sources: note.data.sources ?? [],
			reviewedAt: note.data.reviewedAt ? isDate(note.data.reviewedAt) : null,
		});
	}
	return index;
}

/** The longest run of characters two strings share, as a length (for the copy guardrail). */
export function longestSharedRun(a: string, b: string, minimum = 40): number {
	const x = a.replace(/\s+/g, ' ').trim();
	const y = b.replace(/\s+/g, ' ').trim();
	if (x.length < minimum || y.length < minimum) return 0;
	let best = 0;
	// Slide a window of `minimum` over the shorter text; extend each hit.
	const [short, long] = x.length <= y.length ? [x, y] : [y, x];
	for (let i = 0; i + minimum <= short.length; i++) {
		if (!long.includes(short.slice(i, i + minimum))) continue;
		let length = minimum;
		while (i + length < short.length && long.includes(short.slice(i, i + length + 1))) length++;
		best = Math.max(best, length);
	}
	return best;
}
