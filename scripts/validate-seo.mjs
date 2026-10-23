import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
const vercelJson = JSON.parse(read('vercel.json'));

assert.match(packageJson.scripts?.['seo:validate'] ?? '', /validate-seo\.mjs/);

assert.match(baseHead, /rel="canonical"/);
assert.match(baseHead, /hreflang="x-default"/);
assert.match(baseHead, /availableLangs/);
assert.match(baseHead, /type="application\/rss\+xml"/);
assert.match(baseHead, /\$\{currentLang\}\/rss\.xml/);
assert.doesNotMatch(baseHead, /feed\.json/, 'BaseHead should not advertise a JSON feed route that does not exist.');

assert.match(read('src/pages/[lang]/library/weekly/rss.xml.js'), /getPublishedWeeklyNotes/, 'The weekly feed must list published notes only.');
assert.match(languageRssRoute, /getStaticPaths/);
assert.match(languageRssRoute, /SUPPORTED_LANGUAGES/);
assert.match(languageRssRoute, /getBlogLanguageFromId/);
assert.match(globalRssRoute, /getBlogUrlFromId/);

assert.match(sitemapRoute, /learningPaths/);
assert.match(sitemapRoute, /getPublishedLearningPaths/);
assert.match(sitemapRoute, /getLearningPathUrl/);
assert.match(sitemapRoute, /getAcademicReviewUrlFromId/);
assert.match(sitemapRoute, /getPublishedAcademicReviews/);
assert.match(sitemapRoute, /getTopicsWithLinkedPapers/);
assert.match(sitemapRoute, /\/research\//);
assert.match(sitemapRoute, /\/explore\//, 'sitemap should list /{lang}/explore/.');
// Explainers: only published ones, and only the canonical-language URL.
assert.match(sitemapRoute, /getPublishedExplainers/, 'sitemap should list published explainers only.');
assert.match(sitemapRoute, /getExplainerUrl/);
// Item pages (Revision 2026-10-23b): only items with a published note, ko URL only.
assert.match(sitemapRoute, /buildItemNoteIndex/, 'sitemap should list item pages for items with a note only.');
assert.match(sitemapRoute, /getItemUrl\('ko'/, 'sitemap should list ko item URLs only.');
// Signals, weekly notes and the view index pages (Revision 2026-10-23): published
// only, ko URLs only.
assert.match(sitemapRoute, /getPublishedSignals/, 'sitemap should list the signals view only while signals are published.');
assert.match(sitemapRoute, /getPublishedWeeklyNotes/, 'sitemap should list weekly notes only when published.');
assert.match(sitemapRoute, /getSignalsUrl\('ko'\)/, 'sitemap should list the ko signals URL only.');
assert.match(sitemapRoute, /getWeeklyUrl\('ko'/, 'sitemap should list ko weekly note URLs only.');
// getLibrarySectionPath is gone from the sitemap: it was kept only to build
// the temporary /{lang}/library/decks/ path, which moved to
// /{lang}/research/decks/ (docs/decisions/site-structure.md#2). Pick section
// paths are built as plain template strings instead (see the sitemap
// source), same as before this change.
assert.doesNotMatch(sitemapRoute, /library\/decks/, 'The sitemap must not advertise the retired /library/decks/ path.');
assert.match(sitemapRoute, /\/research\/decks\//);
assert.match(sitemapRoute, /\$\{lang\}\/library\/`/, 'sitemap.xml.ts should list the /{lang}/library/ hub.');
// Useful Feeds merged into /{lang}/library/ (2026-10-04) and redirects there.
assert.doesNotMatch(sitemapRoute, /library\/useful-feeds/, 'The sitemap must not advertise the retired /library/useful-feeds/ path.');
// Research hub replaces the retired /{lang}/reviews/ index
// (docs/decisions/site-structure.md) — the sitemap's own generated static
// page list must not advertise that URL as live anymore. Review *detail*
// URLs (`/{lang}/reviews/{slug}/`) are unaffected and still come from
// getAcademicReviewUrlFromId.
assert.doesNotMatch(
	sitemapRoute,
	/`\/\$\{lang\}\/reviews\/`/,
	'sitemap.xml.ts should no longer list the retired /{lang}/reviews/ index as a static page.',
);

// Old deck URLs must redirect, not 404, once decks moved to Research
// (docs/decisions/site-structure.md#2). vercel.json is the single source of
// truth for these — a missing entry here would only surface as a live 404
// after deploy, which is exactly what a permanent redirect exists to prevent.
function findRedirect(source) {
	return (vercelJson.redirects ?? []).find((entry) => entry.source === source);
}

for (const source of ['/:lang(ko|jp|en)/library/decks', '/:lang(ko|jp|en)/library/decks/']) {
	const redirect = findRedirect(source);
	assert.ok(redirect, `vercel.json should have a redirect for "${source}".`);
	assert.equal(redirect.destination, '/:lang/research/decks/', `"${source}" should redirect to /:lang/research/decks/.`);
	assert.equal(redirect.permanent, true, `"${source}" -> /:lang/research/decks/ should be a permanent redirect.`);
}

{
	const redirect = findRedirect('/library/decks');
	assert.ok(redirect, 'vercel.json should have a redirect for "/library/decks".');
	assert.equal(redirect.destination, '/ko/research/decks/', '"/library/decks" should redirect to /ko/research/decks/.');
	assert.equal(redirect.permanent, true, '"/library/decks" -> /ko/research/decks/ should be a permanent redirect.');
}

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

			// The Library and the Research decks route (#2) must round-trip into
			// the built sitemap, not just the route source checked above.
			assert.ok(sitemap.includes(`/${lang}/library/`), `${relative(root, sitemapPath)} should include ${lang} library hub.`);
			assert.ok(!sitemap.includes(`/${lang}/library/useful-feeds/`), `${relative(root, sitemapPath)} must not include the retired useful-feeds path.`);
			assert.ok(
				sitemap.includes(`/${lang}/research/decks/`),
				`${relative(root, sitemapPath)} should include ${lang} research decks page.`,
			);
			assert.doesNotMatch(
				sitemap,
				new RegExp(`/${lang}/library/decks/`),
				`${relative(root, sitemapPath)} must never advertise the retired /${lang}/library/decks/ path.`,
			);
		}
	}

	// The retired /{lang}/library/decks/ page must no longer be a build
	// output for any language — it permanently redirects instead (vercel.json)
	// — while its replacement, /{lang}/research/decks/, must exist.
	for (const lang of learningPathLanguages) {
		const oldDecksPath = join(outputRoot, lang, 'library', 'decks', 'index.html');
		assert.equal(existsSync(oldDecksPath), false, `${relative(root, oldDecksPath)} should no longer be generated.`);

		const newDecksPath = join(outputRoot, lang, 'research', 'decks', 'index.html');
		assert.ok(existsSync(newDecksPath), `${relative(root, newDecksPath)} should exist after build.`);
	}

	// Placeholder content never ships (docs/decisions/site-structure.md, Placeholder
	// Content Is Unpublished): no `TEMP:` fixture title in any page, feed or sitemap,
	// and a Library view with nothing published has no page at all. The weekly feed
	// exists only with the weekly pages it points at.
	for (const file of listBuiltFiles(outputRoot)) {
		if (!/(?:index\.html|\.xml)$/.test(file)) continue;
		assert.doesNotMatch(readFileSync(file, 'utf8'), /TEMP:/, `${relative(root, file)} contains a TEMP: fixture string.`);
	}
	for (const lang of learningPathLanguages) {
		const weeklyIndex = join(outputRoot, lang, 'library', 'weekly', 'index.html');
		const weeklyFeed = join(outputRoot, lang, 'library', 'weekly', 'rss.xml');
		assert.equal(existsSync(weeklyFeed), existsSync(weeklyIndex), `${lang}: the weekly feed and the weekly index must exist together.`);
		if (existsSync(weeklyFeed)) {
			assert.doesNotMatch(readFileSync(weeklyFeed, 'utf8'), /mailto:|newsletter/i, 'The weekly feed must not offer email delivery.');
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

function listBuiltFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? (entry.name === 'pagefind' ? [] : listBuiltFiles(fullPath)) : [fullPath];
	});
}

console.log('Validated SEO, RSS, and sitemap source/output checks.');
