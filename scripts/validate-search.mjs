import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.build ?? '', /search:index/);
assert.match(packageJson.scripts?.['build:astro'] ?? '', /astro build/);
assert.match(packageJson.scripts?.['search:index'] ?? '', /pagefind --site dist\/client/);
assert.match(packageJson.scripts?.['search:index'] ?? '', /pagefind --site \.vercel\/output\/static/);
assert.ok(packageJson.devDependencies?.pagefind, 'pagefind should be a dev dependency');

const searchPage = read('src/pages/[lang]/search.astro');
for (const lang of ['ko', 'jp', 'en']) {
  assert.match(searchPage, new RegExp(`params: \\{ lang: '${lang}' \\}`));
}
assert.match(searchPage, /new PagefindUI/);
assert.match(searchPage, /buildSearchFilters/);
assert.match(searchPage, /language: \[lang\]/);
assert.match(searchPage, /section: \[currentSectionFilter\]/);
assert.match(searchPage, /data-section-filter/);
assert.match(searchPage, /\/pagefind\/pagefind-ui\.js/);
assert.match(searchPage, /\/pagefind\/pagefind-ui\.css/);
assert.doesNotMatch(searchPage, /\(window as any\)/, 'browser search script must not contain TypeScript syntax');

const header = read('src/components/Header.astro');
assert.match(header, /const searchUrl =/);
assert.match(header, /href=\{searchUrl\}/);

const blogPost = read('src/layouts/BlogPost.astro');
assert.match(blogPost, /data-pagefind-body/);
assert.match(blogPost, /data-pagefind-filter="language\[content\]"/);
assert.match(blogPost, /data-pagefind-filter="section\[content\]"/);
assert.match(blogPost, /data-pagefind-filter="category\[content\]"/);
assert.match(blogPost, /data-pagefind-filter="tag\[content\]"/);

for (const componentPath of ['src/components/Header.astro', 'src/components/Footer.astro']) {
  assert.match(read(componentPath), /data-pagefind-ignore/);
}

assert.ok(existsSync(join(root, 'docs/search.md')), 'docs/search.md should exist');

for (const outputRoot of [join(root, 'dist/client'), join(root, '.vercel/output/static')]) {
  if (!existsSync(outputRoot)) continue;

  for (const lang of ['ko', 'jp', 'en']) {
    const htmlPath = join(outputRoot, lang, 'search', 'index.html');
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      assert.match(html, /id="search"/);
      assert.doesNotMatch(html, /\(window as any\)/, `${htmlPath} must not contain TypeScript syntax`);
    }
  }

  const pagefindRoot = join(outputRoot, 'pagefind');
  if (existsSync(pagefindRoot)) {
    assert.ok(existsSync(join(pagefindRoot, 'pagefind-ui.js')), 'Pagefind UI JS should be generated');
    assert.ok(existsSync(join(pagefindRoot, 'pagefind-ui.css')), 'Pagefind UI CSS should be generated');
  }
}

console.log('Validated Pagefind search source configuration.');
