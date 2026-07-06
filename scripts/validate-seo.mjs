import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { learningPaths } from '../src/data/learningPaths.ts';
import { learningPathLanguages } from '../src/utils/learning-paths.ts';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const baseHead = read('src/components/BaseHead.astro');
const sitemapRoute = read('src/pages/sitemap.xml.ts');
const languageRssRoute = read('src/pages/[lang]/rss.xml.js');
const globalRssRoute = read('src/pages/rss.xml.js');

assert.match(packageJson.scripts?.['seo:validate'] ?? '', /validate-seo\.mjs/);

assert.match(baseHead, /rel="canonical"/);
assert.match(baseHead, /hreflang="x-default"/);
assert.match(baseHead, /availableLangs/);
assert.match(baseHead, /type="application\/rss\+xml"/);
assert.match(baseHead, /\$\{currentLang\}\/rss\.xml/);
assert.doesNotMatch(baseHead, /feed\.json/, 'BaseHead should not advertise a JSON feed route that does not exist.');

assert.match(languageRssRoute, /getStaticPaths/);
assert.match(languageRssRoute, /SUPPORTED_LANGUAGES/);
assert.match(languageRssRoute, /getBlogLanguageFromId/);
assert.match(globalRssRoute, /getBlogUrlFromId/);

assert.match(sitemapRoute, /learningPaths/);
assert.match(sitemapRoute, /getPublishedLearningPaths/);
assert.match(sitemapRoute, /getLearningPathUrl/);
assert.match(sitemapRoute, /getLibrarySectionPath/);
assert.match(sitemapRoute, /getAcademicReviewUrlFromId/);
assert.match(sitemapRoute, /\/reviews\//);

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	const sitemapPath = join(outputRoot, 'sitemap.xml');
	if (existsSync(sitemapPath)) {
		const sitemap = readFileSync(sitemapPath, 'utf8');
		assert.doesNotMatch(sitemap, /\/feed\.json/);
		assert.doesNotMatch(sitemap, /\/blog\/(ko|jp|en)\//);

		for (const lang of learningPathLanguages) {
			assert.ok(sitemap.includes(`/${lang}/paths/`), `${relative(root, sitemapPath)} should include ${lang} paths index.`);
			for (const path of learningPaths.filter((item) => item.status === 'published')) {
				assert.ok(
					sitemap.includes(`/${lang}/paths/${path.id}/`),
					`${relative(root, sitemapPath)} should include ${lang}/${path.id} path detail.`,
				);
			}
		}
	}

	for (const lang of learningPathLanguages) {
		const homePath = join(outputRoot, lang, 'index.html');
		if (existsSync(homePath)) {
			const html = readFileSync(homePath, 'utf8');
			assert.match(html, /rel="canonical"/);
			assert.match(html, new RegExp(`/${lang}/rss\\.xml`));
			assert.doesNotMatch(html, /feed\.json/);
		}

		const rssPath = join(outputRoot, lang, 'rss.xml');
		if (existsSync(rssPath)) {
			const rss = readFileSync(rssPath, 'utf8');
			assert.match(rss, new RegExp(`/${lang}/blog/`), `${relative(root, rssPath)} should include localized blog links.`);
		}
	}
}

console.log('Validated SEO, RSS, and sitemap source/output checks.');
