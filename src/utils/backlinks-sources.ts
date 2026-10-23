import { getCollection } from 'astro:content';
import type { UILanguage } from '../i18n/ui';
import { buildBacklinkIndex, getBacklinks, type Backlink, type BacklinkSource, type BacklinkTarget, type BacklinkIndex } from './backlinks';
import { getAllPosts } from './blog';
import { getBlogLanguageFromPost, getBlogUrlFromPost } from './blog-routing';
import { getExplainerSlug, getPublishedExplainers } from './explainers';
import { buildItemNoteIndex, getItemUrl } from './item-notes';
import { getPickSlug } from './picks';
import { getPublishedSignals, getSignalSlug } from './signals';
import { getPublishedWeeklyNotes, getWeeklyUrl } from './weekly';

// Astro-side loader for the backlink index (src/utils/backlinks.ts): every
// published piece of the site's own writing, as sources. Built once per build.
// `{lang}` in a url is replaced with the page language of ko-only writing.

const lang = (url: string) => url.replace('/ko/', '/{lang}/');
let cached: Promise<BacklinkIndex> | null = null;

export async function loadBacklinkSources(): Promise<BacklinkSource[]> {
	const [posts, explainers, weekly, signals, notes, picks, resources] = await Promise.all([
		getAllPosts(),
		getCollection('explainers'),
		getCollection('weeklyNotes'),
		getCollection('signals'),
		getCollection('itemNotes'),
		getCollection('picks'),
		getCollection('resources'),
	]);

	const sources: BacklinkSource[] = [];

	for (const post of posts) {
		sources.push({
			kind: 'post',
			key: `post:${post.id}`,
			url: getBlogUrlFromPost(post),
			title: post.data.title,
			date: post.data.pubDate.toISOString().slice(0, 10),
			lang: getBlogLanguageFromPost(post),
			body: post.body ?? '',
		});
	}

	for (const entry of getPublishedExplainers(explainers)) {
		sources.push({
			kind: 'explainer',
			key: `explainer:${getExplainerSlug(entry)}`,
			url: `/{lang}/library/explainers/${getExplainerSlug(entry)}/`,
			title: entry.data.title,
			date: entry.data.publishedAt,
			body: `${entry.data.dek}\n\n${entry.body ?? ''}`,
		});
	}

	for (const entry of getPublishedWeeklyNotes(weekly)) {
		const resolved = entry.data.resolved.map((item) => `${item.question}\n\n${item.outcome}`).join('\n\n');
		sources.push({
			kind: 'weekly',
			key: `weekly:${entry.data.issue}`,
			url: lang(getWeeklyUrl('ko', entry.data.issue)),
			title: entry.data.title,
			date: entry.data.publishedAt,
			body: `${entry.data.dek}\n\n${resolved}\n\n${entry.body ?? ''}`,
		});
	}

	for (const entry of getPublishedSignals(signals)) {
		sources.push({
			kind: 'signal',
			key: `signal:${getSignalSlug(entry)}`,
			url: `/{lang}/library/signals/#signal-${getSignalSlug(entry)}`,
			title: entry.data.title,
			date: entry.data.keptAt,
			body: `${entry.data.why}\n\n${entry.body ?? ''}`,
		});
	}

	const noteIndex = buildItemNoteIndex({ notes, picks, resources, pickSlug: getPickSlug });
	for (const note of noteIndex.values()) {
		const item = note.ref.kind === 'resource' ? resources.find((r) => r.data.id === note.ref.id) : picks.find((p) => getPickSlug(p.id) === note.ref.id);
		sources.push({
			kind: 'note',
			key: `note:${note.pageId}`,
			url: lang(getItemUrl('ko', note.pageId)),
			title: item?.data.title ?? note.pageId,
			date: note.updatedAt ?? note.writtenAt,
			body: note.body,
		});
	}

	return sources;
}

export function getBacklinkIndex(): Promise<BacklinkIndex> {
	cached ??= loadBacklinkSources().then(buildBacklinkIndex);
	return cached;
}

/** Backlinks of one target as `lang` sees them; empty when nothing links to it. */
export async function getBacklinksFor(target: BacklinkTarget, forLang: UILanguage): Promise<Backlink[]> {
	return getBacklinks(await getBacklinkIndex(), target, forLang);
}

/** A blog post's own paths: its slug in the page's language, whichever language links to it. */
export function getPostTarget(post: { id: string }, url: string): BacklinkTarget {
	return { selfKey: `post:${post.id}`, paths: [url] };
}
