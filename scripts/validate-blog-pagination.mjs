import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const languages = ['ko', 'jp', 'en'];
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));
assert.match(packageJson.scripts?.['blog:pagination:validate'] ?? '', /validate-blog-pagination\.mjs/);
assert.match(packageJson.scripts?.['images:inventory'] ?? '', /inventory-public-images\.mjs/);

const blogUtils = read('src/utils/blog.ts');
const blogIndex = read('src/pages/[lang]/blog/index.astro');
const paginatedRoute = read('src/pages/[lang]/blog/page/[page].astro');
const sitemap = read('src/pages/sitemap.xml.ts');

assert.match(blogUtils, /BLOG_PAGE_SIZE = 12/);
assert.match(blogUtils, /getBlogPageUrl/);
assert.match(blogIndex, /blog-series-sidebar/);
assert.match(blogIndex, /sortPostsBySeries/);
assert.match(blogIndex, /PostListCard/);
assert.doesNotMatch(blogIndex, /PaginationNav/);
assert.match(paginatedRoute, /getStaticPaths/);
assert.match(paginatedRoute, /index \+ 2/);
assert.match(paginatedRoute, /PaginationNav/);
assert.match(sitemap, /blogPaginationPages/);

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
	if (!existsSync(outputRoot)) continue;

	for (const lang of languages) {
		assert.equal(
			existsSync(join(outputRoot, lang, 'blog', 'page', '1')),
			false,
			`${lang} should not generate a /blog/page/1/ duplicate.`,
		);

		const pageRoot = join(outputRoot, lang, 'blog', 'page');
		if (!existsSync(pageRoot)) continue;

		const pageNumbers = readdirSync(pageRoot)
			.filter((name) => /^\d+$/.test(name))
			.map(Number)
			.sort((a, b) => a - b);

		for (const pageNumber of pageNumbers) {
			assert.ok(pageNumber >= 2, `${lang} generated invalid page ${pageNumber}.`);
			assert.ok(
				existsSync(join(pageRoot, String(pageNumber), 'index.html')),
				`${lang} page ${pageNumber} should have index.html.`,
			);
		}
	}
}

console.log('Validated localized blog index series view and paginated archive routes.');
