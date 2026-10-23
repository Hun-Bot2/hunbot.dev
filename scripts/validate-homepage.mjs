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
import { getLibraryItems } from '../src/utils/library.ts';
import { getRecentPicks } from '../src/utils/picks.ts';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const homepagePath = 'src/pages/[lang]/index.astro';
const homepage = read(homepagePath);
const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.['homepage:validate'] ?? '', /validate-homepage\.mjs/);

for (const lang of languages) {
	assert.match(homepage, new RegExp(`params: \\{ lang: '${lang}' \\}`), `Homepage should generate ${lang} route.`);
	assert.ok(ui[lang]?.['home.library.title'], `${lang} home.library.title copy is required.`);
	assert.ok(ui[lang]?.['home.explore.title'], `${lang} home.explore.title copy is required.`);
}

// One Library block (docs/decisions/site-structure.md, revision 2026-10-04):
// the newest items from src/utils/library.ts's getLibraryItems, the same
// helper /{lang}/library/ uses, so the two cannot drift apart.
assert.match(homepage, /getLibraryItems/);
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
	'home-library',
	'home-briefs',
];
let previousIndex = -1;
for (const token of sectionOrder) {
	const index = homepage.indexOf(token);
	assert.ok(index > previousIndex, `${token} should appear after the previous homepage section.`);
	previousIndex = index;
}


// 논문 리뷰 (home-reviews) must link out to the Research hub — papers and
// reviews moved there (docs/decisions/site-structure.md#1), so a stale link
// back into the Library would be a dead end.
assert.match(homepage, /const researchUrl = `\$\{languageBasePath\}\/research`;/);
{
	const reviewsPanel = homepage.match(/<section class="home-feature-panel home-reviews"[\s\S]*?<\/section>/);
	assert.ok(reviewsPanel, 'Homepage should render a home-reviews panel.');
	assert.match(
		reviewsPanel[0],
		/href=\{researchUrl\}/,
		'home-reviews panel should link to the Research hub via researchUrl.',
	);
}

// "라이브러리 보기" (home.primary-cta) must still point at the Library hub.
assert.match(homepage, /const libraryUrl = `\$\{languageBasePath\}\/library`;/);
{
	const libraryPanel = homepage.match(/<section class="home-section home-library"[\s\S]*?<\/section>/);
	assert.ok(libraryPanel, 'Homepage should render a home-library panel.');
	assert.match(
		libraryPanel[0],
		/href=\{libraryUrl\}/,
		'home-library panel should link to the Library hub via libraryUrl.',
	);
	assert.match(
		libraryPanel[0],
		/home\.primary-cta/,
		'home-library panel should use the primary-cta copy key ("라이브러리 보기").',
	);
}
for (const lang of languages) {
	assert.ok(ui[lang]?.['home.primary-cta'], `${lang} home.primary-cta copy is required.`);
}

const resources = readJsonFrontmatterCollection('src/content/resources');
const picks = readYamlFrontmatterCollection('src/content/picks');
const libraryItems = getLibraryItems(resources, picks).slice(0, 3);
for (const item of libraryItems) {
	const source = resources.find((entry) => entry.data.id === item.id);
	if (!source) continue; // a pick; drafts are checked below
	assert.equal(source.data.status, 'approved', `${item.id} Library item must be an approved resource.`);
	assert.equal(source.data.review?.humanReviewed, true, `${item.id} Library item must be human reviewed.`);
}
for (const pick of picks.filter((entry) => entry.data.draft === true)) {
	assert.ok(!libraryItems.some((item) => item.title === pick.data.title), `${pick.id} draft pick must not be on the homepage.`);
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
	`Validated homepage source, filters and the Library block: ${libraryItems.length} library items.`,
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
