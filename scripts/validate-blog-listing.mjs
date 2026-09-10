import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const read = (path) => readFileSync(join(root, path), 'utf8');

// Mirrors getFrontmatterIssues() / excludeDuplicates() / getAllPosts() in
// src/utils/blog.ts: a post is publishable only when it is not a draft, its
// frontmatter isn't unedited template content, and it doesn't share a
// language + title + pubDate with another post in the same directory.
const PLACEHOLDER_DESCRIPTIONS = new Set(['설명 입력', 'Enter description', '説明を入力']);
const PLACEHOLDER_TAGS = new Set(['tag1', 'tag2', 'tag']);
const PLACEHOLDER_CATEGORY = 'category';
const PLACEHOLDER_SERIES = new Set(['series 이름', 'series name']);

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['blog:listing:validate'] ?? '', /validate-blog-listing\.mjs/);
assert.match(packageJson.scripts?.['images:inventory'] ?? '', /inventory-public-images\.mjs/);

const blogUtils = read('src/utils/blog.ts');
const blogIndex = read('src/pages/[lang]/blog/index.astro');
const filterBar = read('src/components/blog/BlogFilterBar.astro');
const filterScript = read('public/scripts/blog-filters.js');
const sitemap = read('src/pages/sitemap.xml.ts');

// The listing is date-first with client-side facets over the complete set.
assert.match(blogUtils, /getNormalizedCategoryCounts/);
assert.match(blogUtils, /getPostYears/);
assert.match(blogUtils, /getMultiPostSeries/);
assert.match(blogIndex, /BlogFilterBar/);
assert.match(blogIndex, /PostListCard/);
assert.match(blogIndex, /data-blog-posts/);
assert.match(blogIndex, /data-post-card/);
assert.match(blogIndex, /getPostsByLanguage/);
assert.match(blogIndex, /\/scripts\/blog-filters\.js/);

// Every facet the script reads must be emitted on the cards, or filtering
// silently hides everything.
for (const attribute of ['data-post-category', 'data-post-year', 'data-post-series']) {
	assert.match(blogIndex, new RegExp(attribute), `${attribute} must be rendered on post cards.`);
}

for (const facet of ['category', 'year', 'series']) {
	assert.match(filterScript, new RegExp(`'${facet}'`), `blog-filters.js must handle the ${facet} facet.`);
}

assert.match(filterBar, /aria-pressed/, 'Filter chips need aria-pressed state.');
assert.match(filterScript, /localStorage/);
assert.match(filterScript, /URLSearchParams/);
assert.match(filterScript, /replaceState/);

// Paginated routes were retired in favour of filtering the full list.
assert.equal(
	existsSync(join(root, 'src/pages/[lang]/blog/page')),
	false,
	'The paginated blog route was retired; filtering operates on the full list.',
);
assert.doesNotMatch(blogIndex, /PaginationNav/);
assert.doesNotMatch(sitemap, /blogPaginationPages/);

const vercelConfig = JSON.parse(read('vercel.json'));
assert.ok(
	(vercelConfig.redirects ?? []).some((redirect) => redirect.source?.includes('/blog/page/')),
	'Retired paginated URLs must still redirect instead of 404ing.',
);

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	for (const lang of languages) {
		assert.equal(
			existsSync(join(outputRoot, lang, 'blog', 'page')),
			false,
			`${lang} should not generate paginated blog routes.`,
		);

		const indexPath = join(outputRoot, lang, 'blog', 'index.html');
		if (!existsSync(indexPath)) continue;

		// Guards the draft leak: the rendered card count must equal the number of
		// publishable source posts for that language.
		const rendered = (readFileSync(indexPath, 'utf8').match(/data-post-card/g) ?? []).length;
		const publishable = countPublishablePosts(join(root, 'src/content/blog', lang));

		assert.equal(
			rendered,
			publishable,
			`${lang} blog index renders ${rendered} posts but ${publishable} are publishable. ` +
				'A mismatch usually means drafts are leaking into a listing.',
		);
	}
}

console.log('Validated blog listing structure, filter wiring, and retired pagination routes.');

function countPublishablePosts(directory) {
	return collectPublishablePosts(directory).length;
}

function collectPublishablePosts(directory) {
	if (!existsSync(directory)) return [];

	const records = walkFrontmatter(directory);
	const withoutPlaceholders = records.filter((record) => !record.draft && getIssues(record).length === 0);

	const counts = new Map();
	for (const record of withoutPlaceholders) {
		const key = `${record.title}::${record.pubDate}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return withoutPlaceholders.filter((record) => counts.get(`${record.title}::${record.pubDate}`) === 1);
}

function walkFrontmatter(directory) {
	const records = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const entryPath = join(directory, entry.name);

		if (entry.isDirectory()) {
			records.push(...walkFrontmatter(entryPath));
			continue;
		}

		if (!/\.mdx?$/.test(entry.name)) continue;

		const source = readFileSync(entryPath, 'utf8');
		const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!frontmatterMatch) continue;

		const frontmatter = frontmatterMatch[1];
		records.push({
			path: entryPath,
			draft: /^draft:\s*true\s*$/m.test(frontmatter),
			title: (getFrontmatterField(frontmatter, 'title') ?? '').trim(),
			description: (getFrontmatterField(frontmatter, 'description') ?? '').trim(),
			pubDate: (getFrontmatterField(frontmatter, 'pubDate') ?? '').trim(),
			category: getFrontmatterField(frontmatter, 'category'),
			series: getFrontmatterField(frontmatter, 'series'),
			tags: getFrontmatterField(frontmatter, 'tags'),
		});
	}

	return records;
}

function getFrontmatterField(frontmatter, fieldName) {
	const match = frontmatter.match(new RegExp(`^\\s*${fieldName}\\s*:\\s*(.+?)\\s*$`, 'm'));
	if (!match) return null;

	let value = match[1].trim();
	if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
		value = value.slice(1, -1).trim();
	}

	return value;
}

function getIssues(record) {
	const issues = [];

	if (PLACEHOLDER_DESCRIPTIONS.has(record.description)) {
		issues.push('placeholder description');
	}

	if (record.tags) {
		const tags = record.tags
			.trim()
			.replace(/^\[/, '')
			.replace(/\]$/, '')
			.split(',')
			.map((tag) => tag.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
			.filter((tag) => tag.length > 0);

		if (tags.some((tag) => PLACEHOLDER_TAGS.has(tag))) {
			issues.push('placeholder tags');
		}
	}

	if (record.category && record.category.trim().toLowerCase() === PLACEHOLDER_CATEGORY) {
		issues.push('placeholder category');
	}

	if (record.series && PLACEHOLDER_SERIES.has(record.series.trim().toLowerCase())) {
		issues.push('placeholder series');
	}

	return issues;
}
