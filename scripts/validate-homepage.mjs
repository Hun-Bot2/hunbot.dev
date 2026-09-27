import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
// js-yaml is not a direct dependency of this repo, but it is already
// installed in node_modules as a direct dependency of astro — same reasoning
// scripts/validate-library-page.mjs and scripts/validate-picks.mjs already
// give for using it to parse `picks`' YAML frontmatter.
import yaml from 'js-yaml';

import { ui } from '../src/i18n/ui.ts';
import {
	getLatestBlogPosts,
	getLatestBriefPosts,
	getPostsForLanguage,
} from '../src/utils/homepage.ts';
import { getUsefulFeedItems } from '../src/utils/library.ts';
import { getPickSectionCounts, getRecentPicks } from '../src/utils/picks.ts';
import { librarySections } from '../src/data/librarySections.ts';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const homepagePath = 'src/pages/[lang]/index.astro';
const homepage = read(homepagePath);
const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.['homepage:validate'] ?? '', /validate-homepage\.mjs/);

for (const lang of languages) {
	assert.match(homepage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Homepage should generate ${lang} route.`);
	// home.picks.* is gone: the "큐레이션" panel was replaced by a Useful Feeds
	// panel (docs/decisions/site-structure.md#4) — papers moved to Research
	// and resources are now Useful Feeds, so a papers+resources mixed pick no
	// longer fits.
	assert.ok(ui[lang]?.['home.feeds.title'], `${lang} home.feeds.title copy is required.`);
	assert.ok(ui[lang]?.['home.explore.title'], `${lang} home.explore.title copy is required.`);
}

// getHomepageLibraryPicks/getHomepageSectionCounts are gone (moved logic):
// the Useful Feeds panel and the Library block now read src/utils/library.ts's
// getUsefulFeedItems and src/utils/picks.ts's getRecentPicks directly, the
// same helpers /{lang}/library/useful-feeds.astro and /{lang}/library.astro
// use, so this page cannot silently drift from either.
assert.match(homepage, /getUsefulFeedItems/);
assert.match(homepage, /getRecentPicks/);
assert.match(homepage, /getLatestBriefPosts/);
assert.match(homepage, /getLatestBlogPosts/);
assert.match(homepage, /getPostsForLanguage/);
assert.match(homepage, /data-pagefind-body/);
assert.match(homepage, /data-pagefind-filter="language\[content\]"/);
assert.match(homepage, /data-pagefind-filter="section\[content\]"/);
assert.doesNotMatch(homepage, /<form\b/i, 'Homepage PR must not add newsletter forms.');
assert.doesNotMatch(homepage, /type=["']email["']/i, 'Homepage PR must not collect email addresses.');

// home-picks -> home-feeds (docs/decisions/site-structure.md#4): same
// position in the section order, new panel.
const sectionOrder = [
	'home-latest',
	'home-feeds',
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

const resources = readJsonFrontmatterCollection('src/content/resources');
const usefulFeedItems = getUsefulFeedItems(resources, 'ko').slice(0, 3);
assert.ok(usefulFeedItems.length <= 3, 'Homepage Useful Feeds panel shows at most 3 items.');
for (const item of usefulFeedItems) {
	const source = resources.find((entry) => entry.id === item.id);
	assert.equal(source.data.status, 'approved', `${item.id} Useful Feeds item must be an approved resource.`);
	assert.equal(source.data.review?.humanReviewed, true, `${item.id} Useful Feeds item must be human reviewed.`);
}

const picks = readYamlFrontmatterCollection('src/content/picks');
const publishedPickCount = picks.filter((pick) => pick.data.draft !== true).length;
const recentPicks = publishedPickCount >= 3 ? getRecentPicks(picks, 6) : [];
for (const pick of recentPicks) {
	assert.notEqual(pick.data.draft, true, `${pick.id} recent pick must not be a draft.`);
}

const sectionCounts = getPickSectionCounts(picks.filter((pick) => pick.data.draft !== true));
for (const section of librarySections) {
	const count = sectionCounts.get(section.slug) ?? 0;
	assert.ok(Number.isInteger(count) && count >= 0, `${section.slug} pick count should be a nonnegative integer.`);
}

// Recent-picks / fewer-than-3 fallback logic (docs/decisions/site-structure.md#4):
// getRecentPicks itself is pure (filters drafts, sorts by addedAt desc, then
// limits) — a small fixture test here, independent of real content, pins that
// behavior directly rather than only through the real-content check above.
const pickFixtures = [
	pickFixture('a', '2026-01-01'),
	pickFixture('b', '2026-01-05'),
	pickFixture('c', '2026-01-03'),
	pickFixture('draft', '2026-01-10', true),
];
assert.deepEqual(
	getRecentPicks(pickFixtures, 2).map((pick) => pick.id),
	['b', 'c'],
	'getRecentPicks should exclude drafts, sort newest addedAt first, and respect the limit.',
);
assert.deepEqual(
	getRecentPicks(pickFixtures.slice(0, 2), 6).map((pick) => pick.id),
	['b', 'a'],
	'Below the homepage\'s fewer-than-3-picks threshold, getRecentPicks still returns whatever is published.',
);

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
	`Validated homepage source, filters, Useful Feeds, and Library picks: ${usefulFeedItems.length} feed items, ${recentPicks.length} recent picks, ${sectionCounts.size} sections with picks.`,
);

function read(path) {
	return readFileSync(join(root, path), 'utf8');
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
			return { id: data.title, filePath, data };
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

function pickFixture(id, addedAt, draft = false) {
	return { id, data: { addedAt, draft } };
}
