import { readFileSync } from 'node:fs';
import { slug as githubSlug } from 'github-slugger';
import yaml from 'js-yaml';
import type { CollectionEntry } from 'astro:content';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

type DraftMetadata = Partial<CollectionEntry<'blog'>['data']> & { slug?: string };
const modules = import.meta.glob<{ Content: AstroComponentFactory }>('../content/blog/{ko,jp,en}/**/*.{md,mdx}');

export function readDraftSources() {
	return Object.entries(modules).flatMap(([path, load]) => {
		let raw: string;
		try {
			raw = readFileSync(new URL(path, import.meta.url), 'utf-8');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
			throw error;
		}
		const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
		let data: DraftMetadata = {};
		try {
			if (match) data = (yaml.load(match[1]) ?? {}) as DraftMetadata;
		} catch {
			// Leave malformed draft metadata visible in the index so the writer
			// can open the file and see Astro's compiler diagnostic.
		}
		const pathId = path.slice('../content/blog/'.length)
			.replace(/\.mdx?$/, '').split('/').map(segment => githubSlug(segment)).join('/').replace(/\/index$/, '');
		const id = data.slug || pathId;
		const locale = path.slice('../content/blog/'.length).split('/')[0] as 'ko' | 'jp' | 'en';
		return [{ id, locale, load, data, title: data.title ?? id.split('/').at(-1) ?? id }];
	});
}
