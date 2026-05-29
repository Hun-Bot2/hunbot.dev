import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import {
	getActiveTopics,
	getApprovedPapers,
	getApprovedResources,
	getLocalizedText,
	getPaperTldr,
	getResourceSummary,
	getTopicDescription,
	getTopicLabel,
} from '../src/utils/library.ts';
import { ui } from '../src/i18n/ui.ts';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['library-page:validate'] ?? '', /validate-library-page\.mjs/);

const libraryPagePath = 'src/pages/[lang]/library.astro';
const libraryPage = read(libraryPagePath);
const header = read('src/components/Header.astro');

for (const lang of languages) {
	assert.match(libraryPage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Library page should generate ${lang} route.`);
	assert.ok(ui[lang]?.['nav.library'], `${lang} nav.library copy is required.`);
	assert.ok(ui[lang]?.['library.title'], `${lang} Library title copy is required.`);
}

assert.match(libraryPage, /getCollection\('resources'\)/);
assert.match(libraryPage, /getCollection\('papers'\)/);
assert.match(libraryPage, /getCollection\('topics'\)/);
assert.match(libraryPage, /getApprovedResources/);
assert.match(libraryPage, /getApprovedPapers/);
assert.match(libraryPage, /getActiveTopics/);
assert.match(libraryPage, /data-pagefind-body/);
assert.match(libraryPage, /data-pagefind-filter="language\[content\]"/);
assert.match(libraryPage, /data-pagefind-filter="section\[content\]"/);
assert.doesNotMatch(libraryPage, /\/(?:ko|jp|en)\/library\/(?:design|vibe-coding|dev-docs|ai-papers|useful-feeds|decks)/);

assert.match(header, /const libraryUrl =/);
assert.match(header, /href=\{libraryUrl\}/);
assert.match(header, /nav\.library/);

assert.equal(existsSync(join(root, 'src/pages/[lang]/library')), false, 'Do not add detailed Library section routes in PR05.');
assert.equal(existsSync(join(root, 'src/pages/[lang]/design.astro')), false, 'Do not add a Design page in PR05.');

const resources = readCollection('resources', 'src/content/resources');
const papers = readCollection('papers', 'src/content/papers');
const topics = readCollection('topics', 'src/content/topics');

const approvedResources = getApprovedResources(resources);
const approvedPapers = getApprovedPapers(papers);
const activeTopics = getActiveTopics(topics);

assert.ok(approvedResources.every((entry) => entry.data.status === 'approved'));
assert.ok(approvedResources.every((entry) => entry.data.review?.humanReviewed === true));
assert.ok(approvedPapers.every((entry) => entry.data.status === 'approved'));
assert.ok(approvedPapers.every((entry) => entry.data.review?.humanReviewed === true));
assert.ok(activeTopics.every((entry) => entry.data.status === 'active'));

assert.equal(getLocalizedText({ ko: '한국어', en: 'English' }, 'jp'), '한국어');

const resourceWithKoreanFallback = approvedResources.find((entry) => entry.data.summary?.ko && !entry.data.summary?.jp);
if (resourceWithKoreanFallback) {
	assert.equal(getResourceSummary(resourceWithKoreanFallback, 'jp'), resourceWithKoreanFallback.data.summary.ko);
}

const paperWithKoreanFallback = approvedPapers.find((entry) => entry.data.summary?.ko?.tldr && !entry.data.summary?.jp?.tldr);
if (paperWithKoreanFallback) {
	assert.equal(getPaperTldr(paperWithKoreanFallback, 'jp'), paperWithKoreanFallback.data.summary.ko.tldr);
}

const topicWithFullLocale = activeTopics.find((entry) => entry.data.label?.ko && entry.data.description?.ko);
if (topicWithFullLocale) {
	assert.ok(getTopicLabel(topicWithFullLocale, 'ko'));
	assert.ok(getTopicDescription(topicWithFullLocale, 'en') || getTopicDescription(topicWithFullLocale, 'ko'));
}

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	const hasGeneratedLibraryPages = languages.some((lang) => existsSync(join(outputRoot, lang, 'library', 'index.html')));
	if (!hasGeneratedLibraryPages) continue;

	for (const lang of languages) {
		const htmlPath = join(outputRoot, lang, 'library', 'index.html');
		assert.ok(existsSync(htmlPath), `${relative(root, htmlPath)} should exist after build.`);

		const html = readFileSync(htmlPath, 'utf8');
		assert.match(html, /data-pagefind-body/);
		assert.match(html, new RegExp(ui[lang]['library.title']));
		assert.doesNotMatch(html, /\/(?:ko|jp|en)\/library\/(?:design|vibe-coding|dev-docs|ai-papers|useful-feeds|decks)/);

		for (const entry of resources) {
			const shouldDisplay = entry.data.status === 'approved' && entry.data.review?.humanReviewed === true;
			if (!shouldDisplay) {
				assert.equal(
					html.includes(entry.data.title),
					false,
					`${relative(root, htmlPath)} must not display unapproved resource "${entry.data.title}".`,
				);
			}
		}

		for (const entry of papers) {
			const shouldDisplay = entry.data.status === 'approved' && entry.data.review?.humanReviewed === true;
			if (!shouldDisplay) {
				assert.equal(
					html.includes(entry.data.title),
					false,
					`${relative(root, htmlPath)} must not display unapproved paper "${entry.data.title}".`,
				);
			}
		}

		for (const entry of topics) {
			const label = getTopicLabel(entry, lang);
			const shouldDisplay = entry.data.status === 'active';
			if (!shouldDisplay) {
				assert.equal(
					html.includes(label),
					false,
					`${relative(root, htmlPath)} must not display inactive topic "${entry.data.id}".`,
				);
			}
		}
	}
}

console.log(
	`Validated Library page source and data filters: ${approvedResources.length} approved resources, ${approvedPapers.length} approved papers, ${activeTopics.length} active topics.`,
);

function readCollection(collection, directory) {
	const fullDirectory = join(root, directory);
	if (!existsSync(fullDirectory)) return [];

	return walk(fullDirectory)
		.filter((filePath) => ['.md', '.mdx'].includes(extname(filePath)))
		.map((filePath) => {
			const data = parseJsonFrontmatter(readFileSync(filePath, 'utf8'), filePath);
			return {
				collection,
				id: data.id,
				filePath,
				data,
			};
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
