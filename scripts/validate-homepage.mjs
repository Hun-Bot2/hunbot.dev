import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { decks } from '../src/data/decks.ts';
import { ui } from '../src/i18n/ui.ts';
import {
	getHomepageLibraryPicks,
	getHomepageSectionCounts,
	getLatestBlogPosts,
	getLatestBriefPosts,
	getPostsForLanguage,
} from '../src/utils/homepage.ts';
import { librarySections } from '../src/utils/library.ts';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const homepagePath = 'src/pages/[lang]/index.astro';
const homepage = read(homepagePath);
const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.['homepage:validate'] ?? '', /validate-homepage\.mjs/);

for (const lang of languages) {
	assert.match(homepage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Homepage should generate ${lang} route.`);
	assert.ok(ui[lang]?.['home.picks.title'], `${lang} home.picks.title copy is required.`);
	assert.ok(ui[lang]?.['home.explore.title'], `${lang} home.explore.title copy is required.`);
}

assert.match(homepage, /getHomepageLibraryPicks/);
assert.match(homepage, /getHomepageSectionCounts/);
assert.match(homepage, /getLatestBriefPosts/);
assert.match(homepage, /getLatestBlogPosts/);
assert.match(homepage, /getPostsForLanguage/);
assert.match(homepage, /data-pagefind-body/);
assert.match(homepage, /data-pagefind-filter="language\[content\]"/);
assert.match(homepage, /data-pagefind-filter="section\[content\]"/);
assert.doesNotMatch(homepage, /<form\b/i, 'Homepage PR must not add newsletter forms.');
assert.doesNotMatch(homepage, /type=["']email["']/i, 'Homepage PR must not collect email addresses.');

const sectionOrder = [
	'home-latest',
	'home-picks',
	'home-library',
	'home-briefs',
];
let previousIndex = -1;
for (const token of sectionOrder) {
	const index = homepage.indexOf(token);
	assert.ok(index > previousIndex, `${token} should appear after the previous homepage section.`);
	previousIndex = index;
}

assert.ok(
	existsSync(join(root, 'src/pages/[lang]/library/[section].astro')),
	'Dynamic Library section route should exist before homepage links to section pages.',
);
assert.match(homepage, /getLibrarySectionPath/);

const resources = readCollection('resources', 'src/content/resources');
const papers = readCollection('papers', 'src/content/papers');
const picks = getHomepageLibraryPicks(resources, papers, 4);
for (const pick of picks) {
	if (pick.kind === 'resource') {
		assert.equal(pick.resource.data.status, 'approved', `${pick.id} resource pick must be approved.`);
		assert.equal(pick.resource.data.review?.humanReviewed, true, `${pick.id} resource pick must be reviewed.`);
	} else {
		assert.equal(pick.paper.data.status, 'approved', `${pick.id} paper pick must be approved.`);
		assert.equal(pick.paper.data.review?.humanReviewed, true, `${pick.id} paper pick must be reviewed.`);
	}
}

const sectionCounts = getHomepageSectionCounts(resources, papers, decks);
for (const section of librarySections) {
	assert.ok(Number.isInteger(sectionCounts[section.id]), `${section.id} count should be an integer.`);
	assert.ok(sectionCounts[section.id] >= 0, `${section.id} count should be nonnegative.`);
}

const fixturePosts = [
	blogFixture('ko/blog/older', '2026-05-01', [], 'devlog'),
	blogFixture('ko/blog/brief-old', '2026-05-02', ['brief'], 'library'),
	blogFixture('en/blog/new', '2026-05-04', [], 'devlog'),
	blogFixture('ko/blog/brief-new', '2026-05-05', ['library brief'], 'notes'),
	blogFixture('jp/blog/new', '2026-05-06', [], 'devlog'),
	blogFixture('ko/blog/new', '2026-05-07', [], 'devlog'),
];
const koPosts = getPostsForLanguage(fixturePosts, 'ko');
assert.deepEqual(
	koPosts.map((post) => post.id),
	['ko/blog/new', 'ko/blog/brief-new', 'ko/blog/brief-old', 'ko/blog/older'],
);
assert.deepEqual(
	getLatestBriefPosts(koPosts).map((post) => post.id),
	['ko/blog/brief-new', 'ko/blog/brief-old'],
);
assert.deepEqual(
	getLatestBlogPosts(koPosts).map((post) => post.id),
	['ko/blog/new', 'ko/blog/older'],
);

console.log(
	`Validated homepage source, filters, and Library picks: ${picks.length} picks, ${Object.keys(sectionCounts).length} sections.`,
);

function read(path) {
	return readFileSync(join(root, path), 'utf8');
}

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

function blogFixture(id, pubDate, tags, category) {
	return {
		id,
		data: {
			title: id,
			description: id,
			pubDate: new Date(pubDate),
			tags,
			category,
		},
	};
}
