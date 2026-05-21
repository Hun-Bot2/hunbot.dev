import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));

assert.match(packageJson.scripts?.build ?? '', /search:index/);
assert.match(packageJson.scripts?.['build:astro'] ?? '', /astro build/);
assert.match(packageJson.scripts?.['search:index'] ?? '', /pagefind --site \.vercel\/output\/static/);
assert.ok(packageJson.devDependencies?.pagefind, 'pagefind should be a dev dependency');

const searchPage = read('src/pages/[lang]/search.astro');
for (const lang of ['ko', 'jp', 'en']) {
  assert.match(searchPage, new RegExp(`params: \\{ lang: '${lang}' \\}`));
}
assert.match(searchPage, /new PagefindUI/);
assert.match(searchPage, /triggerFilters\(\{ language: \[lang\] \}\)/);
assert.match(searchPage, /\/pagefind\/pagefind-ui\.js/);
assert.match(searchPage, /\/pagefind\/pagefind-ui\.css/);

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

const outputRoot = join(root, '.vercel/output/static');
if (existsSync(outputRoot)) {
  for (const lang of ['ko', 'jp', 'en']) {
    const htmlPath = join(outputRoot, lang, 'search', 'index.html');
    if (existsSync(htmlPath)) {
      assert.match(readFileSync(htmlPath, 'utf8'), /id="search"/);
    }
  }

  const pagefindRoot = join(outputRoot, 'pagefind');
  if (existsSync(pagefindRoot)) {
    assert.ok(existsSync(join(pagefindRoot, 'pagefind-ui.js')), 'Pagefind UI JS should be generated');
    assert.ok(existsSync(join(pagefindRoot, 'pagefind-ui.css')), 'Pagefind UI CSS should be generated');
  }
}

console.log('Validated Pagefind search source configuration.');
