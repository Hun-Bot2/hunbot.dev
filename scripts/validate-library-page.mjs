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
const usefulFeedsPage = read(usefulFeedsPagePath);
const header = read('src/components/Header.astro');

for (const lang of languages) {
	assert.match(libraryPage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Library page should generate ${lang} route.`);
	assert.match(usefulFeedsPage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Useful Feeds page should generate ${lang} route.`);
	assert.ok(ui[lang]?.['nav.library'], `${lang} nav.library copy is required.`);
	assert.ok(ui[lang]?.['library.title'], `${lang} Library title copy is required.`);
	assert.ok(ui[lang]?.['library.tab.external-links'], `${lang} library.tab.external-links copy is required.`);
	assert.ok(ui[lang]?.['library.tab.useful-feeds'], `${lang} library.tab.useful-feeds copy is required.`);
}

// 외부 링크 tab restructure (docs/decisions/site-structure.md, revision
// 2026-09-27): the hub is now entirely picks-backed. The section-card grid,
// Featured Resources, and Featured Topics are gone, so the hub no longer
// reads resources, papers, or topics at all.
assert.match(libraryPage, /getCollection\('picks'\)/);
assert.match(libraryPage, /computePickTier/);
assert.match(libraryPage, /data-pagefind-body/);
assert.match(libraryPage, /data-pagefind-filter="language\[content\]"/);
assert.match(libraryPage, /data-pagefind-filter="section\[content\]"/);
assert.doesNotMatch(libraryPage, /getCollection\('resources'\)/);
assert.doesNotMatch(libraryPage, /getCollection\('topics'\)/);
assert.doesNotMatch(libraryPage, /getCollection\('papers'\)/);
// All three Library pages share one tab bar component so a page cannot drift
// into its own ad hoc tab markup (docs/decisions/site-structure.md#3).
assert.match(libraryPage, /<LibraryTabs\b/, 'Library hub should render the shared LibraryTabs component.');

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
assert.match(sectionPage, /<LibraryTabs\b/, 'Library section pages should render the shared LibraryTabs component.');
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

// getUsefulFeedItems (src/utils/library.ts) replaced this page's own
// getApprovedResources+sortStable+map — the homepage's Useful Feeds panel
// shares the exact same helper (docs/decisions/site-structure.md#4).
assert.match(usefulFeedsPage, /getUsefulFeedItems/);
assert.match(usefulFeedsPage, /data-pagefind-body/);
assert.match(usefulFeedsPage, /<LibraryTabs\b/, 'Useful Feeds page should render the shared LibraryTabs component.');

assert.match(header, /const libraryUrl =/);
assert.match(header, /href=\{libraryUrl\}/);
assert.match(header, /nav\.library/);

assert.equal(existsSync(join(root, sectionPagePath)), true, 'Library section routes should exist.');
assert.equal(existsSync(join(root, usefulFeedsPagePath)), true, 'Useful Feeds route should exist.');
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
		assertLibraryTabs(html, htmlPath, `/${lang}/library/`);

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
			// Section pages count as the 외부 링크 tab (docs/decisions/site-structure.md#3).
			assertLibraryTabs(sectionHtml, sectionHtmlPath, `/${lang}/library/`);

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
		assert.ok(existsSync(usefulFeedsHtmlPath), `${relative(root, usefulFeedsHtmlPath)} should exist after build.`);
		const usefulFeedsHtml = readFileSync(usefulFeedsHtmlPath, 'utf8');
		assert.match(usefulFeedsHtml, /data-pagefind-body/);
		assertLibraryTabs(usefulFeedsHtml, usefulFeedsHtmlPath, `/${lang}/library/useful-feeds/`);

		for (const entry of resources) {
			const shouldDisplay = entry.data.status === 'approved' && entry.data.review?.humanReviewed === true;
			if (!shouldDisplay) {
				assert.equal(
					usefulFeedsHtml.includes(entry.data.title),
					false,
					`${relative(root, usefulFeedsHtmlPath)} must not display unapproved resource "${entry.data.title}".`,
				);
			}
		}

		// Useful Feeds is picks-free, but the "no draft pick title anywhere in
		// the Library" guarantee should hold across all three page types, not
		// just the two that read the picks collection directly.
		for (const entry of draftPicks) {
			assert.equal(
				usefulFeedsHtml.includes(entry.data.title),
				false,
				`${relative(root, usefulFeedsHtmlPath)} must not display draft pick "${entry.data.title}".`,
			);
		}
	}
}

console.log(
	`Validated Library page source and data filters: ${publishedPicks.length} published picks, ${approvedResources.length} approved resources.`,
);

// Every Library page (hub, section, Useful Feeds) renders the same
// LibraryTabs component (docs/decisions/site-structure.md#3). Checked once
// here instead of copy-pasted per call site so the three page checks cannot
// silently drift apart.
function assertLibraryTabs(html, htmlPath, expectedActiveHref) {
	const navMatch = html.match(/<nav class="library-tabs"[\s\S]*?<\/nav>/);
	assert.ok(navMatch, `${relative(root, htmlPath)} should render the shared Library tab bar.`);
	const nav = navMatch[0];

	// Exactly one tab is aria-current="page", and it must be the tab this
	// page actually belongs to — a missing or doubled aria-current silently
	// breaks the tab bar's accessibility semantics.
	const currentTabs = [...nav.matchAll(/<a href="([^"]+)" class="library-tab"[^>]*aria-current="page"/g)];
	assert.equal(
		currentTabs.length,
		1,
		`${relative(root, htmlPath)} should mark exactly one Library tab as aria-current="page".`,
	);
	assert.equal(
		currentTabs[0][1],
		expectedActiveHref,
		`${relative(root, htmlPath)} should mark ${expectedActiveHref} as the current Library tab.`,
	);

	// The "research-os" label names where Useful Feeds items came from; it
	// must never become a link to the private repository
	// (docs/decisions/site-structure.md#3).
	assert.ok(html.includes('research-os'), `${relative(root, htmlPath)} should show the "research-os" label.`);
	assert.doesNotMatch(
		html,
		/<a[^>]*>[^<]*research-os[^<]*<\/a>/,
		`${relative(root, htmlPath)} "research-os" label must not be inside a link.`,
	);
	assert.doesNotMatch(
		html,
		/href="[^"]*research-os[^"]*"/,
		`${relative(root, htmlPath)} must not have any href pointing at "research-os".`,
	);
}

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

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
