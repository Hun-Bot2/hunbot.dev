import type { UILanguage } from '../i18n/ui';
import { normalizePickUrl } from './picks.ts';
import { normalizeSitePath } from './site-path.ts';

export { normalizeSitePath };

// Backlinks (docs/decisions/site-structure.md, Revision 2026-10-23b): which of
// the site's own writing links to a page. Built only from links that exist in
// the text, never from similarity. Pure, so it is unit-tested without Astro.

export type BacklinkKind = 'post' | 'explainer' | 'weekly' | 'signal' | 'note';

/** One published piece of the site's own writing. Unpublished writing is never passed in. */
export interface BacklinkSource {
	kind: BacklinkKind;
	/** Unique across all sources. */
	key: string;
	/** On-site URL; `{lang}` stands for the page language of ko-only writing. */
	url: string;
	title: string;
	/** YYYY-MM-DD */
	date: string;
	/** A blog post exists in one language; ko-only writing shows on every language's pages. */
	lang?: UILanguage;
	/** Markdown/MDX text that is searched for links. */
	body: string;
}

export interface Backlink {
	key: string;
	kind: BacklinkKind;
	url: string;
	title: string;
	date: string;
	excerpt: string;
}

export interface BacklinkTarget {
	/** The target's own key as a source, so a page never lists itself. */
	selfKey?: string;
	/** On-site paths of the target, any language prefix (`/library/item/x/`). */
	paths?: string[];
	/** The item's own website, for 자료 items. */
	externalUrl?: string;
}

const SITE_HOSTS = new Set(['hun-bot.dev', 'www.hun-bot.dev']);
const EXCERPT_MAX = 140;

/** Blank out fenced and inline code (same length) so their text is never read as links. */
function maskCode(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length))
		.replace(/`[^`\n]*`/g, (match) => ' '.repeat(match.length));
}

export interface FoundLink {
	href: string;
	index: number;
}

/** Links in a Markdown/MDX body: `[text](href)` (not images) and `href="..."` attributes. */
export function extractLinks(markdown: string): FoundLink[] {
	const text = maskCode(markdown);
	const found: FoundLink[] = [];
	const markdownLink = /(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g;
	const attribute = /\bhref\s*=\s*["']([^"']+)["']/g;
	for (const match of text.matchAll(markdownLink)) found.push({ href: match[1], index: match.index ?? 0 });
	for (const match of text.matchAll(attribute)) found.push({ href: match[1], index: match.index ?? 0 });
	return found.sort((a, b) => a.index - b.index);
}

function stripMarkup(text: string): string {
	return text
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/^\s{0,3}(?:#{1,6}|[-*+]|\d+\.|>)\s+/gm, '')
		.replace(/[*_`]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** The paragraph around a link as plain text, cut to about 140 characters around the link text. */
export function excerptAround(markdown: string, index: number, max = EXCERPT_MAX): string {
	let start = markdown.lastIndexOf('\n\n', index);
	start = start === -1 ? 0 : start + 2;
	let end = markdown.indexOf('\n\n', index);
	if (end === -1) end = markdown.length;
	const raw = markdown.slice(start, end);
	const paragraph = stripMarkup(raw);
	if (paragraph.length <= max) return paragraph;

	// Where the link sits in the plain text, estimated from its place in the raw paragraph.
	const center = Math.round(((index - start) / Math.max(1, raw.length)) * paragraph.length);
	const from = Math.max(0, Math.min(center - Math.floor(max / 2), paragraph.length - max));
	const to = from + max;
	let slice = paragraph.slice(from, to).trim();
	if (from > 0) slice = `…${slice}`;
	if (to < paragraph.length) slice = `${slice}…`;
	return slice;
}

interface IndexedLink {
	source: BacklinkSource;
	excerpt: string;
}

export interface BacklinkIndex {
	byPath: Map<string, IndexedLink[]>;
	byExternal: Map<string, IndexedLink[]>;
}

function resolveHref(href: string, source: BacklinkSource): URL | null {
	const base = new URL(source.url.replace('{lang}', 'ko'), 'https://hun-bot.dev');
	try {
		return new URL(href, base);
	} catch {
		return null;
	}
}

/** Index every link of every source once; a source counts once per target, at its first link. */
export function buildBacklinkIndex(sources: BacklinkSource[]): BacklinkIndex {
	const byPath = new Map<string, IndexedLink[]>();
	const byExternal = new Map<string, IndexedLink[]>();
	const add = (map: Map<string, IndexedLink[]>, key: string, entry: IndexedLink) => {
		const list = map.get(key) ?? [];
		if (!list.some((existing) => existing.source.key === entry.source.key)) list.push(entry);
		map.set(key, list);
	};

	for (const source of sources) {
		for (const link of extractLinks(source.body)) {
			if (/^(?:mailto:|tel:|#)/i.test(link.href)) continue;
			const resolved = resolveHref(link.href, source);
			if (!resolved || !/^https?:$/.test(resolved.protocol)) continue;
			const entry = { source, excerpt: excerptAround(source.body, link.index) };
			if (SITE_HOSTS.has(resolved.host.toLowerCase())) {
				add(byPath, normalizeSitePath(resolved.pathname), entry);
			} else {
				add(byExternal, normalizePickUrl(resolved.href), entry);
			}
		}
	}
	return { byPath, byExternal };
}

/** Backlinks of one target, newest first, as the page language sees them. Never the page itself. */
export function getBacklinks(index: BacklinkIndex, target: BacklinkTarget, lang: UILanguage): Backlink[] {
	const hits: IndexedLink[] = [];
	for (const path of target.paths ?? []) hits.push(...(index.byPath.get(normalizeSitePath(path)) ?? []));
	if (target.externalUrl) hits.push(...(index.byExternal.get(normalizePickUrl(target.externalUrl)) ?? []));

	const seen = new Set<string>();
	return hits
		.filter(({ source }) => {
			if (source.key === target.selfKey || seen.has(source.key)) return false;
			if (source.lang && source.lang !== lang) return false;
			seen.add(source.key);
			return true;
		})
		.sort((a, b) => b.source.date.localeCompare(a.source.date) || a.source.title.localeCompare(b.source.title))
		.map(({ source, excerpt }) => ({
			key: source.key,
			kind: source.kind,
			url: source.url.replace('{lang}', lang),
			title: source.title,
			date: source.date,
			excerpt,
		}));
}
