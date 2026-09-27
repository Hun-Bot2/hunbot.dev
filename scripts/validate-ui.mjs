import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ui } from '../src/i18n/ui.ts';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const header = read('src/components/Header.astro');
const globalCss = read('src/styles/global.css');

assert.match(packageJson.scripts?.['ui:validate'] ?? '', /validate-ui\.mjs/);
assert.match(header, /class="skip-link"/);
assert.match(header, /href="#main-content"/);
assert.match(header, /nav\.skip/);
assert.match(globalCss, /\.skip-link/);
assert.match(globalCss, /:focus-visible/);

for (const lang of ['ko', 'jp', 'en']) {
	assert.ok(ui[lang]?.['nav.skip'], `${lang} nav.skip copy is required.`);
}

const pagesWithHeader = [
	'src/layouts/BlogPost.astro',
	'src/pages/[lang]/blog/categories.astro',
	'src/pages/[lang]/blog/categories/[category].astro',
	'src/pages/[lang]/blog/index.astro',
	'src/pages/[lang]/index.astro',
	'src/pages/[lang]/library.astro',
	// Pick section pages (docs/decisions/site-structure.md#3,5) — one route
	// generated per src/data/librarySections.ts slug.
	'src/pages/[lang]/library/[section].astro',
	// New route for the Library restructure's Useful Feeds tab
	// (docs/decisions/site-structure.md#3).
	'src/pages/[lang]/library/useful-feeds.astro',
	'src/pages/[lang]/paths.astro',
	'src/pages/[lang]/paths/[path].astro',
	'src/pages/[lang]/research.astro',
	// Decks moved off the Library onto Research (docs/decisions/site-structure.md#2).
	'src/pages/[lang]/research/decks.astro',
	'src/pages/[lang]/research/topics/[topic].astro',
	'src/pages/[lang]/search.astro',
];

for (const page of pagesWithHeader) {
	assert.match(read(page), /<main\s+id="main-content"/, `${page} should expose #main-content.`);
}

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	const samplePages = [
		'ko/index.html',
		'ko/blog/index.html',
		'ko/library/index.html',
		// Newer Library/Research routes should get the same #main-content spot
		// check as the older sample pages above, not just a source-level assert
		// (docs/decisions/site-structure.md#2,#3).
		'ko/library/useful-feeds/index.html',
		'ko/research/decks/index.html',
		'ko/paths/index.html',
		'ko/search/index.html',
	];

	for (const page of samplePages) {
		const outputPath = join(outputRoot, page);
		if (!existsSync(outputPath)) continue;

		const html = readFileSync(outputPath, 'utf8');
		if (!html.includes('skip-link') && !html.includes('id="main-content"')) continue;

		assert.match(html, /skip-link/);
		assert.match(html, /id="main-content"/, `${relative(root, outputPath)} should include main-content.`);
	}
}

console.log('Validated shared UI accessibility conventions.');
