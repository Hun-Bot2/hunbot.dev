import { getCollection } from 'astro:content';
import { ui, type UILanguage } from '../i18n/ui';
import { estimateReadTime, estimateWordCount, getAllPosts } from './blog';
import { getBlogLanguageFromPost, getBlogUrlFromPost } from './blog-routing';
import { getExplainerSlug, getExplainerUrl, getPublishedExplainers } from './explainers';
import { buildItemNoteIndex, getItemUrl } from './item-notes';
import { getLibraryItems } from './library';
import { getPickSlug } from './picks';
import { normalizeSitePath } from './site-path';
import type { LinkPreview, LinkPreviewMap, LinkPreviewPayload, PreviewKind } from './link-previews';
import { getPublishedWeeklyNotes, getWeeklyUrl } from './weekly';

// Build-time collection of every on-site target that can be previewed: only
// published records, so a draft is never named in /link-previews.json. Shared
// by the endpoint and by LinkCard.

const languages: UILanguage[] = ['ko', 'jp', 'en'];
const minutes = (words: number) => estimateReadTime(words);
let cached: Promise<LinkPreviewPayload> | null = null;

export function getLinkPreviewPayload(): Promise<LinkPreviewPayload> {
	cached ??= build();
	return cached;
}

async function build(): Promise<LinkPreviewPayload> {
	const [posts, explainers, weekly, resources, picks, notes] = await Promise.all([
		getAllPosts(),
		getCollection('explainers'),
		getCollection('weeklyNotes'),
		getCollection('resources'),
		getCollection('picks'),
		getCollection('itemNotes'),
	]);
	const items: LinkPreviewMap = {};

	for (const post of posts) {
		const lang = getBlogLanguageFromPost(post);
		const key = normalizeSitePath(getBlogUrlFromPost(post));
		const entry: LinkPreview = items[key] ?? { kind: 'post', title: {}, description: {} };
		entry.title[lang] = post.data.title;
		entry.description[lang] = post.data.description;
		// estimateWordCount drops kana/kanji, so a Japanese post has no reading time.
		if (lang !== 'jp' && entry.readMinutes === undefined) entry.readMinutes = minutes(estimateWordCount(post.body ?? ''));
		if (post.data.heroImage && !entry.image) entry.image = post.data.heroImage;
		items[key] = entry;
	}

	for (const explainer of getPublishedExplainers(explainers)) {
		const image = explainer.data.image && explainer.data.image.kind !== 'typographic' ? explainer.data.image.src : undefined;
		items[normalizeSitePath(getExplainerUrl('ko', getExplainerSlug(explainer)))] = {
			kind: 'explainer',
			readMinutes: minutes(estimateWordCount(explainer.body ?? '')),
			title: { ko: explainer.data.title },
			description: { ko: explainer.data.dek },
			...(image ? { image } : {}),
		};
	}

	for (const note of getPublishedWeeklyNotes(weekly)) {
		items[normalizeSitePath(getWeeklyUrl('ko', note.data.issue))] = {
			kind: 'weekly',
			readMinutes: minutes(estimateWordCount(note.body ?? '')),
			title: { ko: note.data.title },
			description: { ko: note.data.dek },
		};
	}

	// Item pages: the delivered one-line summary; never an image (license rule).
	const noteIndex = buildItemNoteIndex({ notes, picks, resources, pickSlug: getPickSlug });
	for (const note of noteIndex.values()) {
		const item = getLibraryItems(resources, picks, 'ko', [], noteIndex).find((candidate) => candidate.note?.pageId === note.pageId);
		if (!item) continue;
		items[normalizeSitePath(getItemUrl('ko', note.pageId))] = {
			kind: 'item',
			readMinutes: minutes(estimateWordCount(note.body)),
			title: { ko: item.title },
			description: { ko: item.description },
		};
	}

	items['/library/'] = {
		kind: 'library',
		title: Object.fromEntries(languages.map((lang) => [lang, ui[lang]['library.title']])),
		description: Object.fromEntries(languages.map((lang) => [lang, ui[lang]['library.description']])),
	};

	const kindKeys: Record<PreviewKind, keyof (typeof ui)['ko']> = {
		post: 'backlinks.kind.post',
		explainer: 'backlinks.kind.explainer',
		weekly: 'backlinks.kind.weekly',
		item: 'preview.kind.item',
		library: 'preview.kind.library',
	};
	const kinds = Object.fromEntries(
		(Object.keys(kindKeys) as PreviewKind[]).map((kind) => [kind, Object.fromEntries(languages.map((lang) => [lang, ui[lang][kindKeys[kind]]]))]),
	) as LinkPreviewPayload['kinds'];

	return {
		kinds,
		minutes: Object.fromEntries(languages.map((lang) => [lang, ui[lang]['preview.min']])),
		items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b))),
	};
}
