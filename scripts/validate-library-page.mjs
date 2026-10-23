import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
// js-yaml is not a direct dependency of this repo, but it is already
// installed in node_modules as a direct dependency of astro (see astro's own
// package.json) — same reasoning scripts/validate-picks.mjs already gives
// for using it to parse `picks`' YAML frontmatter.
import yaml from 'js-yaml';

import { getApprovedResources, getResourceSummary } from '../src/utils/library.ts';
import { librarySections as pickLibrarySections } from '../src/data/librarySections.ts';
import { pickTiers } from '../src/data/libraryPolicy.ts';
import { computePickTier } from '../src/utils/picks.ts';
import { ui } from '../src/i18n/ui.ts';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['library-page:validate'] ?? '', /validate-library-page\.mjs/);

const libraryPagePath = 'src/pages/[lang]/library.astro';
const libraryPage = read(libraryPagePath);
const sectionPagePath = 'src/pages/[lang]/library/[section].astro';
const sectionPage = read(sectionPagePath);
const usefulFeedsPagePath = 'src/pages/[lang]/library/useful-feeds.astro';
const header = read('src/components/Header.astro');

for (const lang of languages) {
	assert.match(libraryPage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Library page should generate ${lang} route.`);
	assert.ok(ui[lang]?.['nav.library'], `${lang} nav.library copy is required.`);
	assert.ok(ui[lang]?.['library.title'], `${lang} Library title copy is required.`);
	for (const key of ['library.intro', 'library.filter-area', 'library.filter-kind', 'library.filter-topic', 'library.filter-results']) {
		assert.ok(ui[lang]?.[key], `${lang} ${key} copy is required.`);
	}
}

// The 자료 view (docs/decisions/site-structure.md, revisions 2026-10-04 and
// 2026-10-23): approved resources and published picks together as editorial
// rows, filtered by the Library's visible filter bar (LibraryFilterBar; the blog keeps its floating filter). Explainers no longer lead this
// list: they have their own view (the 해설 tab). The page carries the page label
// and the tab bar.
assert.match(libraryPage, /getLibraryViewData/);
assert.match(libraryPage, /<LibraryFilterBar\b/, 'The 자료 view uses the visible Library filter bar.');
assert.doesNotMatch(libraryPage, /<BlogFilterBar\b/, 'The Library no longer uses the floating blog filter.');
assert.match(libraryPage, /toggle: true/, 'The 노트 있음 filter is a single toggle chip.');
assert.match(libraryPage, /parent: \{ facet: 'area'/, '주제 chips are grouped under their 분야.');
assert.match(libraryPage, /<LibraryRow\b/);
assert.match(libraryPage, /data-filter-section/);
assert.doesNotMatch(libraryPage, /Hero/, 'The Library hero was removed (2026-10-23, owner decision).');
assert.match(libraryPage, /<LibraryTabs\b[^>]*current="resources"/, 'The 자료 view carries the tab bar.');
assert.match(libraryPage, /<h1 class="eyebrow">/, 'Every Library view leads with the Research-style page label.');
assert.ok(
	libraryPage.indexOf('subpage-intro') > -1 && libraryPage.indexOf('subpage-intro') < libraryPage.indexOf('<LibraryTabs'),
	'Order on the 자료 view: page label, then the tab bar.',
);
assert.ok(!existsSync('src/components/library/LibraryMasthead.astro'), 'The Library masthead was removed (Content First).');
assert.doesNotMatch(libraryPage, /<ExplainerRow\b/, 'Explainers moved to their own view; they must not lead the 자료 list.');
assert.doesNotMatch(libraryPage, /id: 'explainers'/);
const viewsUtil = readFileSync('src/utils/library-views.ts', 'utf8');
assert.match(viewsUtil, /getPublishedExplainers/);
assert.match(viewsUtil, /getPublishedSignals/);
assert.match(viewsUtil, /getPublishedWeeklyNotes/);
// Every view is its own page with the same tab bar; a view with nothing
// published has no route (getStaticPaths returns no paths) and no tab.
for (const [view, current] of [
	['src/pages/[lang]/library/signals/index.astro', 'signals'],
	['src/pages/[lang]/library/explainers/index.astro', 'explainers'],
	['src/pages/[lang]/library/weekly/index.astro', 'weekly'],
]) {
	const source = read(view);
	assert.match(source, new RegExp(`<LibraryTabs\\b[^>]*current="${current}"`), `${view} must carry the tab bar.`);
	assert.ok(source.indexOf('subpage-intro') > -1 && source.indexOf('subpage-intro') < source.indexOf('<LibraryTabs') && /<h1 class="eyebrow">/.test(source), `${view}: the page label comes before the tab bar.`);
	assert.match(source, /published\.length > 0 \? .* : \[\]/, `${view} must generate no route while nothing is published.`);
	assert.match(source, /canonicalURL=\{canonicalURL\.href\}/, `${view} must canonicalize to the ko page.`);
	assert.match(source, /noindex, follow/, `${view} must be noindex outside ko.`);
}
// Item pages (Revision 2026-10-23b): an item has a page iff it has a note.
const itemRoute = read('src/pages/[lang]/library/item/[id].astro');
assert.match(itemRoute, /buildItemNoteIndex/, 'Item pages are generated from the note index only.');
assert.match(itemRoute, /getBacklinksFor/, 'An item page lists its backlinks.');
const itemLayout = read('src/layouts/LibraryItemPost.astro');
assert.match(itemLayout, /noindex, follow/, 'Item pages are noindex outside ko.');
assert.match(itemLayout, /canonicalURL=\{canonicalURL\.href\}/, 'Item pages canonicalize to the ko page.');
assert.match(itemLayout, /rel="noopener noreferrer"/, 'The original box is the one external link, opened safely.');
const libraryRow = read('src/components/library/LibraryRow.astro');
assert.match(libraryRow, /item\.note \? getItemUrl/, 'A row with a note links to the item page.');
for (const page of [
	'src/layouts/BlogPost.astro',
	'src/layouts/ExplainerPost.astro',
	'src/layouts/LibraryItemPost.astro',
	'src/pages/[lang]/library/weekly/[issue].astro',
]) {
	assert.match(read(page), /<Backlinks\b/, `${page} must render the backlinks section.`);
	assert.match(read(page), /<LinkPreview\b/, `${page} must load the link previews.`);
}
const filterBar = read('src/components/library/LibraryFilterBar.astro');
assert.match(filterBar, /data-blog-filters/, 'The Library filter bar drives public/scripts/blog-filters.js.');
assert.doesNotMatch(filterBar, /<script/i, 'The Library filter bar adds no script of its own.');
const previewScript = read('src/scripts/link-preview.ts');
assert.match(previewScript, /\(hover: hover\)/, 'Link previews run only where hovering exists.');
assert.match(previewScript, /placePopover/, 'The preview card is placed with placePopover().');
const tabsComponent = read('src/components/library/LibraryTabs.astro');
assert.match(tabsComponent, /aria-current=/, 'The active tab must carry aria-current="page".');
assert.doesNotMatch(tabsComponent, /<script/i, 'Tabs are real links, not script.');
const explainerRow = readFileSync('src/components/library/ExplainerRow.astro', 'utf8');
assert.doesNotMatch(explainerRow, /target="_blank"/, 'An explainer row is an on-site link.');
assert.match(explainerRow, /data-post-kind/, 'An explainer row must carry the filter data attributes.');
assert.match(readFileSync('src/utils/library.ts', 'utf8'), /getPublishedExplainers/);
for (const lang of languages) {
	for (const key of [
		'library.pick.kind.explainer',
		'explainer.source-language.ja',
		'explainer.badge.ai-draft',
		'explainer.badge.reviewed',
		'explainer.source.notice',
		'library.tab.signals',
		'library.tab.explainers',
		'library.tab.weekly',
		'library.tab.resources',
		'signal.verdict.confirmed',
		'signal.verdict.doubt',
		'signal.verdict.try',
		'weekly.page.in',
		'weekly.page.out',
		'explainer.claims.title',
		'backlinks.title',
		'item.original.open',
		'library.filter-note',
		'library.filter-clear',
		'library.filter-total',
		'signal.filter-source-language',
		'signal.filter-source-kind',
		'linkcard.read',
	]) {
		assert.ok(ui[lang]?.[key], `${lang} ${key} copy is required.`);
	}
}
assert.match(readFileSync('src/components/library/LibraryRow.astro', 'utf8'), /entry-thumb/);
assert.match(libraryPage, /data-pagefind-body/);
assert.match(libraryPage, /data-pagefind-filter="language\[content\]"/);
assert.match(libraryPage, /data-pagefind-filter="section\[content\]"/);
assert.doesNotMatch(libraryPage, /getCollection\('topics'\)/);
assert.doesNotMatch(libraryPage, /getCollection\('papers'\)/);

// Pick section pages replace the old resources-backed design/vibe-coding/
// dev-docs/useful-feeds sections. Decks moved off the Library entirely onto
// /{lang}/research/decks/ (docs/decisions/site-structure.md#2), so this page
// no longer has a decks branch at all.
assert.match(sectionPage, /getCollection\('picks'\)/);
assert.match(sectionPage, /computePickTier/);
assert.match(sectionPage, /data-pagefind-filter="library-section\[content\]"/);
assert.doesNotMatch(sectionPage, /isDecksSection/);
assert.doesNotMatch(sectionPage, /getResourcesForLibrarySection/);
assert.doesNotMatch(sectionPage, /data\/decks/, 'Library section pages should not read the deck registry anymore.');
// getStaticPaths must derive its section list from the librarySections.ts
// registry, not a hard-coded array — otherwise a new/renamed section in data
// would silently fail to get a route (docs/decisions/site-structure.md#5).
{
	const staticPathsBody = sectionPage.match(/export function getStaticPaths\(\)\s*\{([\s\S]*?)\n\}/);
	assert.ok(staticPathsBody, 'Library section page should export getStaticPaths().');
	assert.match(
		staticPathsBody[1],
		/pickLibrarySections\.map/,
		'getStaticPaths should derive section routes from src/data/librarySections.ts, not a hard-coded list.',
	);
}

assert.match(header, /const libraryUrl =/);
assert.match(header, /href=\{libraryUrl\}/);
assert.match(header, /nav\.library/);

assert.equal(existsSync(join(root, sectionPagePath)), true, 'Library section routes should exist.');
assert.equal(existsSync(join(root, usefulFeedsPagePath)), false, 'Useful Feeds is part of /{lang}/library/ now (vercel.json redirects it).');
assert.equal(existsSync(join(root, 'src/pages/[lang]/design.astro')), false, 'Do not add a Design page in PR05.');

const resources = readJsonFrontmatterCollection('src/content/resources');
const picks = readYamlFrontmatterCollection('src/content/picks');
const publishedPicks = picks.filter((pick) => pick.data.draft !== true);
const draftPicks = picks.filter((pick) => pick.data.draft === true);
const approvedResources = getApprovedResources(resources);

assert.ok(approvedResources.every((entry) => entry.data.status === 'approved'));
assert.ok(approvedResources.every((entry) => entry.data.review?.humanReviewed === true));

assert.equal(
	getResourceSummary({ data: { summary: { ko: '한국어', en: 'English' }, canonicalLanguage: 'ko' } }, 'jp'),
	'한국어',
); // requested 'jp' has no summary; falls back to the resource's canonical language ('ko'), not English.

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	const hasGeneratedLibraryPages = languages.some((lang) => existsSync(join(outputRoot, lang, 'library', 'index.html')));
	const hasGeneratedSectionPages = languages.every((lang) =>
		pickLibrarySections.every((section) => existsSync(join(outputRoot, lang, 'library', section.slug, 'index.html'))),
	);
	if (!hasGeneratedLibraryPages || !hasGeneratedSectionPages) continue;

	for (const lang of languages) {
		const htmlPath = join(outputRoot, lang, 'library', 'index.html');
		assert.ok(existsSync(htmlPath), `${relative(root, htmlPath)} should exist after build.`);

		const html = readFileSync(htmlPath, 'utf8');
		assert.match(html, /data-pagefind-body/);
		assert.match(html, new RegExp(escapeRegExp(ui[lang]['library.title'])));

		for (const entry of resources) {
			const shouldDisplay = entry.data.status === 'approved' && entry.data.review?.humanReviewed === true;
			assert.equal(
				html.includes(`id="${entry.data.id}"`),
				shouldDisplay,
				`${relative(root, htmlPath)} should ${shouldDisplay ? '' : 'not '}list resource "${entry.data.id}".`,
			);
		}
		for (const pick of publishedPicks) {
			assert.ok(html.includes(escapeHtml(pick.data.title)), `${relative(root, htmlPath)} should list published pick "${pick.data.title}".`);
		}
		assert.doesNotMatch(html, /href="[^"]*research-os[^"]*"/, `${relative(root, htmlPath)} must not link to research-os.`);

		for (const entry of draftPicks) {
			assert.equal(
				html.includes(entry.data.title),
				false,
				`${relative(root, htmlPath)} must not display draft pick "${entry.data.title}".`,
			);
		}

		// ALWAYS generated, even at zero published picks
		// (docs/decisions/site-structure.md — design/vibe-coding/dev-docs URLs
		// are live in production and must not 404).
		for (const section of pickLibrarySections) {
			const sectionHtmlPath = join(outputRoot, lang, 'library', section.slug, 'index.html');
			assert.ok(existsSync(sectionHtmlPath), `${relative(root, sectionHtmlPath)} should exist after build.`);

			const sectionHtml = readFileSync(sectionHtmlPath, 'utf8');
			assert.match(sectionHtml, /data-pagefind-body/);
			assert.match(sectionHtml, new RegExp(escapeRegExp(section.label[lang])));
			assert.ok(
				sectionHtml.includes(`content="${section.slug}"`),
				`${relative(root, sectionHtmlPath)} should include a Pagefind library-section filter.`,
			);

			for (const entry of draftPicks) {
				assert.equal(
					sectionHtml.includes(entry.data.title),
					false,
					`${relative(root, sectionHtmlPath)} must not display draft pick "${entry.data.title}".`,
				);
			}

			for (const pick of publishedPicks.filter((entry) => entry.data.section === section.slug)) {
				assert.ok(
					sectionHtml.includes(pick.data.title),
					`${relative(root, sectionHtmlPath)} should display published pick "${pick.data.title}".`,
				);

				const tier = computePickTier(pick.data, readPopularity(), pickTiers).tier;
				const tierMeta = pickTiers.find((candidate) => candidate.id === tier);
				assert.ok(
					sectionHtml.includes(tierMeta.label[lang]),
					`${relative(root, sectionHtmlPath)} should show the "${tierMeta.id}" tier heading for "${pick.data.title}".`,
				);
			}
		}

		// Decks moved off the Library onto /{lang}/research/decks/
		// (docs/decisions/site-structure.md#2); /{lang}/library/decks/ must no
		// longer be a build output (it permanently redirects instead — vercel.json).
		const decksHtmlPath = join(outputRoot, lang, 'library', 'decks', 'index.html');
		assert.equal(existsSync(decksHtmlPath), false, `${relative(root, decksHtmlPath)} should no longer be generated.`);

		const usefulFeedsHtmlPath = join(outputRoot, lang, 'library', 'useful-feeds', 'index.html');
		assert.equal(existsSync(usefulFeedsHtmlPath), false, `${relative(root, usefulFeedsHtmlPath)} should no longer be generated.`);
	}
}

// A tag research-os exports that no area lists lands in 기타 (src/data/libraryAreas.ts).
{
	const { getLibraryAreaId } = await import('../src/data/libraryAreas.ts');
	const unmapped = approvedResources.filter((entry) => getLibraryAreaId([entry.data.category, ...(entry.data.tags ?? [])]) === 'other');
	for (const entry of unmapped) {
		console.warn(`Library: "${entry.data.id}" (category "${entry.data.category}") has no area — add its tag to src/data/libraryAreas.ts or it shows under 기타.`);
	}
}

console.log(
	`Validated Library page source and data filters: ${publishedPicks.length} published picks, ${approvedResources.length} approved resources.`,
);

function readPopularity() {
	const popularityPath = join(root, 'src/data/popularity.json');
	if (!existsSync(popularityPath)) return {};
	return JSON.parse(readFileSync(popularityPath, 'utf8'));
}

function readYamlFrontmatterCollection(directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const source = readFileSync(filePath, 'utf8');
			const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			assert.ok(match, `${relative(root, filePath)} is missing frontmatter.`);
			const data = yaml.load(match[1]) ?? {};
			return { filePath, id: data.title, data };
		});
}

function readJsonFrontmatterCollection(directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const data = parseJsonFrontmatter(readFileSync(filePath, 'utf8'), filePath);
			return { id: data.id, filePath, data };
		});
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? walk(fullPath) : [fullPath];
	});
}

function parseJsonFrontmatter(source, filePath) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	assert.ok(match, `${relative(root, filePath)} is missing frontmatter.`);
	return JSON.parse(match[1]);
}

function escapeHtml(value) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
