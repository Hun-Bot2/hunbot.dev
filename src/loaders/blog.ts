import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';

// Only completely metadata-free files get defaults. Incomplete/invalid
// frontmatter must still fail validation rather than accidentally publish.
export function draftMetadata(id: string, data: Record<string, unknown>) {
	if (Object.keys(data).length !== 0) return data;
	return {
		title: id.split('/').at(-1) ?? id,
		description: '작성 중인 글 · 로컬 미리보기',
		pubDate: new Date(0),
		draft: true,
	};
}

export function blogLoader(): Loader {
	return {
		name: 'blog-drafts-loader',
		async load(context) {
			const base = new URL('./src/content/blog/', context.config.root);
			const dev = Boolean(context.watcher);
			const pattern = ['**/*.{md,mdx}'];
			if (!dev) {
				// Exclude unfinished files BEFORE Astro registers MDX imports.
				// Their bodies may be incomplete MDX as well as lack metadata.
				const root = fileURLToPath(base);
				for (const file of readdirSync(root, { recursive: true })) {
					if (!/\.mdx?$/.test(file)) continue;
					if (!/^\uFEFF?---\r?\n/.test(readFileSync(join(root, file), 'utf8'))) {
						pattern.push(`!${file.replaceAll('\\', '/')}`);
					}
				}
			}
			// Dev defaults must never survive a subsequent production sync.
			context.store.clear();
			await glob({ base, pattern }).load({
				...context,
				parseData: (options) => context.parseData({
					...options,
					data: dev ? draftMetadata(options.id, options.data) : options.data,
				}),
			});
		},
	};
}
