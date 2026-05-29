import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  getBlogLanguageFromContentPath,
  getBlogLanguageFromId,
  getBlogLanguageFromPost,
  getBlogLanguageFromRouteParam,
  getBlogSlugFromId,
  getBlogUrlFromId,
  getBlogUrlFromPost,
  isBlogLanguage,
} from '../src/utils/blog-routing.ts';

const root = process.cwd();
const expectedUrls = [
  ['ko/devlog/BLOG/Blog_Develop_10', '/ko/blog/devlog/blog/blog_develop_10/'],
  ['en/devlog/BLOG/Blog_Develop_10', '/en/blog/devlog/blog/blog_develop_10/'],
  ['jp/devlog/BLOG/Blog_Develop_10', '/jp/blog/devlog/blog/blog_develop_10/'],
  ['ko/research/ai-agents/example', '/ko/blog/research/ai-agents/example/'],
  ['en/research/ai-agents/example', '/en/blog/research/ai-agents/example/'],
];

for (const [postId, expectedUrl] of expectedUrls) {
  assert.equal(getBlogUrlFromId(postId), expectedUrl);
}

assert.equal(isBlogLanguage('ko'), true);
assert.equal(isBlogLanguage('fr'), false);
assert.equal(getBlogLanguageFromId('ko/devlog/BLOG/Blog_Develop_10'), 'ko');
assert.equal(getBlogLanguageFromId('devlog/BLOG/Blog_Develop_10', 'en'), 'en');
assert.equal(getBlogLanguageFromRouteParam('jp'), 'jp');
assert.equal(
  getBlogLanguageFromContentPath('/Users/example/src/content/blog/en/devlog/BLOG/Blog_Develop_10.mdx'),
  'en',
);
assert.equal(getBlogLanguageFromPost({ id: 'jp/devlog/BLOG/Blog_Develop_10' }), 'jp');
assert.equal(
  getBlogLanguageFromPost({
    id: 'devlog/BLOG/Blog_Develop_10',
    filePath: '/Users/example/src/content/blog/ko/devlog/BLOG/Blog_Develop_10.mdx',
  }),
  'ko',
);

assert.equal(getBlogSlugFromId('ko/research/ai-agents/example'), 'research/ai-agents/example');
assert.equal(getBlogSlugFromId('research/ai-agents/example'), 'research/ai-agents/example');
assert.equal(
  getBlogUrlFromId('research/ai-agents/example', 'ko'),
  '/ko/blog/research/ai-agents/example/',
);
assert.equal(
  getBlogUrlFromPost({
    id: 'research/ai-agents/example',
    filePath: '/Users/example/src/content/blog/jp/research/ai-agents/example.mdx',
  }),
  '/jp/blog/research/ai-agents/example/',
);

assert.throws(() => getBlogUrlFromId('research/ai-agents/example'), /Invalid blog content id/);
assert.throws(() => getBlogLanguageFromRouteParam('fr'), /Invalid blog language/);

for (const [, url] of expectedUrls) {
  assert.equal(url.endsWith('/'), true, `${url} should keep a trailing slash`);
  assert.equal(url.includes('/blog/ko/'), false, `${url} should not put ko after /blog/`);
  assert.equal(url.includes('/blog/en/'), false, `${url} should not put en after /blog/`);
  assert.equal(url.includes('/blog/jp/'), false, `${url} should not put jp after /blog/`);
  assert.equal(/\/(ko|jp|en)\/blog\/\1\//.test(url), false, `${url} should not duplicate lang`);
}

const sitemapPath = join(root, 'dist/client/sitemap.xml');
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  assert.match(sitemap, /https:\/\/hun-bot\.dev\/ko\/blog\//);
  assert.match(sitemap, /https:\/\/hun-bot\.dev\/en\/blog\//);
  assert.match(sitemap, /https:\/\/hun-bot\.dev\/jp\/blog\//);
  assert.match(sitemap, /https:\/\/hun-bot\.dev\/ko\/library\/design\//);
  assert.doesNotMatch(sitemap, /https:\/\/hun-bot\.dev\/blog\//);
  assert.doesNotMatch(sitemap, /https:\/\/hun-bot\.dev\/archive\//);
}

console.log(`Validated ${expectedUrls.length} language-aware blog URL fixtures.`);
