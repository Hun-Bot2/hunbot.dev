// Series identity for blog posts.
//
// A post's `series` frontmatter is free text, written per language, and not
// always spelled the same across translations or posts ("블로그 개발일지" /
// "Blog Devlog" / "blog-devlog" are one series). A lane needs a
// language-independent identity, so spellings are linked by what the data
// itself says and nothing else:
//
//   - two spellings are the same series when they normalize to the same
//     string (case, spaces, and underscores folded to hyphens), anywhere in
//     the data;
//   - spellings used by different translations of the SAME post are the same
//     series (a post has one series, however it is titled per language).
//
// No dictionary of translations and no fuzzy matching: if "로컬 LLM 개발일지"
// (Korean-only) and "Local LLM Devlog" (English-only) share no post and no
// normalized spelling, they stay two series, which is what the metadata says.
// The remaining inconsistencies are reported, not guessed away.
//
// The series id is the lexicographically smallest normalized spelling in the
// linked group. It is an internal lane key (never a URL) and is stable while
// the spellings are.
//
// Pure: no astro:content, no filesystem.

import { artifactLanguages, type ArtifactLanguage } from '../../data/publicArtifactVocabulary.ts';
import type { ArtifactSeries, LocalizedText } from './contract.ts';

/** One published translation of a post and the series text it carries. */
export type SeriesInput = { lang: ArtifactLanguage; series?: string | null };

export type InconsistentSeries = { id: string; language: ArtifactLanguage; spellings: string[] };

export function normalizeSeriesName(name: string): string {
	return name.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

/**
 * @param posts  translations of each post, keyed by the post's slug
 * @returns the series of every post slug (null when none of its translations has one),
 *          and the languages in which one series is spelled more than one way
 */
export function buildSeriesIndex(posts: ReadonlyMap<string, readonly SeriesInput[]>): {
	bySlug: Map<string, ArtifactSeries | null>;
	inconsistent: InconsistentSeries[];
} {
	// Union-find over normalized spellings.
	const parent = new Map<string, string>();
	const find = (name: string): string => {
		let root = name;
		while (parent.get(root) !== root) root = parent.get(root)!;
		parent.set(name, root);
		return root;
	};
	const union = (a: string, b: string) => {
		const rootA = find(a);
		const rootB = find(b);
		if (rootA !== rootB) parent.set(rootB, rootA);
	};

	const namesBySlug = new Map<string, string[]>();
	for (const [slug, translations] of posts) {
		const names = [...new Set(translations.map((entry) => entry.series?.trim()).filter(isNonEmpty).map(normalizeSeriesName))];
		namesBySlug.set(slug, names);
		for (const name of names) if (!parent.has(name)) parent.set(name, name);
		for (const name of names.slice(1)) union(names[0], name);
	}

	const members = new Map<string, Set<string>>();
	for (const name of parent.keys()) {
		const root = find(name);
		members.set(root, (members.get(root) ?? new Set()).add(name));
	}
	const idOf = new Map<string, string>();
	for (const [root, names] of members) idOf.set(root, [...names].sort()[0]);

	// Per series and language, how each raw spelling is used.
	const spellings = new Map<string, Map<ArtifactLanguage, Map<string, number>>>();
	for (const [slug, translations] of posts) {
		const names = namesBySlug.get(slug)!;
		if (names.length === 0) continue;
		const id = idOf.get(find(names[0]))!;
		for (const entry of translations) {
			const raw = entry.series?.trim();
			if (!raw) continue;
			const byLanguage = spellings.get(id) ?? new Map<ArtifactLanguage, Map<string, number>>();
			const counts = byLanguage.get(entry.lang) ?? new Map<string, number>();
			counts.set(raw, (counts.get(raw) ?? 0) + 1);
			byLanguage.set(entry.lang, counts);
			spellings.set(id, byLanguage);
		}
	}

	// One title per series, shared by every artifact in it: the most used
	// spelling per language (ties: the smallest).
	const titles = new Map<string, LocalizedText>();
	const inconsistent: InconsistentSeries[] = [];
	for (const [id, byLanguage] of spellings) {
		const title: LocalizedText = {};
		for (const lang of artifactLanguages) {
			const counts = byLanguage.get(lang);
			if (!counts) continue;
			const ranked = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
			title[lang] = ranked[0][0];
			if (counts.size > 1) inconsistent.push({ id, language: lang, spellings: ranked.map(([text]) => text) });
		}
		titles.set(id, title);
	}

	const bySlug = new Map<string, ArtifactSeries | null>();
	for (const [slug, names] of namesBySlug) {
		if (names.length === 0) {
			bySlug.set(slug, null);
			continue;
		}
		const id = idOf.get(find(names[0]))!;
		bySlug.set(slug, { id, title: { ...titles.get(id)! } });
	}
	inconsistent.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.language < b.language ? -1 : 1));
	return { bySlug, inconsistent };
}

function isNonEmpty(value: string | null | undefined): value is string {
	return typeof value === 'string' && value.length > 0;
}
